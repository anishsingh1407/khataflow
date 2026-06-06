export type UserRole = "owner" | "staff" | "admin";

export type TransactionType = "udhar" | "payment";

export type CustomerStatus = "overdue" | "pending" | "settled" | "active";

export interface ShopInfo {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  upiId?: string;
}

export interface Customer {
  id: string;
  name: string;
  initials: string;
  phone: string;
  address?: string;
  balance: number;
  status: CustomerStatus;
  lastUpdated: string;
  memberSince?: string;
  avatarUrl?: string;
  avatarColor?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  description: string;
  details?: string;
  date: string;
  time: string;
  recordedBy?: string;
}

export interface Staff {
  id: string;
  name: string;
  initials: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  totalEntries: number;
  todaysCollection: number;
  lastActive?: string;
  avatarColor?: string;
}

export interface UdharItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface ActivityLog {
  id: string;
  customerName: string;
  type: TransactionType;
  amount: number;
  time: string;
  label: string;
}

export interface RecoveryCustomer {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  status: string;
  statusColor: "error" | "warning" | "default";
  amount: number;
  billsPending: number;
  lastPaid?: string;
  notes?: string;
}

export interface StaffPerformance {
  id: string;
  name: string;
  initials: string;
  entries: number;
  newCustomers: number;
  amount: number;
  avatarColor?: string;
}

export interface StatementEntry {
  date: string;
  particulars: string;
  debit: number;
  credit: number;
}

export interface BottomNavItem {
  label: string;
  icon: string;
  href: string;
  activeIcon?: string;
}
