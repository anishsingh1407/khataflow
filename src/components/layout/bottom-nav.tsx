"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

interface BottomNavProps {
  items?: NavItem[];
  variant?: "owner" | "staff";
}

const ownerNavItems: NavItem[] = [
  { label: "Home", icon: "home", href: "/dashboard/owner" },
  { label: "Customers", icon: "group", href: "/customers/list" },
  { label: "Reports", icon: "analytics", href: "/reports/shift-summary" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

const staffNavItems: NavItem[] = [
  { label: "Home", icon: "home", href: "/dashboard/staff" },
  { label: "Customers", icon: "group", href: "/customers/list" },
];

export default function BottomNav({ items, variant = "owner" }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = items || (variant === "owner" ? ownerNavItems : staffNavItems);

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-[8px] py-[12px] bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-xl border-t border-outline-variant">
      {navItems.map((item) => {
        let isActive = pathname === item.href;
        if (!isActive) {
          if (item.href.includes("/dashboard/owner") && pathname.includes("/dashboard/owner")) {
            isActive = true;
          } else if (item.href.includes("/dashboard/staff") && pathname.includes("/dashboard/staff")) {
            isActive = true;
          } else if (item.href.includes("/customers") && pathname.includes("/customers")) {
            isActive = true;
          } else if (item.href.includes("/reports") && pathname.includes("/reports")) {
            isActive = true;
          } else if (item.href.includes("/settings") && pathname.includes("/settings")) {
            isActive = true;
          }
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-5 py-1 transition-all duration-200 ${
              isActive
                ? "bg-secondary-container text-on-secondary-container rounded-full"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
