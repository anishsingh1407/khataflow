import {
  ShopInfo,
  Customer,
  Transaction,
  Staff,
  ActivityLog,
  RecoveryCustomer,
  StaffPerformance,
  StatementEntry,
} from "./types";

export const shopInfo: ShopInfo = {
  id: "shop-001",
  name: "Ramesh General Store",
  ownerName: "Ramesh",
  address: "123, Market Street, Civil Lines\nNagpur, Maharashtra - 440001",
  phone: "+91 98765 43210",
  upiId: "shopname@upi",
};

export const customers: Customer[] = [
  {
    id: "cust-001",
    name: "Rajesh Malhotra",
    initials: "RM",
    phone: "+91 98765 43210",
    address: "Shop 12, Main Market, New Delhi 110001",
    balance: 12400,
    status: "overdue",
    lastUpdated: "10 Oct, 04:30 PM",
    memberSince: "Jan 2023",
    avatarColor: "bg-red-100 text-red-700",
  },
  {
    id: "cust-002",
    name: "Amit Kumar",
    initials: "AK",
    phone: "+91 98765 43211",
    balance: 5200,
    status: "pending",
    lastUpdated: "Today, 11:15 AM",
    avatarColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "cust-003",
    name: "Vikram Singh",
    initials: "VS",
    phone: "+91 98765 43212",
    balance: 0,
    status: "settled",
    lastUpdated: "Yesterday, 09:00 PM",
    avatarColor: "bg-green-100 text-green-700",
  },
  {
    id: "cust-004",
    name: "Suresh Nadar",
    initials: "SN",
    phone: "+91 98765 43213",
    balance: 22800,
    status: "overdue",
    lastUpdated: "02 Oct, 12:45 PM",
    avatarColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "cust-005",
    name: "Priya Jain",
    initials: "PJ",
    phone: "+91 98765 43214",
    balance: 7850,
    status: "pending",
    lastUpdated: "28 Sep, 02:15 PM",
    avatarColor: "bg-purple-100 text-purple-700",
  },
];

export const staffCustomers: Customer[] = [
  {
    id: "sc-001",
    name: "Rajesh Kumar",
    initials: "RK",
    phone: "+91 98765 43210",
    balance: 2450,
    status: "active",
    lastUpdated: "Updated 2 mins ago",
    avatarColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "sc-002",
    name: "Meena Sharma",
    initials: "MS",
    phone: "+91 98765 43211",
    balance: 0,
    status: "settled",
    lastUpdated: "Updated 1 hour ago",
    avatarColor: "bg-green-100 text-green-700",
  },
  {
    id: "sc-003",
    name: "Amit Patel",
    initials: "AP",
    phone: "+91 98765 43212",
    balance: 14200,
    status: "active",
    lastUpdated: "Updated 4 hours ago",
    avatarColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "sc-004",
    name: "Suresh Verma",
    initials: "SV",
    phone: "+91 98765 43213",
    balance: 850,
    status: "active",
    lastUpdated: "Updated Yesterday",
    avatarColor: "bg-purple-100 text-purple-700",
  },
];

export const ledgerTransactions: Transaction[] = [
  {
    id: "txn-001",
    customerId: "cust-001",
    type: "udhar",
    amount: 1200,
    description: "Grocery Items",
    details: "Milk, Bread, Eggs, Rice 5kg",
    date: "24 OCT 2023",
    time: "09:15 AM",
  },
  {
    id: "txn-002",
    customerId: "cust-001",
    type: "payment",
    amount: 500,
    description: "Cash Payment",
    details: "Partial payment received",
    date: "24 OCT 2023",
    time: "02:30 PM",
  },
  {
    id: "txn-003",
    customerId: "cust-001",
    type: "udhar",
    amount: 3550,
    description: "Old Balance Carry Forward",
    details: "Previous month closing balance",
    date: "22 OCT 2023",
    time: "11:00 AM",
  },
];

export const recentActivities: ActivityLog[] = [
  {
    id: "act-001",
    customerName: "Amit Sharma",
    type: "udhar",
    amount: 500,
    time: "2 hours ago • Credit",
    label: "UDHAR",
  },
  {
    id: "act-002",
    customerName: "Sunil Verma",
    type: "payment",
    amount: 200,
    time: "5 hours ago • Payment",
    label: "PAYMENT",
  },
  {
    id: "act-003",
    customerName: "Rajesh Gupta",
    type: "udhar",
    amount: 1200,
    time: "Yesterday • Credit",
    label: "UDHAR",
  },
];

