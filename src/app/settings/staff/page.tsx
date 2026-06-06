"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import TopAppBar from "@/components/layout/top-app-bar";
import BottomNav from "@/components/layout/bottom-nav";
import FAB from "@/components/layout/fab";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import Link from "next/link";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  initials: string;
  lastActive: string;
  totalEntries: number;
  todaysCollection: number;
}

export default function StaffManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shopId = user?.shopId;

  // Component state
  const [shopName, setShopName] = useState("Shop Name");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Statistics state
  const [activeStaffCount, setActiveStaffCount] = useState(0);
  const [todayEntriesCount, setTodayEntriesCount] = useState(0);
  const [pendingCollection, setPendingCollection] = useState(0);

  const roleColors: Record<string, { bg: string; text: string; border?: string }> = {
    owner: { bg: "bg-primary", text: "text-on-primary" },
    staff: { bg: "bg-on-surface-variant", text: "text-white" },
    admin: { bg: "bg-secondary-container", text: "text-on-secondary-container", border: "border border-secondary" },
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  // Fetch shop metadata, staff list, customers outstanding, and transaction metrics
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

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch shop name
        const shopSnap = await getDoc(doc(db, "shops", shopId));
        let fetchedShopName = "Shop Name";
        let ownerName = "Shop Owner";
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          fetchedShopName = shopData.name || "Shop Name";
          ownerName = shopData.ownerName || "Shop Owner";
          setShopName(fetchedShopName);
        }

        // 2. Fetch customers to calculate Pending Collection
        const custSnap = await getDocs(collection(db, "shops", shopId, "customers"));
        const totalPending = custSnap.docs.reduce(
          (sum, d) => sum + (d.data().balance || 0),
          0
        );
        setPendingCollection(totalPending);

        // 3. Fetch transactions to calculate real entries & daily collections per staff
        const txnsSnap = await getDocs(collection(db, "shops", shopId, "transactions"));
        const txnsList = txnsSnap.docs.map((d) => d.data());
        const todayStr = new Date().toISOString().split("T")[0];

        const staffMetrics: Record<string, { totalEntries: number; todaysCollection: number }> = {};
        let todayEntriesTotal = 0;

        txnsList.forEach((txn) => {
          const recBy = txn.recordedBy || "";
          if (txn.date === todayStr) {
            todayEntriesTotal += 1;
          }
          if (recBy) {
            if (!staffMetrics[recBy]) {
              staffMetrics[recBy] = { totalEntries: 0, todaysCollection: 0 };
            }
            staffMetrics[recBy].totalEntries += 1;
            if (txn.type === "payment" && txn.date === todayStr) {
              staffMetrics[recBy].todaysCollection += (txn.amount || 0);
            }
          }
        });

        setTodayEntriesCount(todayEntriesTotal);

        // 4. Fetch staff from Firestore collection
        const staffSnap = await getDocs(collection(db, "shops", shopId, "staff"));
        const fetchedStaff = staffSnap.docs.map((d) => {
          const data = d.data();
          const metrics = staffMetrics[d.id] || { totalEntries: 0, todaysCollection: 0 };
          return {
            id: d.id,
            name: data.name || "Staff Member",
            phone: data.phone || "",
            role: data.role || "staff",
            isActive: data.isActive !== false,
            initials: getInitials(data.name || "Staff Member"),
            lastActive: "Active recently",
            totalEntries: metrics.totalEntries,
            todaysCollection: metrics.todaysCollection,
          };
        });

        // 5. Prepend the virtual owner item representing the logged-in owner
        const ownerMetrics = staffMetrics[user.uid] || { totalEntries: 0, todaysCollection: 0 };
        const ownerItem: StaffMember = {
          id: user.uid,
          name: ownerName,
          phone: user.phone,
          role: "owner",
          isActive: true,
          initials: getInitials(ownerName),
          lastActive: "Active now",
          totalEntries: ownerMetrics.totalEntries,
          todaysCollection: ownerMetrics.todaysCollection,
        };

        const finalStaffList = [ownerItem, ...fetchedStaff];
        setStaffList(finalStaffList);

        // Calculate active staff count
        const activeCount = finalStaffList.filter((s) => s.isActive).length;
        setActiveStaffCount(activeCount);
      } catch (err) {
        console.error("Error loading staff data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shopId, authLoading, user, router]);

  // Handle addition of a new staff member (placeholder UID mapping)
  const handleAddStaff = async () => {
    if (!newStaffName.trim() || newStaffPhone.length !== 10) {
      setModalError("Please enter a valid name and 10-digit mobile number.");
      return;
    }

    if (!shopId || !user) {
      setModalError("Session expired. Please log in again.");
      return;
    }

    setModalError("");
    setModalLoading(true);

    try {
      // 1. Generate placeholder doc ID
      const newStaffUid = doc(collection(db, "shops", shopId, "staff")).id;

      // 2. Create staff record under /shops/{shopId}/staff/{newStaffUid}
      const staffDocRef = doc(db, "shops", shopId, "staff", newStaffUid);
      await setDoc(staffDocRef, {
        name: newStaffName.trim(),
        phone: newStaffPhone.trim(),
        role: "staff",
        isActive: true,
        addedAt: serverTimestamp(),
        addedBy: user.uid,
      });

      // 3. Create user record under /users/{newStaffUid}
      const userDocRef = doc(db, "users", newStaffUid);
      await setDoc(userDocRef, {
        shopId: shopId,
        role: "staff",
        name: newStaffName.trim(),
        phone: newStaffPhone.trim(),
      });

      // 4. Update local state list
      const newStaffItem: StaffMember = {
        id: newStaffUid,
        name: newStaffName.trim(),
        phone: newStaffPhone.trim(),
        role: "staff",
        isActive: true,
        initials: getInitials(newStaffName),
        lastActive: "Active recently",
        totalEntries: 0,
        todaysCollection: 0,
      };

      setStaffList((prev) => [...prev, newStaffItem]);
      setActiveStaffCount((prev) => prev + 1);

      // Reset modal state
      setNewStaffName("");
      setNewStaffPhone("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("Error creating staff record:", err);
      setModalError(err.message || "Failed to add staff member. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle staff isActive field in Firestore
  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    if (!shopId) return;
    const newStatus = !currentStatus;

    try {
      const staffRef = doc(db, "shops", shopId, "staff", staffId);
      await updateDoc(staffRef, {
        isActive: newStatus,
      });

      // Update local state
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, isActive: newStatus } : s))
      );
      setActiveStaffCount((prev) => (newStatus ? prev + 1 : prev - 1));
    } catch (err) {
      console.error("Error toggling staff activity status:", err);
    }
  };

  // Remove staff: delete doc from /shops/{shopId}/staff/{staffId}
  const handleRemoveStaff = async (staffId: string) => {
    if (!shopId) return;
    if (!window.confirm("Are you sure you want to remove this staff member? This will disable their access.")) return;

    try {
      const staffRef = doc(db, "shops", shopId, "staff", staffId);
      await deleteDoc(staffRef);

      // Note: We leave the /users/{staffId} mapping intact or delete it, but the main collection item is removed
      // Let's also delete from /users/{staffId} to keep Firestore clean
      const userRef = doc(db, "users", staffId);
      await deleteDoc(userRef).catch(() => {});

      // Update local state
      const removedStaff = staffList.find((s) => s.id === staffId);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      if (removedStaff && removedStaff.isActive) {
        setActiveStaffCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error removing staff member:", err);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      {/* Top App Bar */}
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-[16px] h-14 bg-surface border-b border-outline-variant/10">
        <div className="flex items-center gap-[8px]">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary truncate max-w-[180px]">
            {loading ? "Loading..." : shopName}
          </h1>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
      </header>

      {loading ? (
        // Loading Skeleton
        <main className="pt-16 px-[16px] max-w-2xl mx-auto space-y-[24px]">
          <section className="flex flex-col gap-[4px] mt-[8px]">
            <div className="h-9 bg-surface-container-low animate-pulse rounded w-2/3" />
            <div className="h-5 bg-surface-container-low animate-pulse rounded w-1/2 mt-1" />
          </section>

          <section className="grid grid-cols-2 gap-[16px]">
            <div className="h-32 bg-surface-container-low animate-pulse rounded-xl" />
            <div className="h-32 bg-surface-container-low animate-pulse rounded-xl" />
            <div className="h-32 bg-surface-container-low animate-pulse rounded-xl col-span-2" />
          </section>

          <section className="space-y-[16px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface-container-low animate-pulse rounded-xl" />
            ))}
          </section>
        </main>
      ) : (
        // Main Content
        <main className="pt-16 px-[16px] max-w-2xl mx-auto space-y-[24px]">
          {/* Header Section */}
          <section className="flex flex-col gap-[4px] mt-[8px]">
            <h2 className="font-[var(--font-heading)] text-[28px] leading-[36px] font-semibold text-on-surface">
              Staff Management
            </h2>
            <p className="font-[var(--font-body)] text-[14px] leading-[20px] text-on-surface-variant">
              Manage your team and track daily performance
            </p>
          </section>

          {/* Stats Overview Bento Grid */}
          <section className="grid grid-cols-2 gap-[16px]">
            <div className="bg-primary-container p-[16px] rounded-xl flex flex-col justify-between h-32 text-on-primary-container shadow-sm border border-primary/10">
              <span className="material-symbols-outlined text-2xl">group</span>
              <div>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium opacity-80 uppercase tracking-wider">
                  Active Staff
                </p>
                <h3 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold">
                  {activeStaffCount} {activeStaffCount === 1 ? "Member" : "Members"}
                </h3>
              </div>
            </div>
            <div className="bg-surface-container-high p-[16px] rounded-xl flex flex-col justify-between h-32 text-on-surface shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-2xl text-tertiary">insights</span>
              <div>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant uppercase tracking-wider">
                  Today&apos;s Entries
                </p>
                <h3 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold">
                  {todayEntriesCount}
                </h3>
              </div>
            </div>
            <div className="bg-surface-container-highest p-[16px] rounded-xl flex flex-col justify-between h-32 text-on-surface shadow-sm border border-outline-variant/30 col-span-2">
              <span className="material-symbols-outlined text-2xl text-primary">payments</span>
              <div>
                <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant uppercase tracking-wider">
                  Pending Collection
                </p>
                <h3 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold">
                  {formatCurrency(pendingCollection)}
                </h3>
              </div>
            </div>
          </section>

          {/* Navigation Links */}
          <section className="flex gap-[16px] overflow-x-auto pb-[4px] no-scrollbar">
            <Link
              href="/reports/activity-logs"
              className="flex-shrink-0 flex items-center gap-[12px] px-[24px] py-[12px] bg-surface border border-outline-variant rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined">history</span>
              Activity Logs
            </Link>
            <Link
              href="/reports/shift-summary"
              className="flex-shrink-0 flex items-center gap-[12px] px-[24px] py-[12px] bg-surface border border-outline-variant rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined">schedule</span>
              Shift Summaries
            </Link>
          </section>

          {/* Staff List */}
          <section className="space-y-[16px]">
            <div className="flex justify-between items-center">
              <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">
                STAFF DIRECTORY
              </h4>
              <span className="text-xs font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium bg-surface-container-highest px-2 py-1 rounded">
                Last updated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            </div>

            {staffList.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center text-on-surface-variant italic">
                No staff added yet
              </div>
            ) : (
              staffList.map((staff) => {
                const roleStyle = roleColors[staff.role] || roleColors.staff;
                return (
                  <div
                    key={staff.id}
                    className={`bg-white border border-outline-variant/40 rounded-xl p-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-[16px] ${
                      !staff.isActive ? "bg-surface-container-low opacity-70 grayscale" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-[16px]">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${
                            staff.role === "owner"
                              ? "bg-primary text-on-primary"
                              : staff.role === "admin"
                              ? "bg-secondary-container text-on-secondary-container"
                              : !staff.isActive
                              ? "bg-outline-variant text-white"
                              : "bg-surface-container-highest text-on-surface"
                          }`}
                        >
                          {staff.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-[8px] flex-wrap">
                            <h5 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                              {staff.name}
                            </h5>
                            <div className="flex items-center gap-[4px]">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  staff.isActive ? "bg-primary" : "bg-outline-variant"
                                }`}
                              />
                              <span className="text-[10px] font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                                {staff.lastActive}
                              </span>
                            </div>
                            <span
                              className={`${roleStyle.bg} ${roleStyle.text} ${
                                roleStyle.border || ""
                              } px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter`}
                            >
                              {staff.role}
                            </span>
                          </div>
                          <p className="font-[var(--font-body)] text-[14px] leading-[20px] text-on-surface-variant">
                            {formatPhoneNumber(staff.phone)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Toggle */}
                        <div
                          onClick={() => {
                            if (staff.role !== "owner") {
                              handleToggleActive(staff.id, staff.isActive);
                            }
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                            staff.isActive ? "bg-primary" : "bg-outline-variant"
                          } ${staff.role === "owner" ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div
                            className={`absolute top-[2px] w-4 h-4 rounded-full bg-white border border-gray-300 transition-transform ${
                              staff.isActive ? "left-[22px]" : "left-[2px]"
                            }`}
                          />
                        </div>
                        {/* Delete Button */}
                        {staff.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveStaff(staff.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-error transition-all active:scale-95 ml-2"
                            title="Remove staff member"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {staff.isActive ? (
                      <div className="grid grid-cols-2 gap-[8px] border-t border-outline-variant/20 pt-[16px]">
                        <div className="flex flex-col">
                          <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                            Total Entries
                          </span>
                          <span className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                            {staff.totalEntries}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
                            Today&apos;s Collection
                          </span>
                          <span className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary">
                            {formatCurrency(staff.todaysCollection)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center bg-white/50 rounded p-[12px]">
                        <p className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-error">
                          Access Disabled
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        </main>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-surface text-on-surface rounded-3xl p-[24px] w-full max-w-sm border border-outline-variant shadow-2xl flex flex-col gap-4 animate-[fade-in-up_0.3s_ease-out]">
            <h3 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
              Add New Staff
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12px] font-semibold mb-1 block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  disabled={modalLoading}
                  className="w-full border border-outline-variant rounded-xl px-3 h-11 bg-transparent focus:outline-none focus:border-primary text-[14px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={newStaffPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    if (val.length <= 10) setNewStaffPhone(val);
                  }}
                  disabled={modalLoading}
                  className="w-full border border-outline-variant rounded-xl px-3 h-11 bg-transparent focus:outline-none focus:border-primary text-[14px]"
                />
              </div>
            </div>

            {modalError && <p className="text-error text-xs font-semibold">{modalError}</p>}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewStaffName("");
                  setNewStaffPhone("");
                  setModalError("");
                }}
                disabled={modalLoading}
                className="px-4 py-2 text-primary font-semibold text-[14px] hover:bg-primary/5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={modalLoading || !newStaffName.trim() || newStaffPhone.length !== 10}
                className="px-4 py-2 bg-primary text-on-primary font-semibold text-[14px] rounded-lg shadow active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:bg-outline-variant"
              >
                {modalLoading ? "Saving..." : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      <FAB icon="person_add" onClick={() => setIsAddModalOpen(true)} />
      <BottomNav variant="owner" />
    </div>
  );
}
