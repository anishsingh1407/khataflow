"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getCustomers, getCustomerTransactions } from "@/lib/firestore-service";
import { formatCurrencyFull, formatPhoneNumber } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generatePDF({
  customer,
  transactions,
  shopDetails,
  startDateStr,
  endDateStr,
}: {
  customer: Customer;
  transactions: Transaction[];
  shopDetails: any;
  startDateStr?: string;
  endDateStr?: string;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Sort transactions chronologically
  const chronTxns = [...transactions].sort((a, b) => {
    const dateCompare = (a.date || "").localeCompare(b.date || "");
    if (dateCompare !== 0) return dateCompare;
    return (a.time || "").localeCompare(b.time || "");
  });

  const totalUdhar = transactions.filter((t) => t.type === "udhar").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = transactions.filter((t) => t.type === "payment").reduce((sum, t) => sum + (t.amount || 0), 0);
  const netBalance = customer.balance || 0;

  // 1. Header Section
  doc.setTextColor(27, 94, 32); // #1B5E20
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(shopDetails?.name || "KhataFlow Shop", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(102, 102, 102);
  doc.text(shopDetails?.address || "Shop Address", 14, 25);
  doc.text(`Contact: ${shopDetails?.phone || ""}`, 14, 30);
  doc.text(`Owner: ${shopDetails?.ownerName || ""}`, 14, 35);

  doc.setTextColor(27, 94, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ACCOUNT STATEMENT", 140, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(102, 102, 102);
  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  doc.text(`Generated: ${generatedOn}`, 140, 25);

  // Line divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);

  // 2. Customer Info Section
  doc.setTextColor(51, 51, 51);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Customer Details:", 14, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${customer.name}`, 14, 54);
  doc.text(`Phone: ${customer.phone ? formatPhoneNumber(customer.phone) : ""}`, 14, 60);

  // Statement Period
  let periodText = "";
  if (startDateStr || endDateStr) {
    const startStr = startDateStr ? new Date(startDateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Start";
    const endStr = endDateStr ? new Date(endDateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "End";
    periodText = `${startStr} to ${endStr}`;
  } else {
    const now = new Date();
    const currentMonthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    periodText = currentMonthName;
  }
  doc.text(`Statement Period: ${periodText}`, 14, 66);

  // 3. Summary Box
  doc.setFillColor(240, 245, 240);
  doc.roundedRect(120, 45, 76, 25, 2, 2, "F");
  doc.setTextColor(51, 51, 51);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SUMMARY", 124, 50);

  doc.setFont("helvetica", "normal");
  doc.text(`Total Udhar:`, 124, 55);
  doc.text(`Total Paid:`, 124, 60);
  doc.setFont("helvetica", "bold");
  doc.text(`Net Balance:`, 124, 65);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(211, 47, 47); // red
  doc.text(`₹${totalUdhar}`, 160, 55);
  doc.setTextColor(46, 125, 50); // green
  doc.text(`₹${totalPaid}`, 160, 60);
  doc.setTextColor(27, 94, 32); // deep green
  doc.setFont("helvetica", "bold");
  doc.text(`₹${netBalance < 0 ? 0 : netBalance}`, 160, 65);

  // 4. Table data using autoTable
  let currentRunning = 0;
  const tableData = chronTxns.map((t) => {
    const debit = t.type === "payment" ? t.amount : 0;
    const credit = t.type === "udhar" ? t.amount : 0;
    currentRunning = currentRunning - debit + credit;
    const formattedDate = t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "";
    return [
      formattedDate,
      t.description || (t.type === "udhar" ? "Udhar Given" : "Payment Received"),
      debit > 0 ? `₹${debit}` : "-",
      credit > 0 ? `₹${credit}` : "-",
      `₹${currentRunning}`,
    ];
  });

  autoTable(doc, {
    startY: 75,
    head: [["Date", "Particulars", "Debit (₹)", "Credit (₹)", "Balance (₹)"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [27, 94, 32],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  // 5. Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.text("Generated by KhataFlow - Manage your business finance efficiently.", 14, finalY);

  doc.setFont("helvetica", "normal");
  doc.text(`Shop Owner: ${shopDetails?.ownerName || ""}`, 140, finalY);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 140, finalY + 4);

  return doc;
}

function StatementPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") || "";

  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Component state
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!shopId) {
      router.push("/setup");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all customers for selector dropdown
        const custList = await getCustomers(shopId);
        setCustomers(custList);

        // 2. Fetch shop details
        const shopSnap = await getDoc(doc(db, "shops", shopId));
        if (shopSnap.exists()) {
          setShopDetails(shopSnap.data());
        }

        // 3. Fetch customer specific details if customerId exists
        if (customerId) {
          const custSnap = await getDoc(doc(db, "shops", shopId, "customers", customerId));
          if (custSnap.exists()) {
            setSelectedCustomer({ id: custSnap.id, ...custSnap.data() } as Customer);
          }
          const txnsList = await getCustomerTransactions(shopId, customerId);
          setTransactions(txnsList);
        } else {
          setSelectedCustomer(null);
          setTransactions([]);
        }
      } catch (err) {
        console.error("Error loading statement page data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shopId, customerId, authLoading, user, router]);

  // Handle loading state
  if (authLoading || loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-[var(--font-body)] text-[14px]">
        <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-[16px] h-14 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <h1 className="font-[var(--font-heading)] text-[20px] font-bold text-primary">Loading statement...</h1>
          </div>
        </header>
        <main className="mt-20 px-[16px] space-y-6 max-w-2xl mx-auto">
          <div className="h-40 bg-surface-container-low animate-pulse rounded-2xl" />
          <div className="h-60 bg-surface-container-low animate-pulse rounded-2xl" />
        </main>
      </div>
    );
  }

  // Filter list of customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // If no customerId, render customer selector list
  if (!customerId) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-[var(--font-body)] text-[14px] leading-[20px]">
        <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-[16px] h-14 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary">Select Customer</h1>
          </div>
        </header>

        <main className="mt-14 flex-grow p-[16px] w-full max-w-2xl mx-auto space-y-4">
          <p className="text-on-surface-variant font-medium pt-2">Select a customer to view their statement:</p>
          <div className="flex items-center gap-[8px] border border-outline-variant bg-surface-container-lowest rounded-xl px-[16px] h-12 focus-within:border-primary transition-colors mb-3">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-[14px] placeholder:text-outline-variant/60"
            />
          </div>

          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <p className="text-center py-8 text-on-surface-variant italic">No customers found.</p>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/reports/statement?customerId=${c.id}`)}
                  className="w-full bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center justify-between hover:shadow-md transition-all text-left animate-fade-in-up"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${c.avatarColor || "bg-primary/10 text-primary"}`}>
                      {c.initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface">{c.name}</h4>
                      <p className="text-xs text-on-surface-variant">{formatPhoneNumber(c.phone)}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary">arrow_forward</span>
                </button>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // Calculate chronological entries and running balances
  const chronTxns = [...transactions].sort((a, b) => {
    const dateCompare = (a.date || "").localeCompare(b.date || "");
    if (dateCompare !== 0) return dateCompare;
    return (a.time || "").localeCompare(b.time || "");
  });

  const rawEntries = chronTxns.map((t) => ({
    date: t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "",
    particulars: t.description || (t.type === "udhar" ? "Udhar Given" : "Payment Received"),
    debit: t.type === "payment" ? t.amount : 0,
    credit: t.type === "udhar" ? t.amount : 0,
  }));

  let currentRunning = 0;
  const entriesWithBalance = rawEntries.map((entry) => {
    currentRunning = currentRunning - entry.debit + entry.credit;
    return { ...entry, balance: currentRunning };
  });

  const totalUdhar = transactions.filter((t) => t.type === "udhar").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = transactions.filter((t) => t.type === "payment").reduce((sum, t) => sum + (t.amount || 0), 0);
  const netBalance = selectedCustomer?.balance || 0;

  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });



  const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopDetails?.name || "KhataFlow Shop")}&am=${netBalance > 0 ? netBalance : 0}&cu=INR`
  )}`;

  const handleShare = async () => {
    if (!selectedCustomer) return;
    try {
      const customerName = selectedCustomer.name;
      const fileName = `${customerName}-statement.pdf`;
      const doc = generatePDF({
        customer: selectedCustomer,
        transactions,
        shopDetails,
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [new File([new Blob()], "a.pdf", { type: "application/pdf" })],
        })
      ) {
        const pdfBlob = doc.output("blob");
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        await navigator.share({
          title: "Account Statement",
          text: `Hello ${selectedCustomer.name}, please find your statement for ${shopDetails?.name || "our shop"}. Total pending outstanding balance is ₹${selectedCustomer.balance || 0}.`,
          files: [file],
        });
      } else {
        doc.save(fileName);
        const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
        const text = `Hello ${selectedCustomer.name}, please find your statement for ${shopDetails?.name || "our shop"}. Total pending outstanding balance is ₹${selectedCustomer.balance || 0}. You can pay directly using UPI: ${upiId}. Thank you!`;
        const cleanPhone = selectedCustomer.phone.replace(/\D/g, "");
        const last10 = cleanPhone.slice(-10);
        window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      console.error("Error sharing PDF statement:", err);
      const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
      const text = `Hello ${selectedCustomer.name}, please find your statement for ${shopDetails?.name || "our shop"}. Total pending outstanding balance is ₹${selectedCustomer.balance || 0}. You can pay directly using UPI: ${upiId}. Thank you!`;
      const cleanPhone = selectedCustomer.phone.replace(/\D/g, "");
      const last10 = cleanPhone.slice(-10);
      window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedCustomer) return;
    const customerName = selectedCustomer.name;
    const doc = generatePDF({
      customer: selectedCustomer,
      transactions,
      shopDetails,
    });
    doc.save(`${customerName}-statement.pdf`);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-[var(--font-body)] text-[14px] leading-[20px] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}} />

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-[16px] h-14 border-b border-outline-variant/10 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-transform duration-150 scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary">Statement Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-transform duration-150 scale-95 text-primary">
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </header>

      <main className="mt-14 mb-32 flex-grow p-[16px] w-full max-w-2xl mx-auto">
        <section className="bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant paper-texture">
          <div className="p-[24px] space-y-[24px]">
            {/* Shop Info & Statement Header */}
            <div className="flex flex-col justify-between gap-[16px] border-b border-outline-variant pb-[24px]">
              <div className="space-y-[4px]">
                <h2 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold text-primary font-bold">
                  {shopDetails?.name || "Shop Name"}
                </h2>
                <p className="text-on-surface-variant">{shopDetails?.address || "Shop Address"}</p>
                <p className="text-on-surface-variant">Owner: {shopDetails?.ownerName || "Ramesh"}</p>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
                  Contact: {formatPhoneNumber(shopDetails?.phone || "")}
                </p>
              </div>
              <div className="text-left space-y-[4px]">
                <div className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                  Account Statement
                </div>
                <p className="font-semibold text-on-surface mt-2 text-[14px]">
                  Customer: {selectedCustomer?.name} ({formatPhoneNumber(selectedCustomer?.phone || "")})
                </p>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium pt-2">Date: {todayStr}</p>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">Time: {timeStr}</p>
              </div>
            </div>

            {/* Balance Summary Grid */}
            <div className="grid grid-cols-2 gap-[12px] bg-surface-container-low p-[16px] rounded-xl border border-outline-variant">
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Prev. Balance</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">{formatCurrencyFull(0)}</p>
              </div>
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Total Udhar</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-error">{formatCurrencyFull(totalUdhar)}</p>
              </div>
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Total Paid</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary">{formatCurrencyFull(totalPaid)}</p>
              </div>
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Net Balance</p>
                <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold font-bold text-on-surface">{formatCurrencyFull(netBalance < 0 ? 0 : netBalance)}</p>
                {netBalance > 0 && (
                  <button onClick={handleShare} className="mt-2 flex items-center gap-1 px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all no-print">
                    <span className="material-symbols-outlined text-[14px]">chat</span>
                    WhatsApp Reminder
                  </button>
                )}
              </div>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto -mx-[24px] px-[24px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container border-y border-outline-variant">
                    <th className="py-[12px] px-[16px] text-left font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant whitespace-nowrap">Date</th>
                    <th className="py-[12px] px-[16px] text-left font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Particulars</th>
                    <th className="py-[12px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Debit (In)</th>
                    <th className="py-[12px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Credit (Out)</th>
                    <th className="py-[12px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {entriesWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant italic">
                        No transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    entriesWithBalance.map((entry, i) => (
                      <tr key={i}>
                        <td className="py-[16px] px-[16px] whitespace-nowrap text-on-surface-variant">{entry.date}</td>
                        <td className="py-[16px] px-[16px] font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">{entry.particulars}</td>
                        <td className="py-[16px] px-[16px] text-right text-primary">{entry.debit > 0 ? formatCurrencyFull(entry.debit) : "-"}</td>
                        <td className="py-[16px] px-[16px] text-right text-error">{entry.credit > 0 ? formatCurrencyFull(entry.credit) : "-"}</td>
                        <td className="py-[16px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-bold text-on-surface">{formatCurrencyFull(entry.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* QR Code Section */}
            {netBalance > 0 && (
              <div className="flex flex-col items-center justify-center py-[24px] bg-surface-container-lowest border-y border-dashed border-outline-variant gap-[12px]">
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary uppercase tracking-widest">Scan to Pay</p>
                <div className="p-2 bg-white border-2 border-primary rounded-xl shadow-sm">
                  <img
                    alt="UPI QR Code"
                    className="w-32 h-32"
                    src={qrCodeUrl}
                  />
                </div>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                  UPI ID: {upiId}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col items-center justify-center pt-[32px] border-t border-dashed border-outline-variant">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[18px]">receipt_long</span>
                </div>
                <span className="font-[var(--font-heading)] text-on-surface-variant text-base">Generated via KhataFlow</span>
              </div>
              <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                Manage your business finance efficiently.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-surface p-[16px] flex flex-col gap-[12px] border-t border-outline-variant shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-50 no-print">
        <button onClick={handleShare} className="w-full px-[24px] py-[12px] bg-primary text-on-primary rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined">share</span>
          Share on WhatsApp
        </button>
        <button onClick={handleDownloadPDF} className="w-full px-[24px] py-[12px] bg-surface-container-high border border-outline text-on-surface-variant rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-highest active:scale-95 transition-all">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Download PDF
        </button>
      </div>
    </div>
  );
}

export default function StatementPreviewPage() {
  return (
    <Suspense fallback={
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-[var(--font-body)] text-[14px]">
        <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-[16px] h-14 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <h1 className="font-[var(--font-heading)] text-[20px] font-bold text-primary">Loading statement...</h1>
          </div>
        </header>
        <main className="mt-20 px-[16px] space-y-6 max-w-2xl mx-auto">
          <div className="h-40 bg-surface-container-low animate-pulse rounded-2xl" />
          <div className="h-60 bg-surface-container-low animate-pulse rounded-2xl" />
        </main>
      </div>
    }>
      <StatementPreview />
    </Suspense>
  );
}