export const staffMembers: Staff[] = [
  {
    id: "staff-001",
    name: "Rahul Sharma",
    initials: "RA",
    phone: "+91 98765 43210",
    role: "owner",
    isActive: true,
    totalEntries: 142,
    todaysCollection: 14500,
    lastActive: "Active 2m ago",
    avatarColor: "bg-red-100 text-red-700",
  },
  {
    id: "staff-002",
    name: "Suresh Kumar",
    initials: "SK",
    phone: "+91 98765 43211",
    role: "staff",
    isActive: true,
    totalEntries: 86,
    todaysCollection: 8200,
    lastActive: "Active 5m ago",
    avatarColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "staff-003",
    name: "Anjali Patil",
    initials: "AP",
    phone: "+91 98765 43212",
    role: "admin",
    isActive: true,
    totalEntries: 20,
    todaysCollection: 2100,
    lastActive: "Active now",
    avatarColor: "bg-green-100 text-green-700",
  },
  {
    id: "staff-004",
    name: "Vikas Mehra",
    initials: "VM",
    phone: "+91 98765 43213",
    role: "staff",
    isActive: false,
    totalEntries: 0,
    todaysCollection: 0,
    lastActive: "Active 3h ago",
    avatarColor: "bg-gray-100 text-gray-500",
  },
];

export const recoveryCustomers: RecoveryCustomer[] = [
  {
    id: "rec-001",
    name: "Rajesh Kumar",
    initials: "RK",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyCgRKBuqqT1JIONXr9QYZYVgDRk_Qe5hOI8H1WJYLYDbjlgql8LVlcuaonTbGqXsDD2bPMZ_x1oj3F-um-yjCcRuDbRNilMPcT3eSRJMgcxbORlRfJBUMy4mJlszTpDgSlH8Q2o2MuJJvvsUJEZ3aRCFUQQH0dHrTR50VPpVkPhJlxYMuk7Xlec9xnRgStRtWQSTVAKb-OWRIIWqXgZixLQQifa82aXiWQbEHs8668VaKpwRanOMVBXKGPtbhv0gIkTbw8ACtum8Y",
    status: "Overdue by 5 days",
    statusColor: "error",
    amount: 14200,
    billsPending: 4,
    lastPaid: "₹ 2,500 on 12 Oct",
  },
  {
    id: "rec-002",
    name: "Amit Sharma",
    initials: "AS",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDs0iL2h6WFoQO6YyU-utp0BJQON5PONE7Gb_KElMCzD2M1IgPa7jbXfRwIDYsktdHxXmaq_qTtdlxLhjctUB8SpOb7F9tpekn081dvB_TBD0f-w_peInVXBnsEYQyHYfHPzqHywpg26mLGTsPU4i3rqvhZo5f_G2CX_lgVaXg9s3Lk69y6MMV9k5Zu0ONfEEuliOTxzDTSAYaZdBxzD6_68RBSoZtVmGUk2HHZh-1yiLQ7wCEXXnhtT6lqE6NEzpM-CDw1ijRQrirO",
    status: "Due in 2 days",
    statusColor: "default",
    amount: 8750,
    billsPending: 1,
    notes: "Regular payer",
  },
  {
    id: "rec-003",
    name: "Priya Singh",
    initials: "PS",
    status: "Overdue by 12 days",
    statusColor: "error",
    amount: 22400,
    billsPending: 3,
    notes: "Follow up twice",
  },
  {
    id: "rec-004",
    name: "Sunita Devi",
    initials: "SD",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD98gKzQNjvrGkTirl8fPUnc9-snnjZJzuCecV7hZT9f_p-NUfFtZZAjsUxLJaW7tK-0w2WKLXBaqIa_QSlKMQJ5c7nXiR7_l9McfEznN6i6-R7_jtJT4dPNxkvOpof9lFnlC4jAlt69vYHGtC3NOgMoJgyT3aOizNUzNo89JesT-bTRdAF1c-m5OCXBg7YCRnM3NtNcAT6kl6rfV0N-kkxkmXGN2fKP4lZTdKTva_cSYktvlv8gXY-1RuPxZNG0BnOLfv9BhRtOfzL",
    status: "Due today",
    statusColor: "warning",
    amount: 5200,
    billsPending: 1,
    notes: "Promised via Call",
  },
];

export const staffPerformance: StaffPerformance[] = [
  {
    id: "perf-001",
    name: "Rajesh Kumar",
    initials: "RK",
    entries: 24,
    newCustomers: 8,
    amount: 42300,
    avatarColor: "bg-red-100 text-red-700",
  },
  {
    id: "perf-002",
    name: "Amit Singh",
    initials: "AS",
    entries: 19,
    newCustomers: 3,
    amount: 38900,
    avatarColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "perf-003",
    name: "Priya Verma",
    initials: "PV",
    entries: 15,
    newCustomers: 12,
    amount: 31400,
    avatarColor: "bg-green-100 text-green-700",
  },
];

