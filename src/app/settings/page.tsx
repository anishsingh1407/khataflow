"use client";

import BottomNav from "@/components/layout/bottom-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme, Theme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { formatPhoneNumber } from "@/lib/utils";

interface SettingsItem {
  icon: string;
  label: string;
  description: string;
  href?: string;
  badge?: string;
  iconBg?: string;
}

const profileSection: SettingsItem[] = [
  {
    icon: "store",
    label: "Shop Profile",
    description: "Business name, address, UPI details",
    href: "/setup",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "group",
    label: "Staff Management",
    description: "Add, remove, and manage staff access",
    href: "/settings/staff",
    iconBg: "bg-secondary-container text-on-secondary-container",
    badge: "4",
  },
];

const generalSection: SettingsItem[] = [
  {
    icon: "notifications",
    label: "Notifications",
    description: "SMS, WhatsApp & push alert preferences",
    iconBg: "bg-tertiary-container text-on-tertiary-container",
  },
  {
    icon: "language",
    label: "Language",
    description: "English",
    iconBg: "bg-surface-container-highest text-on-surface-variant",
  },
  {
    icon: "dark_mode",
    label: "Appearance",
    description: "Light mode",
    iconBg: "bg-surface-container-highest text-on-surface-variant",
  },
  {
    icon: "security",
    label: "PIN & Security",
    description: "Set app lock and transaction PIN",
    iconBg: "bg-error-container text-on-error-container",
  },
];

const dataSection: SettingsItem[] = [
  {
    icon: "backup",
    label: "Data Backup",
    description: "Backup to Google Drive or local file",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: "download",
    label: "Export Data",
    description: "CSV, Excel, or PDF exports",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: "receipt_long",
    label: "Statement Template",
    description: "Customize receipt and statement layout",
    href: "/reports/statement",
    iconBg: "bg-primary/10 text-primary",
  },
];

const supportSection: SettingsItem[] = [
  {
    icon: "help",
    label: "Help & Support",
    description: "FAQs, contact us, feedback",
    iconBg: "bg-surface-container-highest text-on-surface-variant",
  },
  {
    icon: "info",
    label: "About KhataFlow",
    description: "Version 2.0.0 • Terms • Privacy",
    iconBg: "bg-surface-container-highest text-on-surface-variant",
  },
];

