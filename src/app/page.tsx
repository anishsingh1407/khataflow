"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/splash");
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-[40px]">
            account_balance_wallet
          </span>
        </div>
        <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
          KhataFlow
        </p>
      </div>
    </div>
  );
}
