"use client";

import TopAppBar from "@/components/layout/top-app-bar";
import BottomNav from "@/components/layout/bottom-nav";
import FAB from "@/components/layout/fab";
import SearchBar from "@/components/shared/search-bar";
import AvatarInitials from "@/components/shared/avatar-initials";
import { staffCustomers } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function StaffDashboardPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopAppBar title="Staff View – KhataFlow" showLogo showSearch />

      <main className="pt-14 px-[16px] pb-[100px]">
        {/* Add Customer Banner */}
        <Link
          href="/customers/add"
          className="block mt-[16px] mb-[16px] bg-primary text-on-primary p-[20px] rounded-xl shadow-md active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[12px]">
              <span className="material-symbols-outlined text-[28px]">person_add</span>
              <span className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold">
                Add Customer
              </span>
            </div>
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </div>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-[12px] mb-[16px]">
          <Link
            href="/transactions/add-udhar"
            className="p-[16px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-error text-[20px]">north_east</span>
            </div>
            <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
              Add Udhar
            </p>
            <p className="text-[12px] text-on-surface-variant">Record Credit</p>
          </Link>
          <Link
            href="/transactions/add-payment"
            className="p-[16px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">south_west</span>
            </div>
            <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
              Add Payment
            </p>
            <p className="text-[12px] text-on-surface-variant">Record Cash</p>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-[16px]">
          <SearchBar placeholder="Search customer by name or phone..." icon="person_search" />
        </div>

        {/* Recent Customers */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="flex justify-between items-center px-[16px] py-[12px]">
            <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
              Recent Customers
            </p>
            <p className="text-[12px] text-on-surface-variant">42 Total</p>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {staffCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="flex items-center justify-between px-[16px] py-[14px] hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-[12px]">
                  <AvatarInitials
                    initials={customer.initials}
                    size="md"
                    colorClass={customer.avatarColor || "bg-surface-container-high text-on-surface-variant"}
                  />
                  <div>
                    <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                      {customer.name}
                    </p>
                    <p className="text-[12px] text-on-surface-variant">
                      {customer.lastUpdated}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold ${customer.balance > 0 ? "text-error" : "text-on-surface"}`}>
                    ₹ {customer.balance.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-outline font-bold uppercase">
                    {customer.status === "settled" ? "SETTLED" : "UDHAR"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/customers/list"
            className="block text-center py-[14px] text-primary font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold border-t border-outline-variant/20 hover:bg-surface-container transition-colors"
          >
            View All Customers
          </Link>
        </div>
      </main>

      <FAB href="/customers/add" />
      <BottomNav variant="staff" />
    </div>
  );
}