function SettingsGroup({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: SettingsItem[];
  onItemClick: (item: SettingsItem) => void;
}) {
  return (
    <section className="mb-[24px]">
      <h3 className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant uppercase tracking-wider mb-[12px] px-1">
        {title}
      </h3>
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden divide-y divide-outline-variant/20">
        {items.map((item) => {
          const content = (
            <div className="flex items-center justify-between p-[16px] hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-[16px]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                      {item.label}
                    </p>
                    {item.badge && (
                      <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-[18px]">chevron_right</span>
            </div>
          );

          return item.href ? (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.label} onClick={() => onItemClick(item)} className="cursor-pointer">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const shopId = user?.shopId;

  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");

  useEffect(() => {
    if (!shopId) return;
    const fetchStaffCount = async () => {
      try {
        const staffSnap = await getDocs(collection(db, "shops", shopId, "staff"));
        setStaffCount(staffSnap.size);
      } catch (err) {
        console.error("Error fetching staff count:", err);
      }
    };
    fetchStaffCount();
  }, [shopId]);

  const themeLabel = theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System default";

  const dynamicGeneralSection = generalSection.map((item) => {
    if (item.label === "Appearance") {
      return { ...item, description: themeLabel };
    }
    return item;
  });

  const handleItemClick = (item: SettingsItem) => {
    if (item.label === "Appearance") {
      setIsThemeSheetOpen(true);
    } else {
      setSelectedFeature(item.label);
      setIsModalOpen(true);
    }
  };

  const dynamicProfileSection = [
    {
      icon: "store",
      label: "Shop Profile",
      description: "Business name, address, UPI details",
      href: "/setup",
      iconBg: "bg-primary-container text-on-primary-container",
    },
    {
      icon: "group",
      label: "Staff Management",
      description: "Add, remove, and manage staff access",
      href: "/settings/staff",
      iconBg: "bg-secondary-container text-on-secondary-container",
      badge: staffCount !== null && staffCount > 0 ? `${staffCount}` : undefined,
    },
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 flex items-center px-[16px] h-14 bg-surface">
        <div className="flex items-center gap-[8px]">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary">
            Settings
          </h1>
        </div>
      </header>

      <main className="px-[16px] pt-2 max-w-2xl mx-auto">
        {/* User Card */}
        <section className="mb-[24px]">
          <div className="bg-primary p-[20px] rounded-2xl text-on-primary shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-on-primary/20 flex items-center justify-center font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
                {user?.name ? user.name.trim().substring(0, 2).toUpperCase() : "O"}
              </div>
              <div>
                <h2 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
                  {user?.name || "Owner"}
                </h2>
                <p className="text-on-primary/80 font-[var(--font-body)] text-[14px] leading-[20px]">
                  {user?.phone ? formatPhoneNumber(user.phone) : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[12px]">
              <span className="bg-on-primary/20 text-on-primary px-3 py-1 rounded-full text-[12px] font-bold">
                👑 Owner
              </span>
              <span className="bg-on-primary/20 text-on-primary px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                Verified
              </span>
            </div>
          </div>
        </section>

        <SettingsGroup title="Shop & Team" items={dynamicProfileSection} onItemClick={handleItemClick} />
        <SettingsGroup title="General" items={dynamicGeneralSection} onItemClick={handleItemClick} />
        <SettingsGroup title="Data & Reports" items={dataSection} onItemClick={handleItemClick} />
        <SettingsGroup title="Support" items={supportSection} onItemClick={handleItemClick} />

        {/* Logout */}
        <section className="mb-[32px]">
          <button
            onClick={async () => {
              try {
                await signOut();
              } catch (e) {
                console.error("Signout error:", e);
              }
              router.push("/login");
            }}
            className="w-full bg-error-container text-on-error-container p-[16px] rounded-2xl font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
          <p className="text-center mt-4 font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
            KhataFlow v2.0.0 • Made with ❤️ in India
          </p>
        </section>
      </main>

      {/* Coming Soon Bottom Sheet Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-end justify-center transition-opacity duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-surface text-on-surface w-full max-w-md rounded-t-3xl p-6 pb-8 shadow-2xl flex flex-col items-center border-t border-outline-variant/20 z-[101] animate-slide-up transform translate-y-0 transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle pill */}
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mb-6" />

            {/* Icon */}
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] animate-pulse">
                hourglass_top
              </span>
            </div>

            {/* Feature Title */}
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-on-surface mb-2">
              {selectedFeature} Coming Soon
            </h3>

            {/* Description */}
            <p className="font-[var(--font-body)] text-[14px] leading-[20px] text-on-surface-variant text-center max-w-[300px] mb-6">
              This feature will be available in the next update. Thank you for your patience!
            </p>

            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full h-12 bg-primary text-on-primary rounded-full font-semibold font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] shadow-sm hover:brightness-95 active:scale-[0.98] transition-all"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}

      {/* Theme Picker Bottom Sheet */}
      {isThemeSheetOpen && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-end justify-center transition-opacity duration-300"
          onClick={() => setIsThemeSheetOpen(false)}
        >
          <div
            className="bg-surface text-on-surface w-full max-w-md rounded-t-3xl p-6 pb-8 shadow-2xl flex flex-col items-center border-t border-outline-variant/20 z-[101] animate-slide-up transform translate-y-0 transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle pill */}
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mb-6" />

            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-on-surface mb-4 self-start pl-1">
              Choose Theme
            </h3>

            <div className="w-full flex flex-col gap-2 mb-6">
              {[
                { id: "light" as Theme, label: "Light ☀️", icon: "light_mode" },
                { id: "dark" as Theme, label: "Dark 🌙", icon: "dark_mode" },
                { id: "system" as Theme, label: "System 💻", icon: "settings_suggest" },
              ].map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      setIsThemeSheetOpen(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">{opt.icon}</span>
                      <span className="font-semibold text-[14px]">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsThemeSheetOpen(false)}
              className="w-full h-12 bg-primary text-on-primary rounded-full font-semibold font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav variant="owner" />
    </div>
  );
}
