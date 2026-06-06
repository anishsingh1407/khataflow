"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import BottomNav from "@/components/layout/bottom-nav";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";
import { generateStatementPDF } from "@/app/reports/statement/page";

interface ActivityItem {
  id: string;
  customerId: string;
  customerName: string;
  initials: string;
  avatarColor: string;
  type: "udhar" | "payment";
  amount: number;
  description: string;
  date: string;
  time: string;
}

export default function ReportsDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Component state
  const [shopName, setShopName] = useState("Shop Name");
  const [loading, setLoading] = useState(true);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [sendingProgress, setSendingProgress] = useState<string | null>(null);

  // Raw fetched lists
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Computed statistics
  const [totalSales, setTotalSales] = useState(0);
  const [collected, setCollected] = useState(0);
  const [pending, setPending] = useState(0);
  
  const [topDefaulters, setTopDefaulters] = useState<Customer[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Chart states
  const [barHeights, setBarHeights] = useState<string[]>([]);
  const [barLabels, setBarLabels] = useState<string[]>([]);
  const [barValues, setBarValues] = useState<string[]>([]);
  const [barOpacities, setBarOpacities] = useState<string[]>([]);

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

    const loadReportData = async () => {
      setLoading(true);
      try {
        // 1. Fetch shop details
        const shopSnap = await getDoc(doc(db, "shops", shopId));
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          setShopDetails(shopData);
          setShopName(shopData.name || "Shop Name");
        }

        // 2. Fetch all customers
        const custSnap = await getDocs(collection(db, "shops", shopId, "customers"));
        const customersList = custSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Customer[];
        setAllCustomers(customersList);

        // 3. Fetch all transactions (ordered by date desc)
        const txnsQuery = query(
          collection(db, "shops", shopId, "transactions"),
          orderBy("date", "desc")
        );
        const txnsSnap = await getDocs(txnsQuery);
        const transactionsList = txnsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Transaction[];
        setAllTransactions(transactionsList);

      } catch (err) {
        console.error("Error loading reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [shopId, authLoading, user, router]);

  // 2. Compute dynamic stats and charts when filters or list changes
  useEffect(() => {
    // Filter transactions by date range
    const filteredTxns = allTransactions.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });

    // Total Sales = sum of filtered udhar transactions
    const salesSum = filteredTxns
      .filter((t) => t.type === "udhar")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    setTotalSales(salesSum);

    // Collected = sum of filtered payment transactions
    const collectedSum = filteredTxns
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    setCollected(collectedSum);

    // Pending = static outstanding sum of all customer balances
    const pendingSum = allCustomers.reduce((sum, c) => sum + (c.balance || 0), 0);
    setPending(pendingSum);

    // Filter Top Defaulters based on current balances
    const sortedDefaulters = [...allCustomers]
      .filter((c) => (c.balance || 0) > 0)
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 5);
    setTopDefaulters(sortedDefaulters);

    // Build customer visuals mapping for recent activity
    const customerMap: Record<string, string> = {};
    const customerInitialsMap: Record<string, string> = {};
    const customerColorMap: Record<string, string> = {};

    allCustomers.forEach((c) => {
      customerMap[c.id] = c.name;
      customerInitialsMap[c.id] = c.initials || "C";
      customerColorMap[c.id] = c.avatarColor || "bg-primary/10 text-primary";
    });

    // Recent activity = last 10 transactions in filtered range
    const lastTenTxns = filteredTxns.slice(0, 10).map((t) => ({
      id: t.id,
      customerId: t.customerId,
      customerName: customerMap[t.customerId] || "Unknown Customer",
      initials: customerInitialsMap[t.customerId] || "C",
      avatarColor: customerColorMap[t.customerId] || "bg-surface-container-highest text-on-surface",
      type: t.type,
      amount: t.amount || 0,
      description: t.description || "",
      date: t.date || "",
      time: t.time || "",
    }));
    setRecentActivity(lastTenTxns);

    // Collection Trend chart = group filtered payments by hour
    const payments = filteredTxns.filter((t) => t.type === "payment");
    const bins = [0, 0, 0, 0, 0, 0];
    payments.forEach((t) => {
      const hour = parseInt((t.time || "").split(":")[0]) || 0;
      if (hour < 10) bins[0] += t.amount || 0;
      else if (hour < 12) bins[1] += t.amount || 0;
      else if (hour < 14) bins[2] += t.amount || 0;
      else if (hour < 16) bins[3] += t.amount || 0;
      else if (hour < 18) bins[4] += t.amount || 0;
      else bins[5] += t.amount || 0;
    });

    const maxVal = Math.max(...bins);
    const heights = bins.map((v) => {
      if (maxVal === 0) return "0%";
      return `${Math.max(8, Math.round((v / maxVal) * 90))}%`;
    });
    const labels = ["08 AM", "10 AM", "12 PM", "02 PM", "04 PM", "06 PM"];
    const values = bins.map((v) => formatCurrency(v));
    const opacities = [
      "bg-primary/20",
      "bg-primary/25",
      "bg-primary/30",
      "bg-primary/40",
      "bg-primary/60",
      "bg-primary",
    ];

    setBarHeights(heights);
    setBarLabels(labels);
    setBarValues(values);
    setBarOpacities(opacities);
  }, [allTransactions, allCustomers, startDate, endDate]);

  const handleSendAll = async () => {
    const targets = allCustomers.filter((c) => (c.balance || 0) > 0);
    if (targets.length === 0) return;

    for (let i = 0; i < targets.length; i++) {
      const customer = targets[i];
      setSendingProgress(`Sending ${i + 1} of ${targets.length}...`);

      const currentMonthStr = "2026-06";
      const filteredTxns = allTransactions.filter(
        (t) => t.customerId === customer.id && t.date && t.date.startsWith(currentMonthStr)
      );

      const doc = generateStatementPDF({
        customer,
        transactions: filteredTxns,
        shopDetails,
        startDateStr: `${currentMonthStr}-01`,
        endDateStr: `${currentMonthStr}-30`,
      });

      const fileName = `${customer.name}-June-2026-statement.pdf`;

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [new File([new Blob()], "a.pdf", { type: "application/pdf" })],
        })
      ) {
        try {
          const blob = doc.output("blob");
          const file = new File([blob], fileName, { type: "application/pdf" });
          await navigator.share({
            title: "Account Statement",
            text: `Hello ${customer.name}, please find your statement for ${shopName} for June 2026.`,
            files: [file],
          });
        } catch (e) {
          console.error("Share failed", e);
        }
      } else {
        doc.save(fileName);
        const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
        const text = `Hello ${customer.name}, please find your statement for ${shopName} for June 2026. Total pending outstanding balance is ₹${customer.balance || 0}. You can pay directly using UPI: ${upiId}. Thank you!`;
        const cleanPhone = customer.phone.replace(/\D/g, "");
        const last10 = cleanPhone.slice(-10);
        window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(text)}`, "_blank");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    setSendingProgress(null);
  };

  const handleSendSinglePDF = async (customer: Customer) => {
    const currentMonthStr = "2026-06";
    const filteredTxns = allTransactions.filter(
      (t) => t.customerId === customer.id && t.date && t.date.startsWith(currentMonthStr)
    );

    const doc = generateStatementPDF({
      customer,
      transactions: filteredTxns,
      shopDetails,
      startDateStr: `${currentMonthStr}-01`,
      endDateStr: `${currentMonthStr}-30`,
    });

    const fileName = `${customer.name}-June-2026-statement.pdf`;

    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [new File([new Blob()], "a.pdf", { type: "application/pdf" })],
      })
    ) {
      try {
        const blob = doc.output("blob");
        const file = new File([blob], fileName, { type: "application/pdf" });
        await navigator.share({
          title: "Account Statement",
          text: `Hello ${customer.name}, please find your statement for ${shopName} for June 2026.`,
          files: [file],
        });
      } catch (e) {
        console.error("Share failed", e);
      }
    } else {
      doc.save(fileName);
      const upiId = shopDetails?.upiId || (shopDetails?.phone ? `${shopDetails.phone}@upi` : "shop@upi");
      const text = `Hello ${customer.name}, please find your statement for ${shopName} for June 2026. Total pending outstanding balance is ₹${customer.balance || 0}. You can pay directly using UPI: ${upiId}. Thank you!`;
      const cleanPhone = customer.phone.replace(/\D/g, "");
      const last10 = cleanPhone.slice(-10);
      window.open(`https://wa.me/91${last10}?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const reportPeriodLabel = (() => {
    if (startDate || endDate) {
      const startLbl = startDate
        ? new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Start";
      const endLbl = endDate
        ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "End";
      return `${startLbl} - ${endLbl}`;
    }
    return "All Time";
  })();

  const hasPayments = barValues.length > 0 && barValues.some((val) => val !== formatCurrency(0));

  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      {/* Top App Bar */}
      <header className="bg-surface sticky top-0 z-40 flex justify-between items-center w-full px-[16px] h-14 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-primary-fixed text-[18px]">store</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary truncate max-w-[180px]">
            {loading ? "Loading..." : shopName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary text-on-primary px-3 py-1 rounded-full font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
            Owner
          </span>
          <button
            onClick={() => router.back()}
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-high rounded-full transition-transform active:scale-95"
          >
            arrow_back
          </button>
        </div>
      </header>

      {loading ? (
        // Loading Skeleton
        <main className="px-[16px] pt-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-8 bg-surface-container-low animate-pulse rounded w-1/3" />
          <section className="grid grid-cols-2 gap-4">
            <div className="col-span-2 h-32 bg-surface-container-low animate-pulse rounded-2xl" />
            <div className="h-24 bg-surface-container-low animate-pulse rounded-2xl" />
            <div className="h-24 bg-surface-container-low animate-pulse rounded-2xl" />
          </section>
          <div className="h-40 bg-surface-container-low animate-pulse rounded-2xl" />
          <div className="h-60 bg-surface-container-low animate-pulse rounded-2xl" />
        </main>
      ) : (
        // Main Content
        <main className="px-[16px] pt-4 space-y-6 max-w-2xl mx-auto">
          {/* Header */}
          <section className="flex flex-col gap-[4px]">
            <h2 className="font-[var(--font-heading)] text-[28px] leading-[36px] font-semibold text-on-surface">
              Business Reports
            </h2>
            <p className="font-[var(--font-body)] text-[14px] leading-[20px] text-on-surface-variant">
              Live statistics and customer credit analytics
            </p>
          </section>

          {/* Report Period Filter Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                  Report Period
                </span>
                <span className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                  {reportPeriodLabel}
                </span>
              </div>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-lg text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {showDatePicker ? "Close" : "Change"}
              </button>
            </div>

            {showDatePicker && (
              <div className="pt-2 border-t border-outline-variant/30 space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                    />
                  </div>
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-[13px] py-2 rounded-lg transition-all"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Key Stats Cards — Bento Style */}
          <section className="grid grid-cols-2 gap-4">
            {/* Total Outstanding — Large Card */}
            <div className="col-span-2 bg-error-container text-on-error-container p-5 rounded-2xl shadow-sm border border-error/10 relative overflow-hidden">
              <div className="relative z-10">
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold opacity-90">
                  Total Outstanding (Pending)
                </p>
                <h2 className="font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-semibold mt-1 text-error">
                  {formatCurrency(pending)}
                </h2>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                  Due across all registered ledger customers
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none select-none">
                <span className="material-symbols-outlined text-[120px]">receipt_long</span>
              </div>
            </div>

            {/* Collected Card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                  {startDate || endDate ? "Collected (Filtered)" : "Collected (All-Time)"}
                </p>
              </div>
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
                {formatCurrency(collected)}
              </h3>
            </div>

            {/* Udhar Given / Total Sales Card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-error text-[20px]">trending_up</span>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                  {startDate || endDate ? "Total Sales (Filtered)" : "Total Sales (All-Time)"}
                </p>
              </div>
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-error">
                {formatCurrency(totalSales)}
              </h3>
            </div>
          </section>

          {/* Collection Trend — Bar Chart */}
          <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
                Collection Trend
              </h3>
              <span className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                {startDate || endDate ? "Hourly Collection (Filtered)" : "Hourly Collection (All-Time)"}
              </span>
            </div>

            {!hasPayments ? (
              <div className="h-40 w-full flex flex-col items-center justify-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant gap-2 bg-surface-container-low">
                <span className="material-symbols-outlined text-[32px] text-outline">analytics</span>
                <p className="italic font-medium text-[13px]">No data for selected period</p>
              </div>
            ) : (
              <>
                <div className="h-40 w-full relative flex items-end justify-between gap-1">
                  {barHeights.map((height, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${barOpacities[i]} rounded-t-md group relative transition-all hover:bg-primary`}
                      style={{ height }}
                    >
                      <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {barValues[i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                  {barLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Quick Reports Navigation */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <h3 className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant mb-3 uppercase tracking-wider">
              Sub Reports Directory
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/reports/recovery"
                className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-primary font-semibold text-[13px] hover:bg-primary/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Recovery Health
              </Link>
              <Link
                href="/reports/shift-summary"
                className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-primary font-semibold text-[13px] hover:bg-primary/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Shift Summary
              </Link>
              <Link
                href="/reports/activity-logs"
                className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-primary font-semibold text-[13px] hover:bg-primary/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                Activity Logs
              </Link>
              <Link
                href="/reports/statement"
                className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-primary font-semibold text-[13px] hover:bg-primary/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                Statements PDF
              </Link>
            </div>
          </section>

          {/* Top Defaulters */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold flex items-center gap-2 text-on-surface">
                Top Defaulters
                <span className="bg-error-container text-on-error-container text-[12px] px-2 py-0.5 rounded-full font-bold">
                  {topDefaulters.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {topDefaulters.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-xl text-center text-on-surface-variant italic">
                  All customer accounts settled!
                </div>
              ) : (
                topDefaulters.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center justify-between hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          customer.avatarColor || "bg-error-container text-on-error-container"
                        }`}
                      >
                        {customer.initials}
                      </div>
                      <div>
                        <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                          {customer.name}
                        </h4>
                        <p className="font-[var(--font-body)] text-[12px] leading-[16px] text-on-surface-variant">
                          {formatPhoneNumber(customer.phone)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-[var(--font-heading)] text-[18px] leading-[24px] font-bold text-error">
                        {formatCurrency(customer.balance)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-xl text-center text-on-surface-variant italic">
                  No transactions recorded yet
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${activity.avatarColor}`}
                      >
                        {activity.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold truncate text-on-surface">
                            {activity.customerName}
                          </h4>
                          <span
                            className={`font-[var(--font-heading)] text-[16px] font-bold ${
                              activity.type === "udhar" ? "text-error" : "text-primary"
                            }`}
                          >
                            {activity.type === "udhar" ? "+" : "-"} {formatCurrency(activity.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px]">
                          <span className="truncate pr-2">{activity.description}</span>
                          <span className="flex-shrink-0">{activity.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Monthly Statements Section */}
          <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
                  June 2026 Statements
                </h3>
                <p className="text-xs text-on-surface-variant font-[var(--font-body)]">
                  All active customers with pending credit balance
                </p>
              </div>
              <button
                onClick={handleSendAll}
                disabled={sendingProgress !== null || allCustomers.filter(c => (c.balance || 0) > 0).length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-[13px] hover:brightness-110 active:scale-95 transition-all shadow disabled:opacity-50 disabled:active:scale-100 animate-fade-in"
              >
                <span className="material-symbols-outlined text-[16px]">send_all</span>
                Send All
              </button>
            </div>

            {sendingProgress && (
              <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg flex items-center gap-2 text-xs font-semibold animate-pulse">
                <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                {sendingProgress}
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {allCustomers.filter((c) => (c.balance || 0) > 0).length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant italic text-xs">
                  No pending balances for this month.
                </div>
              ) : (
                allCustomers
                  .filter((c) => (c.balance || 0) > 0)
                  .map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:shadow transition-all animate-fade-in-up"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${customer.avatarColor || "bg-error-container text-on-error-container"}`}>
                          {customer.initials}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-on-surface">{customer.name}</h4>
                          <p className="text-[11px] text-error font-semibold">{formatCurrency(customer.balance)} pending</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendSinglePDF(customer)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-xs font-bold hover:bg-primary-container-high active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">share</span>
                        Send PDF
                      </button>
                    </div>
                  ))
              )}
            </div>
          </section>
        </main>
      )}

      <BottomNav variant="owner" />
    </div>
  );
}
