"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

interface TopAppBarProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  profileImageUrl?: string;
  showLogo?: boolean;
  rightActions?: React.ReactNode;
  roleBadge?: "owner" | "staff";
  onSearchClick?: () => void;
}

export default function TopAppBar({
  title,
  showBack = false,
  backHref,
  showSearch = false,
  showProfile = false,
  profileImageUrl,
  showLogo = false,
  rightActions,
  roleBadge,
  onSearchClick,
}: TopAppBarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 z-50 w-full h-14 flex justify-between items-center px-[16px] bg-surface transition-transform duration-150">
      <div className="flex items-center gap-[12px]">
        {showBack && (
          <button
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-primary">
              arrow_back
            </span>
          </button>
        )}
        {showLogo && (
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]">
              storefront
            </span>
          </div>
        )}
        <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary truncate max-w-[200px]">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-[12px]">
        {roleBadge && (
          <div className="flex items-center gap-2 bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
            <span className="material-symbols-outlined text-[18px]">
              workspace_premium
            </span>
            <span className="capitalize">{roleBadge}</span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-surface-container-high transition-all active:scale-90 text-primary"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
        {showSearch && (
          <button
            onClick={onSearchClick}
            className="p-2 rounded-full hover:bg-surface-container-high transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-primary">
              search
            </span>
          </button>
        )}
        {rightActions}
        {showProfile && (
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm border border-outline-variant">
            {user?.name ? user.name.trim().charAt(0).toUpperCase() : "O"}
          </div>
        )}
      </div>
    </header>
  );
}
