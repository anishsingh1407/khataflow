"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCustomerTransactions } from "@/lib/firestore-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TimelineItem from "@/components/shared/timeline-item";
import { formatCurrency, formatPhoneNumber, formatDateFriendly, formatTime12H } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";
import { generatePDF } from "@/app/reports/statement/page";

export default function CustomerLedgerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Component state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "info">("timeline");
  const [shopName, setShopName] = useState("My Store");
  const [ownerName, setOwnerName] = useState("Owner");
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date("2026-06-07"));

  // Fetch customer details and transaction list
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

    const loadCustomerData = async () => {
      setLoading(true);
      try {
        // Fetch Shop document details
        const shopDocRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopDocRef);
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          setShopDetails(shopData);
          setShopName(shopData.name || "My Store");
          setOwnerName(shopData.ownerName || "Owner");
        }

        // 1. Fetch Customer document
        const custDocRef = doc(db, "shops", shopId, "customers", customerId);
        const custSnap = await getDoc(custDocRef);

        if (custSnap.exists()) {
          setCustomer({ id: custSnap.id, ...custSnap.data() } as Customer);
        } else {
          console.warn("Customer does not exist in Firestore.");
        }

        // 2. Fetch Transactions
        const txnsList = await getCustomerTransactions(shopId, customerId);
        setTransactions(txnsList);
      } catch (err) {
        console.error("Error loading customer details/transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [shopId, customerId, authLoading, user, router]);

  const handleSendReminder = () => {
    if (!customer) return;
    const message = `Namaste ${customer.name} ji 🙏\nAapka ${shopName} mein ₹${currentBalance} udhar pending hai.\nKripya jald settlement karein.\n- ${ownerName}`;
    const cleanPhone = customer.phone.replace(/\D/g, "");
    const last10 = cleanPhone.slice(-10);
    window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handlePrevMonth = () => {
    setPickerDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setPickerDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleGenerateAndShare = async () => {
    if (!customer) return;
    try {
      const monthStr = pickerDate.toISOString().substring(0, 7); // YYYY-MM
      const filteredTxns = transactions.filter((t) => t.date && t.date.startsWith(monthStr));
      const periodLabel = pickerDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      const customerName = customer.name;
      const fileName = `${customerName}-statement.pdf`;

      const doc = generatePDF({
        customer,
        transactions: filteredTxns,
        shopDetails,
        startDateStr: `${monthStr}-01`,
        endDateStr: `${monthStr}-31`,
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
        const file = new File([pdfBlob], `${customerName}-statement.pdf`, { type: "application/pdf" });
        await navigator.share({
          title: "Account Statement",
          text: `Hello ${customer.name}, please find your statement for ${shopDetails?.name || "our shop"} for ${periodLabel}.`,
          files: [file],
        });
      } else {
        doc.save(fileName);
        const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
        const text = `Hello ${customer.name}, please find your statement for ${shopDetails?.name || "our shop"} for ${periodLabel}. Total pending outstanding balance is ₹${customer.balance || 0}. You can pay directly using UPI: ${upiId}. Thank you!`;
        const cleanPhone = customer.phone.replace(/\D/g, "");
        const last10 = cleanPhone.slice(-10);
        window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(text)}`, "_blank");
      }
      setIsMonthModalOpen(false);
    } catch (err) {
      console.error("Error generating/sharing monthly statement:", err);
      const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
      const periodLabel = pickerDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      const text = `Hello ${customer.name}, please find your statement for ${shopDetails?.name || "our shop"} for ${periodLabel}. Total pending outstanding balance is ₹${customer.balance || 0}. You can pay directly using UPI: ${upiId}. Thank you!`;
      const cleanPhone = customer.phone.replace(/\D/g, "");
      const last10 = cleanPhone.slice(-10);
      window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const isDataLoading = authLoading || loading;

  // Financial calculations
  const totalUdhar = transactions
    .filter((t) => t.type === "udhar")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalPayments = transactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const currentBalance = customer?.balance || 0;

  const lastUpdatedStr = customer?.lastUpdated
    ? new Date(customer.lastUpdated).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No updates yet";

  // Group transactions by date
  const dateGroups: Record<string, Transaction[]> = {};
  transactions.forEach((txn) => {
    if (!dateGroups[txn.date]) dateGroups[txn.date] = [];
    dateGroups[txn.date].push(txn);
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-[var(--font-body)] text-[14px] leading-[20px]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}} />
      {/* Top AppBar */}
      <header className="bg-surface fixed top-0 w-full z-50 flex justify-between items-center px-[16px] h-14 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-transform active:scale-95 no-print">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
              {isDataLoading ? "?" : customer?.initials || "C"}
            </div>
            <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary max-w-[150px] truncate">
              {isDataLoading ? "Loading..." : customer?.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">notifications</span>
          </button>
          <button onClick={() => router.push(`/reports/statement?customerId=${customerId}`)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
          </button>
        </div>
      </header>

      {isDataLoading ? (
        // Loading Skeleton
        <main className="flex-1 pt-16 pb-32 px-[16px] space-y-6">
          <div className="h-44 bg-surface-container-low animate-pulse rounded-xl border border-outline-variant/10" />
          <div className="h-10 bg-surface-container-low animate-pulse rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-container-low animate-pulse rounded-xl border border-outline-variant/10" />
            ))}
          </div>
        </main>
      ) : (
        // Main Content
        <main className="flex-1 pt-16 pb-32 px-[16px]">
          {/* Customer Identity & Balance Card */}
          <section className="mb-6">
            <div className="p-[24px] rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant uppercase tracking-wider mb-1">
                    Customer Phone
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-[var(--font-body)] text-[16px] leading-[24px] font-semibold">
                      {formatPhoneNumber(customer?.phone || "")}
                    </p>
                    {currentBalance > 0 && (
                      <button
                        onClick={handleSendReminder}
                        className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 transition-colors active:scale-95 no-print"
                        title="Send WhatsApp Reminder"
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsMonthModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-[12px] font-semibold hover:bg-primary/20 active:scale-95 transition-all no-print ml-2"
                      title="Generate Monthly Statement"
                    >
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Monthly Statement
                    </button>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[12px] leading-[16px] tracking-[0.5px] font-medium ${
                  currentBalance > 0 ? "bg-error-container text-on-error-container" : "bg-primary-container text-on-primary-container"
                }`}>
                  {currentBalance > 0 ? "Payment Due" : "Settled"}
                </div>
              </div>

              {/* Financial Summary Balance */}
              <div className={`p-[24px] rounded-xl flex justify-between items-center ${
                currentBalance > 0 ? "bg-error-container" : "bg-primary-container/20"
              }`}>
                <div>
                  <h3 className={`font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold mb-1 ${
                    currentBalance > 0 ? "text-on-error-container" : "text-primary"
                  }`}>
                    Current Balance
                  </h3>
                  <p className={`font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-bold ${
                    currentBalance > 0 ? "text-error" : "text-primary"
                  }`}>
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase mb-2 ${
                    currentBalance > 0 ? "text-on-error-container" : "text-primary"
                  }`}>
                    {currentBalance > 0 ? "Udhar Due" : "Settled"}
                  </span>
                  <span className={`material-symbols-outlined text-[40px] ${
                    currentBalance > 0 ? "text-error" : "text-primary"
                  }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {currentBalance > 0 ? "trending_up" : "check_circle"}
                  </span>
                </div>
              </div>

              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant mt-4 text-center italic">
                Last updated: {lastUpdatedStr}
              </p>
            </div>
          </section>

          {/* Tab Navigation */}
          <nav className="flex border-b border-outline-variant mb-6">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 py-3 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold transition-colors ${
                activeTab === "timeline"
                  ? "text-primary border-b-2 border-primary active-pill"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-3 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold transition-colors ${
                activeTab === "info"
                  ? "text-primary border-b-2 border-primary active-pill"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Info
            </button>
          </nav>

          {/* Timeline View */}
          {activeTab === "timeline" && (
            transactions.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center text-on-surface-variant italic">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(dateGroups).map(([date, txns]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-[1px] flex-1 bg-outline-variant" />
                      <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant px-2 bg-surface">
                        {formatDateFriendly(date)}
                      </span>
                      <div className="h-[1px] flex-1 bg-outline-variant" />
                    </div>

                    {/* Transaction Items */}
                    {txns.map((txn, i) => (
                      <TimelineItem
                        key={txn.id}
                        type={txn.type}
                        title={txn.description}
                        details={txn.details}
                        amount={txn.amount}
                        time={formatTime12H(txn.time)}
                        isLast={i === txns.length - 1}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Info View */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="bg-surface-container p-[24px] rounded-xl">
                <h4 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold mb-4">
                  Customer Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-outline-variant">
                    <span className="text-on-surface-variant">Full Name</span>
                    <span className="font-semibold text-right">{customer?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant">
                    <span className="text-on-surface-variant">Phone Number</span>
                    <span className="font-semibold">{formatPhoneNumber(customer?.phone || "")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant">
                    <span className="text-on-surface-variant">Address</span>
                    <span className="font-semibold text-right">{customer?.address || "No address provided"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant">
                    <span className="text-on-surface-variant">Total Udhar Given</span>
                    <span className="font-semibold text-error">{formatCurrency(totalUdhar)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant">
                    <span className="text-on-surface-variant">Total Payments Received</span>
                    <span className="font-semibold text-primary">{formatCurrency(totalPayments)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-on-surface-variant">Member Since</span>
                    <span className="font-semibold">{customer?.memberSince || "New customer"}</span>
                  </div>
                </div>
              </div>

              <div className="h-48 rounded-xl relative overflow-hidden group">
                <img
                  alt="Store Location"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWKbFs1bh7lzxaLkm8qKH_LuJyIf65nkGMmhixoQfmihmFSSyGw8l1Ud9SvcXk76xCJn0FalMT7WZSwObhP7utJ0adjyZijxZMEtYSbmh0zhu2XamBtSnrT4YOMkMB-HEbqn-GdirDwebTam8sJOHTV5OglGfIfNrOPkhdI0wRtMG6loytgEziLX9D706sZFlaO6LQ56BYhBQ1BVL3jhLFOroi0VmLvcvlX65fw9wqCXKuPWKkfQqhNj5jP53GOw7o8MAxzi4oPPSb"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-background/60 to-transparent flex items-end p-4">
                  <p className="text-white font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    Verified Customer Address
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Sticky Footer Actions */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest shadow-[0_-8px_24px_rgba(0,0,0,0.05)] border-t border-outline-variant px-[16px] py-4 no-print">
        <div className="flex gap-4 max-w-md mx-auto">
          <Link
            href="/transactions/add-udhar"
            className="flex-grow h-14 bg-error text-on-error rounded-2xl font-[var(--font-body)] text-[16px] font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">remove_circle</span>
            Give Udhar
          </Link>
          <Link
            href="/transactions/add-payment"
            className="flex-grow h-14 bg-primary text-on-primary rounded-2xl font-[var(--font-body)] text-[16px] font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Got Payment
          </Link>
        </div>
      </footer>

      {/* Month Picker Modal */}
      {isMonthModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center animate-fade-in p-4 no-print">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6 space-y-6 shadow-2xl border border-outline-variant/30 animate-scale-in">
            <div className="text-center space-y-2">
              <h3 className="font-[var(--font-heading)] text-[18px] leading-[24px] font-bold text-primary">
                Select Statement Month
              </h3>
              <p className="text-xs text-on-surface-variant">
                Generate and share credit history PDF for a specific month
              </p>
            </div>

            {/* Picker controls */}
            <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-primary transition-all active:scale-90"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="font-[var(--font-body)] text-[15px] font-bold text-on-surface">
                {pickerDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-primary transition-all active:scale-90"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateAndShare}
                className="w-full h-12 bg-primary text-on-primary rounded-xl font-semibold text-[14px] shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                Generate & Share
              </button>
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(false)}
                className="w-full h-12 bg-surface-container-high text-on-surface rounded-xl font-semibold text-[14px] hover:bg-surface-container-highest active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
