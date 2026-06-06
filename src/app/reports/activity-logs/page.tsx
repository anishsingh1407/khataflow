"use client";

import { recentActivities } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ActivityLogsPage() {
  const router = useRouter();

  const allActivities = [
    ...recentActivities,
    { id: "act-004", customerName: "Priya Jain", type: "payment" as const, amount: 1500, time: "Yesterday • Payment", label: "PAYMENT" },
    { id: "act-005", customerName: "Kiran Kumar", type: "udhar" as const, amount: 3200, time: "Yesterday • Credit", label: "UDHAR" },
    { id: "act-006", customerName: "Meena Sharma", type: "payment" as const, amount: 500, time: "2 days ago • Payment", label: "PAYMENT" },
    { id: "act-007", customerName: "Vikram Singh", type: "udhar" as const, amount: 800, time: "2 days ago • Credit", label: "UDHAR" },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-[16px] h-14 bg-surface sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">Activity Logs</h1>
        </div>
        <button className="flex items-center gap-1 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </button>
      </header>

      <main className="flex-1 px-[16px]">
        {/* Today */}
        <div className="mb-2">
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-outline-variant" />
            <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant px-2">TODAY</span>
            <div className="h-[1px] flex-1 bg-outline-variant" />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden mb-4">
          {allActivities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="p-[16px] flex items-center justify-between hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-[16px]">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.type === "udhar" ? "bg-error-container/30" : "bg-primary/10"}`}>
                  <span className={`material-symbols-outlined ${activity.type === "udhar" ? "text-error" : "text-primary"}`}>
                    {activity.type === "udhar" ? "north_east" : "south_west"}
                  </span>
                </div>
                <div>
                  <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">{activity.customerName}</p>
                  <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.5px] font-medium">{activity.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${activity.type === "udhar" ? "text-error" : "text-secondary"}`}>
                  {activity.type === "udhar" ? "+" : "-"}{formatCurrency(activity.amount)}
                </p>
                <p className="text-[10px] text-outline font-bold uppercase">{activity.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Yesterday */}
        <div className="mb-2">
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-outline-variant" />
            <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant px-2">YESTERDAY</span>
            <div className="h-[1px] flex-1 bg-outline-variant" />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden mb-4">
          {allActivities.slice(3, 5).map((activity) => (
            <div key={activity.id} className="p-[16px] flex items-center justify-between hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-[16px]">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.type === "udhar" ? "bg-error-container/30" : "bg-primary/10"}`}>
                  <span className={`material-symbols-outlined ${activity.type === "udhar" ? "text-error" : "text-primary"}`}>
                    {activity.type === "udhar" ? "north_east" : "south_west"}
                  </span>
                </div>
                <div>
                  <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">{activity.customerName}</p>
                  <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.5px] font-medium">{activity.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${activity.type === "udhar" ? "text-error" : "text-secondary"}`}>
                  {activity.type === "udhar" ? "+" : "-"}{formatCurrency(activity.amount)}
                </p>
                <p className="text-[10px] text-outline font-bold uppercase">{activity.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2 Days Ago */}
        <div className="mb-2">
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-outline-variant" />
            <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant px-2">2 DAYS AGO</span>
            <div className="h-[1px] flex-1 bg-outline-variant" />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden mb-8">
          {allActivities.slice(5).map((activity) => (
            <div key={activity.id} className="p-[16px] flex items-center justify-between hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-[16px]">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.type === "udhar" ? "bg-error-container/30" : "bg-primary/10"}`}>
                  <span className={`material-symbols-outlined ${activity.type === "udhar" ? "text-error" : "text-primary"}`}>
                    {activity.type === "udhar" ? "north_east" : "south_west"}
                  </span>
                </div>
                <div>
                  <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">{activity.customerName}</p>
                  <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.5px] font-medium">{activity.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${activity.type === "udhar" ? "text-error" : "text-secondary"}`}>
                  {activity.type === "udhar" ? "+" : "-"}{formatCurrency(activity.amount)}
                </p>
                <p className="text-[10px] text-outline font-bold uppercase">{activity.label}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
