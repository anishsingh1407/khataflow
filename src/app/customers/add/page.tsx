"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addCustomer } from "@/lib/firestore-service";

export default function AddCustomerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const shopId = user?.shopId;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveCustomer = async () => {
    if (!name.trim() || phone.length !== 10) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!shopId) {
      setError("Active session not found. Please log in again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Calculate initials from name
      const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

      // 2. Assign a default styling color scheme for the avatar initials
      const colorSchemes = [
        "bg-primary/10 text-primary",
        "bg-secondary-container text-on-secondary-container",
        "bg-tertiary-container text-on-tertiary-container",
      ];
      const randomColor = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

      // 3. Add customer doc in Firestore
      await addCustomer(shopId, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        initials: initials,
        balance: 0,
        status: "settled", // standard status corresponding to "clear" / settled balance
        lastUpdated: new Date().toISOString(),
        memberSince: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        avatarColor: randomColor,
      });

      // 4. Redirect on success
      router.push("/customers/list");
    } catch (err: any) {
      console.error("Error adding customer:", err);
      setError(err.message || "Failed to save customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-[16px] h-14">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
          Add Customer
        </h1>
      </header>

      <main className="flex-1 px-[16px] pb-6 flex flex-col">
        {/* Icon */}
        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center mb-[16px]">
            <span className="material-symbols-outlined text-on-primary-container text-[40px]">person_add</span>
          </div>
          <h2 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold text-on-surface text-center">
            New Customer
          </h2>
          <p className="text-on-surface-variant text-center text-[14px] mt-1">
            Add a new customer to your ledger
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-[20px] flex-1">
          <div>
            <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
              Customer Name *
            </label>
            <div className="flex items-center gap-3 border border-outline-variant rounded-xl px-[16px] h-14 focus-within:border-primary focus-within:border-2 transition-colors bg-surface-container-lowest">
              <span className="material-symbols-outlined text-outline text-[20px]">person</span>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-[16px] leading-[24px] placeholder:text-outline-variant/60"
              />
            </div>
          </div>

          <div>
            <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
              Phone Number *
            </label>
            <div className="flex items-center gap-3 border border-outline-variant rounded-xl px-[16px] h-14 focus-within:border-primary focus-within:border-2 transition-colors bg-surface-container-lowest">
              <span className="material-symbols-outlined text-outline text-[20px]">phone</span>
              <div className="flex items-center gap-1 border-r border-outline-variant pr-3 py-1">
                <span className="text-on-surface font-semibold">+91</span>
              </div>
              <input
                type="tel"
                placeholder="00000 00000"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
                maxLength={10}
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-[16px] leading-[24px] placeholder:text-outline-variant/60 tracking-widest"
              />
            </div>
          </div>

          <div>
            <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
              Address (Optional)
            </label>
            <div className="flex items-start gap-3 border border-outline-variant rounded-xl px-[16px] py-4 focus-within:border-primary focus-within:border-2 transition-colors bg-surface-container-lowest">
              <span className="material-symbols-outlined text-outline text-[20px] mt-0.5">location_on</span>
              <textarea
                placeholder="Street, area, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-[16px] leading-[24px] placeholder:text-outline-variant/60 resize-none"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          {error && (
            <p className="text-error font-[var(--font-body)] text-[14px] leading-[20px] text-center mb-4 font-semibold">
              {error}
            </p>
          )}
          
          <button
            onClick={handleSaveCustomer}
            disabled={!name || phone.length !== 10 || loading}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-semibold text-[16px] shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-outline-variant flex items-center justify-center gap-[8px]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                Saving Customer...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">person_add</span>
                Save Customer
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
