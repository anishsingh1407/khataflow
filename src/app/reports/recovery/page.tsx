"use client";

import TopAppBar from "@/components/layout/top-app-bar";
import BottomNav from "@/components/layout/bottom-nav";
import FAB from "@/components/layout/fab";
import { recoveryCustomers, recoveryStats } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function RecoveryDashboardPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen select-none">
      {/* Top App Bar — matching recovery_dashboard/code.html */}
      <header className="flex justify-between items-center w-full px-[16px] h-14 bg-surface fixed top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-fixed">store</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary">Shop Name</h1>
        </div>
        <div className="flex gap-4">
          <button className="material-symbols-outlined text-primary scale-95 transition-transform duration-150 hover:bg-surface-container-high rounded-full p-2">search</button>
          <div className="flex items-center gap-2 bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            <span>Owner</span>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-24 px-[16px] max-w-5xl mx-auto">
        {/* Recovery Overview Section — Bento Style */}
        <div className="grid grid-cols-1 gap-4 mb-[24px]">
          {/* Main Recovery Card */}
          <div className="bg-surface-container-lowest border border-outline-variant p-[24px] rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-[16px]">
              <div>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Recovery Health</p>
                <h2 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold text-on-surface">
                  {recoveryStats.recoveryPercent}% Recovered
                </h2>
              </div>
              <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                {recoveryStats.vsLastMonth}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container-highest rounded-full h-4 mb-[24px] overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${recoveryStats.recoveryPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-[16px] rounded-lg bg-error-container/20 border border-error/10">
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-error uppercase tracking-wider mb-1">Total Udhar</p>
                <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-error">
                  ₹ {(recoveryStats.totalUdhar / 100).toFixed(0).replace(/\B(?=(\d{2})+(?!\d))/g, ",")}00
                </p>
              </div>
              <div className="p-[16px] rounded-lg bg-secondary-container/20 border border-secondary/10">
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-secondary uppercase tracking-wider mb-1">Total Payment</p>
                <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-secondary">
                  ₹ {(recoveryStats.totalPayment / 100).toFixed(0).replace(/\B(?=(\d{2})+(?!\d))/g, ",")}00
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-primary text-on-primary p-[24px] rounded-xl flex flex-col justify-between shadow-md">
            <div className="flex justify-between">
              <span className="material-symbols-outlined text-[32px]">trending_up</span>
              <span className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">Live</span>
            </div>
            <div className="mt-4">
              <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold opacity-80">Pending Today</p>
              <p className="font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-semibold">
                {formatCurrency(recoveryStats.pendingToday)}
              </p>
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-70 mt-2">
                {recoveryStats.highPriorityCount} High Priority Customers
              </p>
            </div>
            <button className="mt-[16px] bg-on-primary text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold py-3 rounded-lg w-full scale-95 hover:scale-100 transition-all">
              Generate Report
            </button>
          </div>
        </div>

        {/* Filter & Header for Collection List */}
        <div className="flex items-center justify-between mb-[16px]">
          <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface flex items-center gap-2">
            Pending Collection
            <span className="bg-error-container text-on-error-container text-[12px] px-2 py-0.5 rounded-full">
              {recoveryStats.pendingCollectionCount}
            </span>
          </h3>
          <button className="flex items-center gap-1 font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            By Due Date
          </button>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {recoveryCustomers.map((customer) => (
            <div key={customer.id} className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {customer.avatarUrl ? (
                    <img
                      className={`w-14 h-14 rounded-full object-cover border-2 ${customer.statusColor === "error" ? "border-error" : "border-outline-variant"}`}
                      src={customer.avatarUrl}
                      alt={customer.name}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant text-lg">
                      {customer.initials}
                    </div>
                  )}
                  {customer.statusColor === "error" && (
                    <div className="absolute -bottom-1 -right-1 bg-error text-on-error w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">!</div>
                  )}
                </div>
                <div>
                  <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">{customer.name}</h4>
                  <p className={`font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium ${customer.statusColor === "error" ? "text-error font-semibold" : "text-on-surface-variant"}`}>
                    {customer.status}
                  </p>
                  <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                    {customer.lastPaid ? `Last paid: ${customer.lastPaid}` : customer.notes}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
                    {formatCurrency(customer.amount)}
                  </p>
                  <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                    {customer.billsPending} {customer.billsPending === 1 ? "Bill" : "Bills"} Pending
                  </p>
                </div>
                <button className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                  Remind
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <FAB href="/transactions/add-udhar" />
      <BottomNav variant="owner" />
    </div>
  );
}
