"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCustomers } from "@/lib/firestore-service";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TopAppBar from "@/components/layout/top-app-bar";
import BottomNav from "@/components/layout/bottom-nav";
import FAB from "@/components/layout/fab";
import ActivityItem from "@/components/shared/activity-item";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Component state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shopName, setShopName] = useState("Loading shop...");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Dashboard - user from useAuth:", user);
    console.log("Dashboard - shopId:", user?.shopId);
    console.log("[Dashboard] useEffect triggered. authLoading:", authLoading, "user:", user, "shopId:", shopId);

    // If user is authenticated but shopId is undefined or empty string, immediately redirect to /setup instead of waiting
    if (user && !user.shopId) {
      console.log("[Dashboard] User is authenticated but shopId is null/empty. Redirecting to /setup...");
      window.location.href = "/setup";
      return;
    }

    // 1. If auth is loading, just wait and show loading skeleton
    if (authLoading) {
      console.log("[Dashboard] Auth is loading. Showing loading skeleton...");
      return;
    }

    // 2. If user is not authenticated, redirect to /login
    if (!user) {
      console.log("[Dashboard] User not authenticated. Redirecting to /login...");
      window.location.href = "/login";
      return;
    }

    const activeShopId = user.shopId;

    // 4. Only fetch shop data when shopId is confirmed not null
    console.log("[Dashboard] Active shop session detected (shopId:", activeShopId, "). Fetching database records...");
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Shop details
        const shopDocRef = doc(db, "shops", activeShopId);
        const shopSnap = await getDoc(shopDocRef);
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          console.log("[Dashboard] Shop details loaded successfully:", shopData);
          setShopName(shopData.name || "My General Store");
          setOwnerName(shopData.ownerName || "Ramesh");
        } else {
          console.warn("[Dashboard] Shop document does not exist in Firestore. Redirecting to /setup...");
          window.location.href = "/setup";
          return;
        }

        // 2. Fetch Customers
        console.log("[Dashboard] Fetching shop customers...");
        const customerList = await getCustomers(activeShopId);
        setCustomers(customerList);

        // 3. Fetch Transactions
        console.log("[Dashboard] Fetching shop transactions...");
        const txnsRef = collection(db, "shops", activeShopId, "transactions");
        const txnsSnap = await getDocs(txnsRef);
        const txnsList = txnsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Transaction[];
        setTransactions(txnsList);
        console.log("[Dashboard] All dashboard data successfully loaded.");
      } catch (err) {
        console.error("[Dashboard] Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [shopId, authLoading, user, router]);

  // Derived states (with safety checks for missing fields)
  const totalPending = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalCustomers = customers.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysCollection = transactions
    .filter((t) => t.date === todayStr && t.type === "payment")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const todaysUdhar = transactions
    .filter((t) => t.date === todayStr && t.type === "udhar")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const overdueAlerts = customers
    .filter((c) => c.status === "overdue")
    .slice(0, 3);

  const recentTxns = [...transactions]
    .sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    })
    .slice(0, 5);

  const isDataLoading = authLoading || loading;

  return (
    <div className="bg-background text-on-background font-[var(--font-body)] text-[14px] leading-[20px] antialiased min-h-screen">
      <TopAppBar
        title={shopName}
        showLogo
        showSearch
        showProfile
        profileImageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDQQTTjDhMT-Z0xyJPRLYKw4sN2MbpO2ViNqFU8NH9nd-4KvfbyfMoeQniHEWXjsz9veIH93Nv4O_JMgCJy7EKM6_unj95r1zdgtOqfSbxGs3K4et1c3RY8qLTT3j-tcWE30NYpb4LIvR6oxMq5mmj2huwlrBVWAA_awPZ1nsWw9nrJmDwLqAhzIaiKt6DKQ2huvoYVJumsb5QasoTE6lYUe8Ybt2eeFl4IYVmM0C4u8AniKMVNtfZuiK7PYCfqq95BZ0iaFIaAnrNt"
      />

      <main className="pt-14 px-[16px] pb-[100px] max-w-4xl mx-auto">
        {/* Greeting */}
        <section className="py-[16px]">
          <h2 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold text-on-surface">
            {isDataLoading ? "Welcome back" : `Welcome back, ${ownerName}`}
          </h2>
          <p className="text-on-surface-variant font-[var(--font-body)]">
            Your shop is doing well today.
          </p>
        </section>

        {/* Bento Grid */}
        <section className="grid grid-cols-2 gap-[12px] mb-[24px]">
          {isDataLoading ? (
            // Loading Skeletons for Bento Grid
            <>
              <div className="col-span-2 p-[16px] rounded-xl bg-primary/10 animate-pulse min-h-[160px] flex flex-col justify-between border border-primary/5">
                <div className="h-4 bg-primary/20 rounded w-1/3" />
                <div className="h-10 bg-primary/20 rounded w-1/2" />
              </div>
              <div className="p-[16px] rounded-xl bg-surface-container-low animate-pulse min-h-[80px] flex flex-col justify-between border border-outline-variant/10">
                <div className="h-3 bg-surface-variant rounded w-2/3" />
                <div className="h-6 bg-surface-variant rounded w-1/3" />
              </div>
              <div className="p-[16px] rounded-xl bg-surface-container-low animate-pulse min-h-[80px] flex flex-col justify-between border border-outline-variant/10">
                <div className="h-3 bg-surface-variant rounded w-2/3" />
                <div className="h-6 bg-surface-variant rounded w-1/3" />
              </div>
              <div className="col-span-2 p-[16px] rounded-xl bg-surface-container-low animate-pulse min-h-[80px] flex flex-col justify-between border border-outline-variant/10">
                <div className="h-3 bg-surface-variant rounded w-1/4" />
                <div className="h-6 bg-surface-variant rounded w-1/3" />
              </div>
              <div className="col-span-2 p-[16px] rounded-xl bg-surface-container-low animate-pulse h-16 flex items-center gap-[16px] border border-outline-variant/10">
                <div className="w-10 h-10 rounded-full bg-surface-variant" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-variant rounded w-1/4" />
                  <div className="h-4 bg-surface-variant rounded w-1/2" />
                </div>
              </div>
            </>
          ) : (
            // Real Data Content
            <>
              {/* Total Pending - Large Card */}
              <Link href="/reports/recovery" className="col-span-2 p-[16px] rounded-xl bg-primary shadow-sm border border-outline-variant/10 flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                  <p className="text-on-primary/80 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
                    Total Pending
                  </p>
                  <span className="material-symbols-outlined text-on-primary">
                    account_balance_wallet
                  </span>
                </div>
                <div>
                  <h3 className="font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-semibold text-on-primary">
                    {formatCurrency(totalPending)}
                  </h3>
                  <div className="flex items-center gap-[4px] mt-[4px] text-on-primary/90 font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Active ledger tracking</span>
                  </div>
                </div>
              </Link>

              {/* Total Customers */}
              <Link href="/customers/list" className="p-[16px] rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                  Total Customers
                </p>
                <div className="flex items-baseline gap-[4px]">
                  <span className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
                    {totalCustomers}
                  </span>
                  <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                </div>
              </Link>

              {/* Collection */}
              <div className="p-[16px] rounded-xl bg-secondary-container shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <p className="text-on-secondary-container font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                  Collection
                </p>
                <div className="flex items-baseline gap-[4px]">
                  <span className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-secondary-container">
                    {formatCurrency(todaysCollection)}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
                </div>
              </div>

              {/* Today's Udhar */}
              <div className="col-span-2 p-[16px] rounded-xl bg-error-container shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <p className="text-on-error-container font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                    Today&apos;s Udhar
                  </p>
                  <span className="material-symbols-outlined text-error text-[18px]">history_edu</span>
                </div>
                <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-error-container">
                  {formatCurrency(todaysUdhar)}
                </h3>
              </div>

              {/* Growth Insight */}
              <div className="col-span-2 p-[16px] rounded-xl bg-tertiary-container shadow-sm border border-outline-variant/30 flex items-center gap-[16px]">
                <div className="w-10 h-10 rounded-full bg-on-tertiary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-tertiary-container">insights</span>
                </div>
                <div>
                  <p className="text-on-tertiary-container/80 font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                    Growth Insight
                  </p>
                  <p className="text-on-tertiary-container font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
                    {todaysUdhar > 0
                      ? `Today's new credit is ${formatCurrency(todaysUdhar)}.`
                      : "No new credit recorded today."}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mb-[24px] overflow-x-auto no-scrollbar -mx-[16px] px-[16px]">
          <div className="flex gap-[12px] min-w-max pb-[4px]">
            <Link
              href="/transactions/add-udhar"
              className="flex items-center gap-[12px] bg-primary text-on-primary px-[24px] py-[12px] rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold shadow-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add Udhar
            </Link>
            <Link
              href="/transactions/add-payment"
              className="flex items-center gap-[12px] bg-white border border-primary text-primary px-[24px] py-[12px] rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">payments</span>
              Add Payment
            </Link>
            <Link
              href="/customers/add"
              className="flex items-center gap-[12px] bg-surface-container-high text-on-surface-variant px-[24px] py-[12px] rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">person_add</span>
              Add Customer
            </Link>
          </div>
        </section>

        {/* Overdue Alerts */}
        <section className="mb-[24px]">
          <div className="flex justify-between items-center mb-[16px]">
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
              Overdue Alerts
            </h3>
            <Link href="/reports/recovery" className="text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
              View All
            </Link>
          </div>
          
          {isDataLoading ? (
            <div className="flex flex-wrap gap-[12px] w-full">
              {[1, 2].map((i) => (
                <div key={i} className="flex-1 min-w-[200px] h-14 bg-surface-container-low animate-pulse rounded-lg border border-outline-variant/10" />
              ))}
            </div>
          ) : overdueAlerts.length === 0 ? (
            <p className="text-on-surface-variant font-[var(--font-body)] italic py-2 px-1">
              No customers with overdue balances.
            </p>
          ) : (
            <div className="flex flex-wrap gap-[12px]">
              {overdueAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-[12px] bg-error-container text-on-error-container px-[16px] py-[12px] rounded-lg border border-error/20"
                >
                  <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center font-bold text-sm">
                    {alert.initials || alert.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
                      {alert.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-error">
                      OVERDUE
                    </p>
                  </div>
                  <span className="ml-auto font-bold">{formatCurrency(alert.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activities */}
        <section className="mb-[24px]">
          <div className="flex justify-between items-center mb-[16px]">
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
              Recent Activities
            </h3>
            <span className="material-symbols-outlined text-outline">history</span>
          </div>

          {isDataLoading ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-container-low animate-pulse w-full" />
              ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 text-center text-on-surface-variant italic">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden">
              {recentTxns.map((txn) => {
                const customer = customers.find((c) => c.id === txn.customerId);
                return (
                  <ActivityItem
                    key={txn.id}
                    customerName={customer ? customer.name : "Unknown Customer"}
                    time={`${txn.date} ${txn.time}`}
                    amount={txn.amount}
                    type={txn.type}
                    label={txn.description}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <FAB href="/transactions/add-udhar" />
      <BottomNav variant="owner" />
    </div>
  );
}
