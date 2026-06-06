"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/layout/bottom-nav";
import { Customer, Transaction } from "@/lib/types";

export default function ActivityLogsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
        // Fetch all transactions
        const txnsSnap = await getDocs(
          query(collection(db, "shops", shopId, "transactions"), orderBy("date", "desc"))
        );
        const txnsList = txnsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Transaction[];
        setTransactions(txnsList);

        // Fetch all customers to resolve names
        const custSnap = await getDocs(collection(db, "shops", shopId, "customers"));
        const custList = custSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Customer[];
        setCustomers(custList);
      } catch (err) {
        console.error("Error loading activity logs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shopId, authLoading, user, router]);

  const customerMap = customers.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  // Sort filtered transactions descending by date and time
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateCompare = (b.date || "").localeCompare(a.date || "");
    if (dateCompare !== 0) return dateCompare;
    return (b.time || "").localeCompare(a.time || "");
  });

  // Group sorted transactions by date label
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const dateGroups: Record<string, Transaction[]> = {};
  sortedTransactions.forEach((t) => {
    let label = t.date;
    if (t.date === todayStr) label = "TODAY";
    else if (t.date === yesterdayStr) label = "YESTERDAY";
    else {
      try {
        const d = new Date(t.date);
        label = d
          .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          .toUpperCase();
      } catch (e) {
        label = (t.date || "").toUpperCase();
      }
    }
    if (!dateGroups[label]) dateGroups[label] = [];
    dateGroups[label].push(t);
  });

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-[16px] h-14 bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
            Activity Logs
          </h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold px-3 py-2 rounded-lg transition-colors ${
            showFilters || startDate || endDate
              ? "bg-primary-container text-on-primary-container"
              : "text-primary hover:bg-primary/5"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </button>
      </header>

      {/* Date Pickers collapsible section */}
      {showFilters && (
        <div className="bg-surface-container-low border-b border-outline-variant/30 p-4 space-y-3 animate-fade-in-up">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">
                End Date
              </label>
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
              onClick={handleReset}
              className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-[13px] py-2 rounded-lg transition-all"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      <main className="flex-1 px-[16px] max-w-2xl mx-auto w-full pt-4 pb-24">
        {loading || authLoading ? (
          <div className="space-y-6">
            <div className="h-10 bg-surface-container-low animate-pulse rounded w-1/3" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-surface-container-low animate-pulse rounded-xl border border-outline-variant/10"
              />
            ))}
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-12 rounded-2xl text-center text-on-surface-variant italic mt-8">
            No data for selected period
          </div>
        ) : (
          Object.entries(dateGroups).map(([dateLabel, txns]) => (
            <div key={dateLabel} className="mb-6">
              {/* Date Header */}
              <div className="mb-3">
                <div className="flex items-center gap-4 py-2">
                  <div className="h-[1px] flex-1 bg-outline-variant" />
                  <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant px-2">
                    {dateLabel}
                  </span>
                  <div className="h-[1px] flex-1 bg-outline-variant" />
                </div>
              </div>

              {/* Transactions list */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden">
                {txns.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-[16px] flex items-center justify-between hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-[16px] min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "udhar" ? "bg-error-container/30" : "bg-primary/10"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            activity.type === "udhar" ? "text-error" : "text-primary"
                          }`}
                        >
                          {activity.type === "udhar" ? "north_east" : "south_west"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface truncate">
                          {customerMap[activity.customerId] || "Unknown Customer"}
                        </p>
                        <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.5px] font-medium truncate">
                          {activity.time} • {activity.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p
                        className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${
                          activity.type === "udhar" ? "text-error" : "text-secondary"
                        }`}
                      >
                        {activity.type === "udhar" ? "+" : "-"}
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="text-[10px] text-outline font-bold uppercase">
                        {activity.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav variant="owner" />
    </div>
  );
}
