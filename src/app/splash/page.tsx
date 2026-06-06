"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-surface-container-lowest min-h-screen flex flex-col items-center justify-center p-[16px] overflow-hidden">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        {/* Logo */}
        <div
          className="relative mb-[24px] animate-[fade-in-up_0.8s_ease-out_0.1s_forwards] opacity-0"
        >
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl overflow-hidden bg-white flex items-center justify-center shadow-sm">
            <img
              alt="KhataFlow Logo"
              className="w-full h-full object-contain p-4"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVqfZz5yK2N8MVIQ3ZYugc0HPm1hrCcD9qHwwL04FJDZ7qLTA8q10VGrgoNUNaAlpdjNwOOyjUvVfqiwTEOp5icX8mEOcUnxJOQut4ula3RmLsRJfwWJtxB1QACdsvmJ9dz6QTGxsdPfdF_UMLkcXI3GjOcNO22Fmgi5h3krVyHl9U2R7SPjV9riLEcnyHDpViruhWwuQZM5Zd3rHIjIJ0U8R3PQd0vARRF9sCWoj90bjjNcn2545TRNBOdPFaUT8WMrPDZ_EjvJ7r"
            />
          </div>
          {/* Glow */}
          <div className="absolute -inset-4 bg-primary/5 blur-3xl -z-10 rounded-full" />
        </div>

        {/* Identity */}
        <div
          className="text-center animate-[fade-in-up_0.8s_ease-out_0.3s_forwards] opacity-0"
        >
          <h1 className="font-[var(--font-poppins)] text-[28px] leading-[36px] font-semibold text-primary tracking-tight mb-[4px]">
            KhataFlow
          </h1>
          <p className="font-[var(--font-body)] text-[16px] leading-[24px] text-on-surface-variant opacity-80 tracking-wide">
            Digital Udhar Management
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full py-[32px] flex flex-col items-center gap-[16px] animate-[fade-in-up_0.8s_ease-out_0.6s_forwards] opacity-0"
      >
        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-surface-variant rounded-full" />
          <div className="absolute w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-[spin-slow_1.5s_linear_infinite]" />
        </div>

        {/* Version */}
        <div className="flex items-center gap-[4px]">
          <span
            className="material-symbols-outlined text-outline text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified_user
          </span>
          <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-outline-variant uppercase tracking-widest">
            Secure Ledger v2.0
          </span>
        </div>
      </footer>
    </div>
  );
}
