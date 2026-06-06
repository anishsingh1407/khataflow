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
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";

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

  // Computed statistics
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [collectedThisMonth, setCollectedThisMonth] = useState(0);
  const [udharThisMonth, setUdharThisMonth] = useState(0);
  const [topDefaulters, setTopDefaulters] = useState<Customer[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

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
          setShopName(shopSnap.data().name || "Shop Name");
        }

        // 2. Fetch all customers
        const custSnap = await getDocs(collection(db, "shops", shopId, "customers"));
        const customersList = custSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Customer[];

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

        // 4. Build helper maps for customer names and visuals
        const customerMap: Record<string, string> = {};
        const customerInitialsMap: Record<string, string> = {};
        const customerColorMap: Record<string, string> = {};

        customersList.forEach((c) => {
          customerMap[c.id] = c.name;
          customerInitialsMap[c.id] = c.initials || "C";
          customerColorMap[c.id] = c.avatarColor || "bg-primary/10 text-primary";
        });

        // 5. Calculate stats
        // Total outstanding = sum of all customer balances
        const outstandingTotal = customersList.reduce((sum, c) => sum + (c.balance || 0), 0);
        setTotalOutstanding(outstandingTotal);

        // Date-based filters for current month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)

        let collectedMonthTotal = 0;
        let udharMonthTotal = 0;

        transactionsList.forEach((t) => {
          if (!t.date) return;
          const [y, m] = t.date.split("-").map(Number);
          if (y === currentYear && m === currentMonth) {
            if (t.type === "payment") {
              collectedMonthTotal += t.amount || 0;
            } else if (t.type === "udhar") {
              udharMonthTotal += t.amount || 0;
            }
          }
        });

        setCollectedThisMonth(collectedMonthTotal);
        setUdharThisMonth(udharMonthTotal);

        // Top defaulters = customers with highest balances (top 5)
        const sortedDefaulters = [...customersList]
          .filter((c) => (c.balance || 0) > 0)
          .sort((a, b) => (b.balance || 0) - (a.balance || 0))
          .slice(0, 5);
        setTopDefaulters(sortedDefaulters);

        // Recent activity = last 10 transactions with customer names
        const lastTenTxns = transactionsList.slice(0, 10).map((t) => ({
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

      } catch (err) {
        console.error("Error loading reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [shopId, authLoading, user, router]);

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

          {/* Key Stats Cards — Bento Style */}
          <section className="grid grid-cols-2 gap-4">
            {/* Total Outstanding — Large Card */}
            <div className="col-span-2 bg-error-container text-on-error-container p-5 rounded-2xl shadow-sm border border-error/10 relative overflow-hidden">
              <div className="relative z-10">
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold opacity-90">
                  Total Outstanding
                </p>
                <h2 className="font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-semibold mt-1 text-error">
                  {formatCurrency(totalOutstanding)}
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

            {/* Collected this month */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                  Collected (Month)
                </p>
              </div>
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
                {formatCurrency(collectedThisMonth)}
              </h3>
            </div>

            {/* Udhar this month */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-error text-[20px]">trending_up</span>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                  Udhar Given (Month)
                </p>
              </div>
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-error">
                {formatCurrency(udharThisMonth)}
              </h3>
            </div>
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
                          +91 {customer.phone}
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
        </main>
      )}

      <BottomNav variant="owner" />
    </div>
  );
}
