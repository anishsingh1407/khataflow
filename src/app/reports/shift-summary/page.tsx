"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import BottomNav from "@/components/layout/bottom-nav";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Customer, Transaction } from "@/lib/types";

export default function ShiftSummaryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Component state
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("Shop Name");
  const [ownerName, setOwnerName] = useState("");
  const [reportDate, setReportDate] = useState("");

  const [totalSales, setTotalSales] = useState(0);
  const [collected, setCollected] = useState(0);
  const [pending, setPending] = useState(0);

  const [barHeights, setBarHeights] = useState<string[]>([]);
  const [barLabels, setBarLabels] = useState<string[]>([]);
  const [barValues, setBarValues] = useState<string[]>([]);
  const [barOpacities, setBarOpacities] = useState<string[]>([]);

  const [performance, setPerformance] = useState<any[]>([]);

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
        let fetchedOwnerName = "";
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          setShopName(shopData.name || "Shop Name");
          fetchedOwnerName = shopData.ownerName || "";
          setOwnerName(fetchedOwnerName);
        }

        // 2. Fetch all customers
        const custSnap = await getDocs(collection(db, "shops", shopId, "customers"));
        const customersList = custSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Customer[];

        // 3. Fetch all transactions
        const txnsSnap = await getDocs(collection(db, "shops", shopId, "transactions"));
        const transactionsList = txnsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Transaction[];

        // 4. Fetch staff members
        const staffSnap = await getDocs(collection(db, "shops", shopId, "staff"));
        const staffList = staffSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as any[];

        // 5. Set report date (current date formatted)
        setReportDate(
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        );

        // 6. Calculate stats
        // Total Sales = sum of all udhar transactions
        const salesSum = transactionsList
          .filter((t) => t.type === "udhar")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        setTotalSales(salesSum);

        // Collected = sum of all payment transactions
        const collectedSum = transactionsList
          .filter((t) => t.type === "payment")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        setCollected(collectedSum);

        // Pending = sum of all customer balances
        const pendingSum = customersList.reduce((sum, c) => sum + (c.balance || 0), 0);
        setPending(pendingSum);

        // 7. Collection Trend chart = group today's payments by hour
        const todayDateStr = new Date().toISOString().split("T")[0];
        const todayPayments = transactionsList.filter(
          (t) => t.date === todayDateStr && t.type === "payment"
        );

        const bins = [0, 0, 0, 0, 0, 0];
        todayPayments.forEach((t) => {
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

        // 8. Staff Performance
        const performanceAgg: Record<string, any> = {};

        // Initialize from staffList
        staffList.forEach((s) => {
          performanceAgg[s.id] = {
            id: s.id,
            name: s.name,
            initials: s.initials || s.name.charAt(0).toUpperCase() || "S",
            entries: 0,
            newCustomers: 0,
            amount: 0,
            avatarColor: s.avatarColor || "bg-surface-container-highest text-on-surface-variant",
          };
        });

        // Initialize for owner
        if (user) {
          performanceAgg[user.uid] = {
            id: user.uid,
            name: fetchedOwnerName || "Owner",
            initials: (fetchedOwnerName || "Owner").charAt(0).toUpperCase() || "O",
            entries: 0,
            newCustomers: 0,
            amount: 0,
            avatarColor: "bg-secondary-container text-on-secondary-container",
          };
        }

        // Aggregate entries and amount from transactions
        transactionsList.forEach((t) => {
          const uid = t.recordedBy || user?.uid || "unknown";
          if (!performanceAgg[uid]) {
            performanceAgg[uid] = {
              id: uid,
              name: uid === "unknown" ? "System" : "Staff " + uid.slice(0, 4),
              initials: "S",
              entries: 0,
              newCustomers: 0,
              amount: 0,
              avatarColor: "bg-surface-container-highest text-on-surface-variant",
            };
          }
          performanceAgg[uid].entries += 1;
          if (t.type === "payment") {
            performanceAgg[uid].amount += t.amount || 0;
          }
        });

        // Aggregate new customers from customerList
        customersList.forEach((c) => {
          const addedBy = (c as any).addedBy || user?.uid;
          if (addedBy && performanceAgg[addedBy]) {
            performanceAgg[addedBy].newCustomers += 1;
          }
        });

        const sortedPerformance = Object.values(performanceAgg).sort(
          (a, b) => b.amount - a.amount || b.entries - a.entries
        );
        setPerformance(sortedPerformance);
      } catch (err) {
        console.error("Error loading shift summary data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [shopId, authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="bg-background text-on-surface min-h-screen pb-32">
        <header className="bg-surface sticky top-0 z-40 flex justify-between items-center w-full px-[16px] h-14 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary">Loading report...</span>
          </div>
        </header>
        <main className="px-[16px] pt-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-24 bg-surface-container-low animate-pulse rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 h-32 bg-surface-container-low animate-pulse rounded-2xl" />
            <div className="h-24 bg-surface-container-low animate-pulse rounded-2xl" />
            <div className="h-24 bg-surface-container-low animate-pulse rounded-2xl" />
          </div>
          <div className="h-40 bg-surface-container-low animate-pulse rounded-2xl" />
          <div className="h-60 bg-surface-container-low animate-pulse rounded-2xl" />
        </main>
        <BottomNav variant="owner" />
      </div>
    );
  }

  // Check if there are no transactions today for collection trend chart
  const hasTodayPayments = barValues.some((val) => val !== formatCurrency(0));

  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      {/* Top App Bar */}
      <header className="bg-surface sticky top-0 z-40 flex justify-between items-center w-full px-[16px] h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-primary-fixed text-[18px]">store</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary">
            {shopName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary text-on-primary px-3 py-1 rounded-full font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
            Owner
          </span>
        </div>
      </header>

      <main className="px-[16px] pt-4 space-y-6 max-w-2xl mx-auto">
        {/* Date Picker Section */}
        <section className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant">
          <div className="flex flex-col">
            <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
              Report Period
            </span>
            <span className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
              {reportDate}
            </span>
          </div>
          <button className="flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-lg text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold transition-all active:scale-95">
            <span className="material-symbols-outlined">calendar_today</span>
            Change
          </button>
        </section>

        {/* Key Stats Cards — Bento Style */}
        <section className="grid grid-cols-2 gap-4">
          {/* Total Sales — Large Card */}
          <div className="col-span-2 bg-primary-container p-5 rounded-2xl shadow-sm text-on-primary-container relative overflow-hidden">
            <div className="relative z-10">
              <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold opacity-90">
                Total Sales
              </p>
              <h2 className="font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-semibold mt-1">
                {formatCurrency(totalSales)}
              </h2>
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium mt-2 flex items-center gap-1 text-on-primary-container">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                Total Udhar issued to date
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">payments</span>
            </div>
          </div>

          {/* Collected */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                Collected
              </p>
            </div>
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
              {formatCurrency(collected)}
            </h3>
          </div>

          {/* Pending */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-[20px]">pending_actions</span>
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                Pending
              </p>
            </div>
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-error">
              {formatCurrency(pending)}
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
              Today's Collections
            </span>
          </div>

          {!hasTodayPayments ? (
            <div className="h-40 w-full flex flex-col items-center justify-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant gap-2 bg-surface-container-low">
              <span className="material-symbols-outlined text-[32px] text-outline">analytics</span>
              <p className="italic font-medium text-[13px]">No collections recorded today</p>
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

        {/* Staff Performance */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
              Staff Performance
            </h3>
            <Link
              href="/settings/staff"
              className="text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {performance.filter((p) => p.entries > 0 || p.amount > 0).length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-xl text-center text-on-surface-variant italic">
                No staff entries recorded yet
              </div>
            ) : (
              performance
                .filter((p) => p.entries > 0 || p.amount > 0)
                .map((staff) => (
                  <div
                    key={staff.id}
                    className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${staff.avatarColor}`}
                    >
                      {staff.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold truncate pr-2 text-on-surface">
                          {staff.name}
                        </h4>
                        <span className="text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex-shrink-0">
                          {formatCurrency(staff.amount)}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1 text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                          <span className="material-symbols-outlined text-[14px]">edit_note</span>
                          {staff.entries} Entries
                        </div>
                        <div className="flex items-center gap-1 text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                          <span className="material-symbols-outlined text-[14px]">person_add</span>
                          {staff.newCustomers} New
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Advanced Insights Image */}
        <section className="rounded-2xl overflow-hidden h-40 relative group">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbxl3L6nNUfKcChjw7Hq0tnraPphyLhK9KaXfZ2tOanarhIqDyce9d5eXXyj9uYqzOtCZ89jC8AA_3Z9koVTkfqAf-7qPy5Xqbam8vvTSdy_tjbOTd7FE1IEusgawIJ3JZdVtMu2LUF0fTloVy_UzjChYCG8ZlzjAFd0_oWe1EqlWBNHs3GTvD1BsJN_YrbV27pxifiFL3Tj2xHWk8AFAZmM3ebd4g7j8bym8F2ICE4b9iskzbzuaSYGtLV01LETKOnOHh7oEBkt1X"
            alt="Advanced Insights"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
            <h4 className="text-white font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
              Advanced Insights
            </h4>
            <p className="text-white/80 font-[var(--font-body)] text-[14px] leading-[20px]">
              Get AI-powered growth predictions based on your sales data.
            </p>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-24 left-0 w-full px-[16px] z-40 max-w-2xl mx-auto right-0">
        <button className="w-full bg-primary text-on-primary h-14 rounded-xl shadow-lg flex items-center justify-center gap-3 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold active:scale-95 transition-all">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Download Daily PDF Report
        </button>
      </div>

      <BottomNav variant="owner" />
    </div>
  );
}
