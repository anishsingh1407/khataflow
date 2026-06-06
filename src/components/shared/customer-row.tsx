import Link from "next/link";
import AvatarInitials from "./avatar-initials";
import StatusBadge from "./status-badge";
import { formatCurrency } from "@/lib/utils";
import type { CustomerStatus } from "@/lib/types";

interface CustomerRowProps {
  id: string;
  name: string;
  initials: string;
  balance: number;
  status: CustomerStatus;
  lastUpdated: string;
  avatarColor?: string;
  href?: string;
}

const statusVariantMap: Record<CustomerStatus, "overdue" | "pending" | "settled" | "active"> = {
  overdue: "overdue",
  pending: "pending",
  settled: "settled",
  active: "active",
};

export default function CustomerRow({
  id,
  name,
  initials,
  balance,
  status,
  lastUpdated,
  avatarColor,
  href,
}: CustomerRowProps) {
  const content = (
    <div className="bg-surface-container-lowest p-[16px] rounded-xl border border-outline-variant/30 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.99]">
      <div className="flex items-center gap-[16px]">
        <AvatarInitials
          initials={initials}
          size="md"
          colorClass={avatarColor || "bg-surface-container-high text-on-surface-variant"}
        />
        <div>
          <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
            {name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge
              status={status.toUpperCase()}
              variant={statusVariantMap[status]}
            />
            <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
              {lastUpdated}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${
            balance > 0 ? "text-error" : "text-on-surface"
          }`}
        >
          {formatCurrency(balance)}
        </span>
        <span className="material-symbols-outlined text-outline-variant text-[18px]">
          chevron_right
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
