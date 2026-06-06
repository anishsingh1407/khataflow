"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCustomers, addTransaction, updateCustomerBalance } from "@/lib/firestore-service";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import { Customer } from "@/lib/types";

interface UdharItem {
  id: number;
  productName: string;
  price: string;
  quantity: number;
}

export default function AddUdharPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [shopName, setShopName] = useState("My General Store");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [items, setItems] = useState<UdharItem[]>([
    { id: 1, productName: "", price: "", quantity: 1 },
  ]);
  const [whatsappPreview, setWhatsappPreview] = useState(true);

  // Fetch shop details and customers list
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

    const loadPageData = async () => {
      try {
        const shopSnap = await getDoc(doc(db, "shops", shopId));
        if (shopSnap.exists()) {
          setShopName(shopSnap.data().name || "My General Store");
        }

        const customerList = await getCustomers(shopId);
        setCustomers(customerList);
      } catch (err) {
        console.error("Error loading page data:", err);
      }
    };

    loadPageData();
  }, [shopId, authLoading, user, router]);

  const total = items.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity,
    0
  );
  
  const activeItems = items.filter((i) => i.productName.trim() && parseFloat(i.price) > 0);
  const itemCount = activeItems.length;

  const updateItem = (id: number, field: keyof UdharItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), productName: "", price: "", quantity: 1 },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSaveUdhar = async () => {
    if (!selectedCustomer) {
      setError("Please select a customer first.");
      return;
    }

    if (activeItems.length === 0) {
      setError("Please add at least one item with a name and positive price.");
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
      const description = activeItems
        .map((i) => `${i.quantity}x ${i.productName.trim()}`)
        .join(", ");

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timeStr = today.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // 1. Add Transaction record to Firestore
      await addTransaction(shopId, {
        customerId: selectedCustomer,
        type: "udhar",
        amount: total,
        description: description,
        date: dateStr,
        time: timeStr,
        recordedBy: currentUser.uid,
      });

      // 2. Update Customer Balance
      const selectedCustObj = customers.find((c) => c.id === selectedCustomer);
      const currentBalance = selectedCustObj?.balance || 0;
      const newBalance = currentBalance + total;
      
      // status becomes "pending" if balance is positive, else settled
      const newStatus = newBalance > 0 ? "pending" : "settled";

      await updateCustomerBalance(shopId, selectedCustomer, newBalance, newStatus);

      // Reset fields upon successful submit
      const targetCustomer = selectedCustomer;
      setSelectedCustomer(null);
      setSearchQuery("");
      setItems([{ id: 1, productName: "", price: "", quantity: 1 }]);

      // 3. Redirect to customer's ledger screen
      router.push(`/customers/${targetCustomer}`);
    } catch (err: any) {
      console.error("Error saving udhar:", err);
      setError(err.message || "Failed to record transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const selectedCustObj = customers.find((c) => c.id === selectedCustomer);

  // Suggestions for fast input
  const suggestions = ["Milk", "Bread", "Eggs", "Cigarette", "Soda", "Rice", "Atta"];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-[16px] h-14 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
            Add Udhar
          </h1>
        </div>
        <span className="material-symbols-outlined text-outline">more_vert</span>
      </header>

      <main className="flex-1 px-[16px] pt-4 pb-6 flex flex-col overflow-y-auto">
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
                  <p className="text-[12px] opacity-80">{selectedCustObj?.phone}</p>
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
                    No matching customers found.
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

        {/* Suggestion tags */}
        <section className="mb-[20px]">
          <p className="text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant mb-2">
            QUICK PRODUCT SUGGESTIONS
          </p>
          <div className="flex gap-[8px] flex-wrap">
            {suggestions.map((product) => (
              <button
                key={product}
                onClick={() => {
                  const emptyItem = items.find((i) => !i.productName.trim());
                  if (emptyItem) {
                    updateItem(emptyItem.id, "productName", product);
                  } else {
                    setItems((prev) => [
                      ...prev,
                      { id: Date.now(), productName: product, price: "", quantity: 1 },
                    ]);
                  }
                }}
                className="px-[16px] py-[8px] rounded-full bg-surface-container border border-outline-variant/30 text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                {product}
              </button>
            ))}
          </div>
        </section>

        {/* Item Cards */}
        <section className="flex flex-col gap-[12px] mb-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-[16px]"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[12px] font-bold text-on-surface-variant uppercase">
                  Item {index + 1}
                </span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-error">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-[12px]">
                <input
                  type="text"
                  placeholder="Product name"
                  value={item.productName}
                  onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-[12px] h-11 bg-transparent focus:outline-none focus:border-primary text-[14px] placeholder:text-outline-variant/60"
                />
                <div className="flex gap-[12px]">
                  <div className="flex-1 flex items-center border border-outline-variant rounded-lg px-[12px] h-11 focus-within:border-primary">
                    <span className="text-on-surface-variant text-[14px] mr-1">₹</span>
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, "price", e.target.value)}
                      className="bg-transparent border-none focus:outline-none w-full text-[14px] placeholder:text-outline-variant/60"
                    />
                  </div>
                  <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden h-11">
                    <button
                      onClick={() =>
                        updateItem(item.id, "quantity", Math.max(1, item.quantity - 1))
                      }
                      className="w-10 h-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="w-8 text-center font-semibold text-[14px]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem(item.id, "quantity", item.quantity + 1)}
                      className="w-10 h-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Another */}
          <button
            onClick={addItem}
            className="border-2 border-dashed border-primary/30 rounded-xl p-[14px] flex items-center justify-center gap-2 text-primary font-semibold text-[14px] hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add Another Item
          </button>
        </section>

        {/* Total Card */}
        {total > 0 && (
          <div className="bg-primary-container text-on-primary-container p-[24px] rounded-2xl shadow-md flex justify-between items-center overflow-hidden relative border border-primary/10 mb-4">
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none select-none">
              <span className="material-symbols-outlined text-[120px]">receipt_long</span>
            </div>
            <div className="relative z-10">
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-80 uppercase">
                RUNNING TOTAL
              </p>
              <p className="font-[var(--font-heading)] text-[32px] leading-[40px] tracking-[-0.02em] font-bold">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="relative z-10 text-right">
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-80">
                {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
              </p>
              <div className="flex items-center gap-[4px] justify-end mt-1 font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-80">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Toggle */}
        <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/30 rounded-xl p-[16px] mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#25D366]/10 rounded-lg">
              <span className="material-symbols-outlined text-[#25D366] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <div>
              <p className="font-[var(--font-body)] text-[14px] leading-[20px] font-semibold text-on-surface">WhatsApp Preview</p>
              <p className="font-[var(--font-body)] text-[12px] leading-[16px] text-on-surface-variant">Send summary to customer</p>
            </div>
          </div>
          <button
            onClick={() => setWhatsappPreview(!whatsappPreview)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              whatsappPreview ? "bg-primary" : "bg-outline-variant"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                whatsappPreview ? "left-[28px]" : "left-[4px]"
              }`}
            />
          </button>
        </div>

        {/* WhatsApp Preview Collapsible Content */}
        {whatsappPreview && (
          <div className="p-4 bg-surface border border-outline-variant rounded-xl border-l-4 border-l-[#25D366] italic text-on-surface-variant text-[14px] leading-[20px] mb-6">
            &quot;Hello {selectedCustObj?.name || "Customer"}, a new Udhar entry of <span className="font-bold">₹{total}</span> for {activeItems.map(i => `${i.quantity}x ${i.productName}`).join(', ') || 'selected items'} has been added to your account at <span className="font-bold">{shopName}</span>. Total outstanding: ₹{(selectedCustObj?.balance || 0) + total}.&quot;
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
            onClick={handleSaveUdhar}
            disabled={!selectedCustomer || total <= 0 || loading}
            className="w-full h-14 bg-primary text-on-primary rounded-2xl font-semibold text-[16px] shadow-lg active:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-[8px]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                Recording Udhar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                Save & Send WhatsApp
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
