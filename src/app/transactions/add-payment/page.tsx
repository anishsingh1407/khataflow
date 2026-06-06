"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCustomers, addTransaction, updateCustomerBalance } from "@/lib/firestore-service";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { Customer } from "@/lib/types";

export default function AddPaymentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch customers
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!shopId) {
      router.push("/setup");
      return;
    }

    const loadCustomers = async () => {
      try {
        const customerList = await getCustomers(shopId);
        setCustomers(customerList);
      } catch (err) {
        console.error("Error loading customers:", err);
      }
    };

    loadCustomers();
  }, [shopId, authLoading, user, router]);

  const methods = [
    { id: "cash", label: "Cash", icon: "payments" },
    { id: "upi", label: "UPI", icon: "qr_code_2" },
    { id: "bank", label: "Bank Transfer", icon: "account_balance" },
    { id: "other", label: "Other", icon: "more_horiz" },
  ];

  const handleSavePayment = async () => {
    const paymentVal = parseFloat(amount);
    if (!selectedCustomer) {
      setError("Please select a customer first.");
      return;
    }

    if (isNaN(paymentVal) || paymentVal <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Session expired. Please log in again.");
      return;
    }

    if (!shopId) {
      setError("Active shop session not found. Please log in again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timeStr = today.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // Construct description incorporating the payment method
      const methodLabel = methods.find((m) => m.id === paymentMethod)?.label || "Cash";
      const description = notes.trim()
        ? `${notes.trim()} (${methodLabel})`
        : `Payment received (${methodLabel})`;

      // 1. Add Transaction doc in Firestore
      await addTransaction(shopId, {
        customerId: selectedCustomer,
        type: "payment",
        amount: paymentVal,
        description: description,
        date: dateStr,
        time: timeStr,
        recordedBy: currentUser.uid,
      });

      // 2. Calculate and update customer balance
      const selectedCustObj = customers.find((c) => c.id === selectedCustomer);
      const currentBalance = selectedCustObj?.balance || 0;
      const newBalance = Math.max(0, currentBalance - paymentVal);
      const newStatus = newBalance === 0 ? "settled" : "pending";

      await updateCustomerBalance(shopId, selectedCustomer, newBalance, newStatus);

      // Reset fields upon successful submit
      const targetCustomer = selectedCustomer;
      setSelectedCustomer(null);
      setSearchQuery("");
      setAmount("");
      setPaymentMethod("cash");
      setNotes("");

      // 3. Redirect on success
      router.push(`/customers/${targetCustomer}`);
    } catch (err: any) {
      console.error("Error saving payment transaction:", err);
      setError(err.message || "Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query)
    );
  });

  const selectedCustObj = customers.find((c) => c.id === selectedCustomer);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-[16px] h-14 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
            Add Payment
          </h1>
        </div>
        <span className="material-symbols-outlined text-outline">more_vert</span>
      </header>

      <main className="flex-1 px-[16px] pt-4 pb-6 flex flex-col">
        {/* Customer Selector */}
        <section className="mb-[20px]">
          <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-3 block">
            Select Customer
          </label>
          
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-primary-container text-on-primary-container p-4 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                  {selectedCustObj?.initials || "C"}
                </div>
                <div>
                  <p className="font-semibold text-[14px]">{selectedCustObj?.name}</p>
                  <p className="text-[12px] opacity-80">{formatPhoneNumber(selectedCustObj?.phone || "")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setSearchQuery("");
                }}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="flex items-center gap-[8px] border border-outline-variant bg-surface-container-lowest rounded-xl px-[16px] h-12 focus-within:border-primary transition-colors mb-3">
                <span className="material-symbols-outlined text-outline text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none w-full text-[14px] placeholder:text-outline-variant/60"
                />
              </div>

              {/* Quick avatars list */}
              <div className="flex gap-[12px] overflow-x-auto no-scrollbar pb-1">
                {filteredCustomers.length === 0 ? (
                  <p className="text-[12px] italic text-on-surface-variant py-4 px-2">
                    No customers found.
                  </p>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c.id);
                          setSearchQuery("");
                        }}
                        className={`flex flex-col items-center gap-1 flex-shrink-0 ${
                          isSelected ? "opacity-100 scale-105" : "opacity-75"
                        } transition-all`}
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-[18px] border-2 ${
                            c.avatarColor || "bg-primary/10 text-primary"
                          } ${isSelected ? "border-primary" : "border-outline-variant"}`}
                        >
                          {c.initials}
                        </div>
                        <span className="text-[11px] font-medium text-on-surface-variant truncate max-w-[60px]">
                          {c.name}
                        </span>
                      </button>
                    );
                  })
                )}
                <button
                  onClick={() => router.push("/customers/add")}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5">
                    <span className="material-symbols-outlined text-primary text-[24px]">add</span>
                  </div>
                  <span className="text-[11px] font-medium text-primary">New</span>
                </button>
              </div>
            </>
          )}
        </section>

        {/* Amount Input */}
        <section className="mb-[20px]">
          <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
            Payment Amount
          </label>
          <div className="flex items-center border-2 border-outline-variant bg-surface-container-lowest rounded-xl px-[16px] h-16 focus-within:border-primary transition-colors">
            <span className="font-[var(--font-heading)] text-[32px] leading-[40px] font-semibold text-on-surface-variant mr-2">₹</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full font-[var(--font-heading)] text-[32px] leading-[40px] font-semibold placeholder:text-outline-variant/40"
            />
          </div>
        </section>

        {/* Payment Method */}
        <section className="mb-[20px]">
          <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-3 block">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-[8px]">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex flex-col items-center gap-1 p-[12px] rounded-xl border transition-all ${
                  paymentMethod === method.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{method.icon}</span>
                <span className="text-[11px] font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="mb-[20px]">
          <label className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface mb-2 block">
            Notes (Optional)
          </label>
          <div className="flex items-start gap-3 border border-outline-variant rounded-xl px-[16px] py-4 focus-within:border-primary transition-colors bg-surface-container-lowest">
            <span className="material-symbols-outlined text-outline text-[20px] mt-0.5">edit_note</span>
            <textarea
              placeholder="e.g. Partial payment for Oct invoice"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-transparent border-none focus:outline-none w-full text-[14px] leading-[20px] placeholder:text-outline-variant/60 resize-none"
            />
          </div>
        </section>

        {/* Total Card */}
        {parseFloat(amount) > 0 && (
          <div className="bg-primary p-[16px] rounded-xl mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-on-primary/80 text-[12px] font-medium uppercase tracking-wider">Payment Amount</p>
                <p className="font-[var(--font-heading)] text-[28px] leading-[36px] font-semibold text-on-primary">
                  {formatCurrency(parseFloat(amount))}
                </p>
              </div>
              <div className="text-right text-on-primary/80 text-[12px]">
                <p className="capitalize">{paymentMethod}</p>
                <p className="mt-1">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          {error && (
            <p className="text-error font-[var(--font-body)] text-[14px] leading-[20px] text-center mb-4 font-semibold">
              {error}
            </p>
          )}

          <button
            onClick={handleSavePayment}
            disabled={!amount || !selectedCustomer || loading}
            className="w-full h-14 bg-primary text-on-primary rounded-2xl font-semibold text-[16px] shadow-lg active:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:bg-outline-variant"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                Recording Payment...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">download</span>
                Record Payment
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
