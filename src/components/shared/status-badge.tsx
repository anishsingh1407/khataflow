interface StatusBadgeProps {
  status: string;
  variant?: "overdue" | "pending" | "settled" | "active" | "owner" | "staff" | "admin" | "default";
  size?: "sm" | "md";
}

const variantStyles: Record<string, string> = {
  overdue: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  settled: "bg-green-100 text-green-700 border border-green-200",
  active: "bg-primary-container text-on-primary-container",
  owner: "bg-primary-container text-on-primary-container",
  staff: "bg-gray-200 text-gray-700",
  admin: "bg-blue-100 text-blue-700 border border-blue-200",
  default: "bg-surface-container-high text-on-surface-variant",
};

export default function StatusBadge({
  status,
  variant = "default",
  size = "sm",
}: StatusBadgeProps) {
  const sizeClass =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : "text-[12px] px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${variantStyles[variant]} ${sizeClass}`}
    >
      {status}
    </span>
  );
}
