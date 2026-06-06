"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initRecaptcha, sendOTP, verifyOTP } from "@/lib/auth-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ConfirmationResult } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  
  // Auth state management
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 10) setPhone(val);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 6) setOtp(val);
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Initialize invisible reCAPTCHA attached to the button
      initRecaptcha("login-btn");

      // 2. Trigger Firebase signInWithPhoneNumber
      const result = await sendOTP(phone);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Please enter a valid 10-digit number.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError(err.message || "Failed to send code. Verify your number and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    console.log("[Login] Starting OTP verification. OTP length:", otp.length);
    
    if (!confirmationResult) {
      console.warn("[Login] Verification failed: confirmationResult is null.");
      setError("Session expired. Please request OTP again.");
      setStep("phone");
      return;
    }

    setError("");
    setLoading(true);
    try {
      console.log("[Login] Calling verifyOTP with code:", otp);
      // 1. Verify OTP code
      const credential = await verifyOTP(confirmationResult, otp);
      const uid = credential.user.uid;
      console.log("[Login] OTP verified successfully. User UID:", uid);

      // 2. Check user's role and shopId in Firestore (/users/{uid})
      console.log("[Login] Fetching user profile from Firestore: /users/" + uid);
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      // Set the session cookie immediately before performing redirects
      document.cookie = "kf-auth-token=true; path=/; max-age=86400";
      console.log("[Login] Session cookie set. Redirecting...");

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const role = data.role;
        const shopId = data.shopId;
        console.log("[Login] User profile found in Firestore:", { role, shopId });
        
        // 3. Route according to role using full window redirect
        if (role === "owner" || role === "admin") {
          console.log("[Login] Routing to owner dashboard");
          window.location.href = "/dashboard/owner";
        } else if (role === "staff") {
          console.log("[Login] Routing to staff dashboard");
          window.location.href = "/dashboard/staff";
        } else {
          console.log("[Login] Unknown role, routing to shop setup");
          window.location.href = "/setup";
        }
      } else {
        console.log("[Login] User profile document does NOT exist in Firestore. Routing to shop setup.");
        // Document does not exist, route to setup for new onboarding
        window.location.href = "/setup";
      }
    } catch (err: any) {
      console.error("[Login] OTP verification failed with error:", err);
      // Show exact Firebase error code and message
      const exactError = err.code ? `[${err.code}] ${err.message}` : err.message || err.toString();
      setError(exactError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col overflow-x-hidden relative">
      {/* Decorative pattern */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary/5 -z-10 bg-pattern" />

      <main className="w-full max-w-md mx-auto px-[16px] flex flex-col min-h-screen pt-20 pb-10">
        {/* Header */}
        <header className="flex flex-col items-start mb-[32px] animate-[fade-in-up_0.6s_ease-out_forwards]">
          <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-[24px] shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-on-primary-container text-[40px]">
              account_balance_wallet
            </span>
          </div>
          <h1 className="font-[var(--font-heading)] text-[28px] leading-[36px] font-semibold text-on-surface mb-[4px]">
            {step === "phone" ? "Welcome to KhataFlow" : "Verify Number"}
          </h1>
          <p className="font-[var(--font-body)] text-[16px] leading-[24px] text-on-surface-variant">
            {step === "phone"
              ? "Manage your shop's udhar easily"
              : `Enter 6-digit OTP sent to +91 ${phone.slice(0, 5)} ${phone.slice(5)}`}
          </p>
        </header>

        {/* Hero Image */}
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-[32px] bg-surface-container shadow-md border border-outline-variant/20">
          <img
            alt="Shop owner using KhataFlow"
            className="w-full h-full object-cover grayscale-[20%] opacity-90"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxWAwubcL120hjhgVM-1gadap7xeXSSIEcnAQuJoKYhUZGThB-ofVsSK1fQiMCZd1NC-GCP_S8c1WMuhTMQ0AuUbMyITjVAaCzVI6ZlRhyzuNzMQM6MG3GUq_D3D4iua3YU0-EjQn9PLtEJiEdKJOxrE8ubUrsCkhZ215RbPvPZ-OUAX7LtvgG6Txr0XP49KjG0Bcmm2LEwIowzrpbrXWtejaQ4zXC8yCPbf3PMcaxqJ8N5wQ6J3TZH_Ckn6bSaoKtgl1ifvvUkkae"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Auth Steps */}
        <section className="flex flex-col gap-[24px] flex-grow">
          {step === "phone" ? (
            // STEP 1: Phone Number Input
            <div>
              <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary mb-2 block px-1">
                Mobile Number
              </label>
              <div className="flex items-center gap-[8px] border-2 border-outline-variant bg-surface-container-lowest rounded-xl px-[16px] h-14 focus-within:border-primary transition-colors">
                <div className="flex items-center gap-1 border-r border-outline-variant pr-[16px] py-1">
                  <span className="text-on-surface font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold">
                    +91
                  </span>
                </div>
                <input
                  className="bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0 font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold placeholder:text-outline-variant/60 tracking-widest"
                  maxLength={10}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="00000 00000"
                  type="tel"
                />
              </div>
              {error && (
                <p className="text-error font-[var(--font-body)] text-[12px] leading-[16px] mt-2 px-1 font-semibold">
                  {error}
                </p>
              )}
            </div>
          ) : (
            // STEP 2: OTP Input
            <div>
              <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary mb-2 block px-1">
                Enter 6-Digit OTP
              </label>
              <div className="flex items-center gap-[8px] border-2 border-outline-variant bg-surface-container-lowest rounded-xl px-[16px] h-14 focus-within:border-primary transition-colors">
                <input
                  className="bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0 text-center font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold placeholder:text-outline-variant/60 tracking-[0.5em]"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  type="tel"
                />
              </div>
              {error && (
                <p className="text-error font-[var(--font-body)] text-[12px] leading-[16px] mt-2 px-1 font-semibold">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* CTA Button Wrapper */}
          <div className="mt-auto flex flex-col gap-2">
            {step === "phone" ? (
              <button
                id="login-btn"
                className="w-full h-14 bg-primary text-on-primary rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold shadow-sm active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:bg-outline-variant disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                disabled={phone.length !== 10 || loading}
                onClick={handleSendOtp}
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    Continue
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  id="verify-btn"
                  className="w-full h-14 bg-primary text-on-primary rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold shadow-sm active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:bg-outline-variant disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                  disabled={otp.length !== 6 || loading}
                  onClick={handleVerifyOtp}
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      Verify & Proceed
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="text-primary font-semibold text-[14px] hover:underline flex items-center gap-1 mx-auto mt-2 active:scale-95 transition-all"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Change phone number
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-[32px] text-center">
          <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant/80 px-[32px]">
            By continuing, you agree to{" "}
            <a className="text-primary font-semibold underline underline-offset-4 decoration-primary/30" href="#">
              T&C
            </a>{" "}
            and{" "}
            <a className="text-primary font-semibold underline underline-offset-4 decoration-primary/30" href="#">
              Privacy Policy
            </a>
          </p>
        </footer>

        {/* Invisible reCAPTCHA container for Firebase fallback */}
        <div id="recaptcha-container" className="hidden"></div>
      </main>
    </div>
  );
}