export const statementEntries: StatementEntry[] = [
  { date: "01 Oct 23", particulars: "Opening Balance", debit: 0, credit: 1500 },
  {
    date: "05 Oct 23",
    particulars: "Grocery Supply - Invoice #122",
    debit: 0,
    credit: 2800,
  },
  {
    date: "12 Oct 23",
    particulars: "Partial UPI Payment",
    debit: 2000,
    credit: 0,
  },
  { date: "18 Oct 23", particulars: "Flour & Oils", debit: 0, credit: 2200 },
  { date: "22 Oct 23", particulars: "Cash Payment", debit: 1000, credit: 0 },
];

export const recentProducts = ["Milk", "Bread", "Cigarette", "Sugar", "Rice", "Oil"];

export const quickCustomers = [
  {
    id: "qc-001",
    name: "Rajesh",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyCgRKBuqqT1JIONXr9QYZYVgDRk_Qe5hOI8H1WJYLYDbjlgql8LVlcuaonTbGqXsDD2bPMZ_x1oj3F-um-yjCcRuDbRNilMPcT3eSRJMgcxbORlRfJBUMy4mJlszTpDgSlH8Q2o2MuJJvvsUJEZ3aRCFUQQH0dHrTR50VPpVkPhJlxYMuk7Xlec9xnRgStRtWQSTVAKb-OWRIIWqXgZixLQQifa82aXiWQbEHs8668VaKpwRanOMVBXKGPtbhv0gIkTbw8ACtum8Y",
  },
  {
    id: "qc-002",
    name: "Priya K.",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD98gKzQNjvrGkTirl8fPUnc9-snnjZJzuCecV7hZT9f_p-NUfFtZZAjsUxLJaW7tK-0w2WKLXBaqIa_QSlKMQJ5c7nXiR7_l9McfEznN6i6-R7_jtJT4dPNxkvOpof9lFnlC4jAlt69vYHGtC3NOgMoJgyT3aOizNUzNo89JesT-bTRdAF1c-m5OCXBg7YCRnM3NtNcAT6kl6rfV0N-kkxkmXGN2fKP4lZTdKTva_cSYktvlv8gXY-1RuPxZNG0BnOLfv9BhRtOfzL",
  },
  {
    id: "qc-003",
    name: "Ankit Sharma",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDs0iL2h6WFoQO6YyU-utp0BJQON5PONE7Gb_KElMCzD2M1IgPa7jbXfRwIDYsktdHxXmaq_qTtdlxLhjctUB8SpOb7F9tpekn081dvB_TBD0f-w_peInVXBnsEYQyHYfHPzqHywpg26mLGTsPU4i3rqvhZo5f_G2CX_lgVaXg9s3Lk69y6MMV9k5Zu0ONfEEuliOTxzDTSAYaZdBxzD6_68RBSoZtVmGUk2HHZh-1yiLQ7wCEXXnhtT6lqE6NEzpM-CDw1ijRQrirO",
  },
];

export const dashboardStats = {
  totalPending: 45200,
  totalCustomers: 124,
  todaysCollection: 1800,
  todaysUdhar: 2400,
  pendingGrowth: "+12% from last week",
  salesGrowth: "Sales up 8%",
};

export const overdueAlerts = [
  { id: "oa-001", name: "Kiran Kumar", initial: "K", amount: 8450, label: "Overdue 14 Days" },
  { id: "oa-002", name: "Mahesh S.", initial: "M", amount: 12200, label: "High Amount" },
];

export const recoveryStats = {
  recoveryPercent: 68,
  totalUdhar: 482900,
  totalPayment: 328400,
  pendingToday: 42000,
  highPriorityCount: 8,
  vsLastMonth: "+12% vs last month",
  pendingCollectionCount: 14,
};

export const shiftSummaryStats = {
  totalSales: 142500,
  salesGrowth: "+12.5% from yesterday",
  collected: 128000,
  pending: 14500,
  reportDate: "Oct 24, 2023",
};

export const collectionTrend = [
  { time: "08 AM", value: 30 },
  { time: "10 AM", value: 55 },
  { time: "12 PM", value: 45 },
  { time: "02 PM", value: 80 },
];

export const statementSummary = {
  prevBalance: 1200,
  totalUdhar: 4500,
  totalPaid: 3000,
  netBalance: 2700,
  date: "Oct 24, 2023",
  time: "11:45 AM",
  nextDueDate: "Nov 05, 2023",
};
