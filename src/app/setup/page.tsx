"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { addDoc, setDoc, doc, collection, serverTimestamp } from "firebase/firestore";

export default function SetupPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateShop = async () => {
    if (!shopName.trim() || !ownerName.trim() || !address.trim()) {
      setError("Please fill out all fields before continuing.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("You must be logged in to set up a shop. Please log in again.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      // 1. Generate a new auto-generated ID for the shop
      const shopsCollectionRef = collection(db, "shops");
      const newShopDocRef = doc(shopsCollectionRef);
      const shopId = newShopDocRef.id;

      const phone = currentUser.phoneNumber || "";

      // 2. Create the shop document at /shops/{shopId}
      await setDoc(newShopDocRef, {
        name: shopName.trim(),
        ownerName: ownerName.trim(),
        address: address.trim(),
        phone: phone,
        createdAt: serverTimestamp(),
      });

      // 3. Create the user profile document at /users/{uid}
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        shopId: shopId,
        role: "owner",
        name: ownerName.trim(),
        phone: phone,
      });

      // 4. Redirect to Owner Dashboard on success
      router.push("/dashboard/owner");
    } catch (err: any) {
      console.error("Error setting up shop:", err);
      setError(err.message || "Failed to create shop. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-[16px] h-14">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
            Setup Your Shop
          </h1>
        </div>
        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[12px] font-semibold">
          Step 2 of 2
        </span>
      </header>

      {/* Progress bar */}
      <div className="mx-[16px] h-1 bg-outline-variant/30 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full w-full" />
      </div>

      <main className="flex-1 px-[16px] pt-8 pb-6 flex flex-col">
        {/* Header icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center mb-[16px]">
            <span className="material-symbols-outlined text-on-primary-container text-[40px]">
              storefront
            </span>
          </div>
          <h2 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold text-on-surface text-center">
            Almost there!
          </h2>
          <p className="font-[var(--font-body)] text-[16px] leading-[24px] text-on-surface-variant text-center mt-1">
            Tell us a bit about your business to get started.
          </p>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-[24px] flex-1">
          {/* Shop Name */}
          <div>
            <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
              Shop Name
            </label>
            <div className="flex items-center gap-3 border border-outline-variant rounded-xl px-[16px] h-14 focus-within:border-primary focus-within:border-2 transition-colors bg-surface-container-lowest">
              <span className="material-symbols-outlined text-outline text-[20px]">store</span>
              <input
                type="text"
                placeholder="e.g. Ramesh General Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-[var(--font-body)] text-[16px] leading-[24px] placeholder:text-outline-variant/60"
              />
            </div>
            <p className="text-[12px] leading-[16px] text-on-surface-variant mt-1 px-1">
              This will appear on your digital receipts.
            </p>
          </div>

          {/* Owner Name */}
          <div>
            <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
              Owner Name
            </label>
            <div className="flex items-center gap-3 border border-outline-variant rounded-xl px-[16px] h-14 focus-within:border-primary focus-within:border-2 transition-colors bg-surface-container-lowest">
              <span className="material-symbols-outlined text-outline text-[20px]">person</span>
              <input
                type="text"
                placeholder="Your full name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-[var(--font-body)] text-[16px] leading-[24px] placeholder:text-outline-variant/60"
              />
            </div>
          </div>

          {/* Shop Address */}
          <div>
            <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
              Shop Address
            </label>
            <div className="flex items-start gap-3 border border-outline-variant rounded-xl px-[16px] py-4 focus-within:border-primary focus-within:border-2 transition-colors bg-surface-container-lowest min-h-[100px]">
              <span className="material-symbols-outlined text-outline text-[20px] mt-0.5">location_on</span>
              <textarea
                placeholder="Full address, city, and pin code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-[var(--font-body)] text-[16px] leading-[24px] placeholder:text-outline-variant/60 resize-none"
              />
            </div>
          </div>

          {/* Security badge */}
          <div className="bg-surface-container rounded-xl p-[16px] flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <div>
              <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                Verified Business
              </p>
              <p className="font-[var(--font-body)] text-[14px] leading-[20px] text-on-surface-variant">
                Your data is secured with enterprise-grade encryption.
              </p>
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
            onClick={handleCreateShop}
            disabled={isCreating}
            className="w-full h-14 bg-primary text-on-primary rounded-full font-[var(--font-body)] text-[16px] leading-[24px] font-semibold shadow-sm active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-[8px] disabled:opacity-85"
          >
            {isCreating ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                Creating...
              </>
            ) : (
              <>
                Create Shop
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
          <p className="text-center mt-4 font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
            By creating a shop, you agree to our{" "}
            <a href="#" className="text-primary underline underline-offset-2">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
