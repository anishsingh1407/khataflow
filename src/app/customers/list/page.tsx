"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCustomers } from "@/lib/firestore-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TopAppBar from "@/components/layout/top-app-bar";
import BottomNav from "@/components/layout/bottom-nav";
import FAB from "@/components/layout/fab";
import SearchBar from "@/components/shared/search-bar";
import CustomerRow from "@/components/shared/customer-row";
import { formatCurrency } from "@/lib/utils";
import { Customer } from "@/lib/types";

export default function CustomerListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopName, setShopName] = useState("Loading shop...");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

    const loadCustomersData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Shop details
        const shopDocRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopDocRef);
        if (shopSnap.exists()) {
          setShopName(shopSnap.data().name || "My General Store");
        }

        // 2. Fetch Customers
        const customerList = await getCustomers(shopId);
        setCustomers(customerList);
      } catch (err) {
        console.error("Error loading customers:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomersData();
  }, [shopId, authLoading, user, router]);

  const isDataLoading = authLoading || loading;

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopAppBar title={shopName} showLogo showSearch />

      <main className="pt-14 px-[16px] pb-[100px]">
        {/* Search */}
        <div className="py-[12px]">
          <SearchBar
            placeholder="Search customers..."
            showFilter
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* Total Outstanding */}
        <div className="bg-primary-container rounded-2xl p-[16px] mb-[24px] flex justify-between items-center text-on-primary-container shadow-sm border border-primary/10">
          <div>
            <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-90 uppercase tracking-wider">
              Total Outstanding
            </p>
            <p className="font-[var(--font-heading)] text-[24px] leading-[32px] font-bold mt-1">
              {isDataLoading ? "..." : formatCurrency(totalOutstanding)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-90">
              {isDataLoading ? "..." : `${customers.length} Customers`}
            </p>
            <p className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block mt-1">
              Live updates
            </p>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex flex-col gap-[12px]">
          {isDataLoading ? (
            // Skeleton Loader
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[72px] bg-surface-container-low animate-pulse w-full rounded-2xl border border-outline-variant/10"
              />
            ))
          ) : filteredCustomers.length === 0 ? (
            // Empty State
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 text-center text-on-surface-variant italic">
              {searchQuery ? "No matching customers found." : "No customers yet. Click + to add your first customer."}
            </div>
          ) : (
            // Customer Rows
            filteredCustomers.map((customer) => (
              <CustomerRow
                key={customer.id}
                id={customer.id}
                name={customer.name}
                initials={customer.initials}
                balance={customer.balance}
                status={customer.status}
                lastUpdated={customer.lastUpdated}
                avatarColor={customer.avatarColor}
                href={`/customers/${customer.id}`}
              />
            ))
          )}
        </div>
      </main>

      <FAB href="/customers/add" icon="add" />
      <BottomNav variant="owner" />
    </div>
  );
}
