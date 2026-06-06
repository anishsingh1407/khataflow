"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RouteItem {
  name: string;
  path: string;
  icon: string;
  category: "Auth & Setup" | "Dashboards" | "Customers" | "Transactions" | "Reports" | "Settings";
}

const routes: RouteItem[] = [
  { name: "Splash Screen", path: "/splash", icon: "motion_photos_on", category: "Auth & Setup" },
  { name: "Login Screen", path: "/login", icon: "login", category: "Auth & Setup" },
  { name: "Shop Setup", path: "/setup", icon: "storefront", category: "Auth & Setup" },
  
  { name: "Owner Dashboard", path: "/dashboard/owner", icon: "dashboard", category: "Dashboards" },
  { name: "Staff Dashboard", path: "/dashboard/staff", icon: "badge", category: "Dashboards" },
  
  { name: "Customer List", path: "/customers/list", icon: "group", category: "Customers" },
  { name: "Add Customer", path: "/customers/add", icon: "person_add", category: "Customers" },
  { name: "Customer Ledger", path: "/customers/cust-1", icon: "menu_book", category: "Customers" },
  
  { name: "Add Udhar", path: "/transactions/add-udhar", icon: "remove_circle", category: "Transactions" },
  { name: "Add Payment", path: "/transactions/add-payment", icon: "add_circle", category: "Transactions" },
  
  { name: "Recovery Health", path: "/reports/recovery", icon: "trending_up", category: "Reports" },
  { name: "Shift Summary", path: "/reports/shift-summary", icon: "analytics", category: "Reports" },
  { name: "Activity Logs", path: "/reports/activity-logs", icon: "history", category: "Reports" },
  { name: "Account Statement", path: "/reports/statement", icon: "receipt_long", category: "Reports" },
  
  { name: "Settings Hub", path: "/settings", icon: "settings", category: "Settings" },
  { name: "Staff Directory", path: "/settings/staff", icon: "manage_accounts", category: "Settings" },
];

export default function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide developer panel in production if desired, but keep it active for testing
  return (
    <div className="fixed bottom-24 left-4 z-[9999] font-[var(--font-body)]">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-inverse-surface text-inverse-on-surface shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-outline/20"
        title="Developer Navigation Panel"
      >
        <span className="material-symbols-outlined text-[24px]">
          {isOpen ? "close" : "developer_mode"}
        </span>
      </button>

      {/* Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-end justify-center p-4 animate-[fade-in-up_0.3s_ease-out_forwards]" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-md bg-surface rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="font-[var(--font-heading)] text-[18px] leading-[24px] font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">navigation</span>
                  Quick Navigation
                </h3>
                <p className="text-[12px] text-on-surface-variant font-medium mt-1">
                  💡 Tip: Enter any 10 digits on Login page to test normal flow
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
              </button>
            </div>

            {/* Categorized Routes */}
            <div className="space-y-6 flex-1 pr-1 overflow-y-auto custom-scrollbar">
              {(["Auth & Setup", "Dashboards", "Customers", "Transactions", "Reports", "Settings"] as const).map((category) => {
                const categoryRoutes = routes.filter((r) => r.category === category);
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-[11px] font-bold tracking-wider text-on-surface-variant/70 uppercase">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryRoutes.map((route) => {
                        const isActive = pathname === route.path;
                        return (
                          <Link
                            key={route.path}
                            href={route.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              isActive
                                ? "bg-primary-container text-on-primary-container border-primary font-semibold shadow-sm"
                                : "bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-low"
                            }`}
                          >
                            <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-on-primary-container" : "text-primary"}`}>
                              {route.icon}
                            </span>
                            <span className="text-[12px] truncate leading-tight">
                              {route.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
