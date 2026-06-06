"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCustomerTransactions } from "@/lib/firestore-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TimelineItem from "@/components/shared/timeline-item";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";

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
      {/* Top AppBar */}
      <header className="bg-surface fixed top-0 w-full z-50 flex justify-between items-center px-[16px] h-14 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-transform active:scale-95">
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
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">notifications</span>
          </button>
          <Link href="/reports/statement" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
          </Link>
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
                  <p className="font-[var(--font-body)] text-[16px] leading-[24px] font-semibold">
                    +91 {customer?.phone}
                  </p>
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
                        {date}
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
                        time={txn.time}
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
                    <span className="font-semibold">+91 {customer?.phone}</span>
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
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest shadow-[0_-8px_24px_rgba(0,0,0,0.05)] border-t border-outline-variant px-[16px] py-4">
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
    </div>
  );
}
