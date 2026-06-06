import AvatarInitials from "./avatar-initials";
import StatusBadge from "./status-badge";
import { formatCurrency } from "@/lib/utils";
import type { Staff } from "@/lib/types";

interface StaffCardProps {
  staff: Staff;
  onToggle?: (id: string, active: boolean) => void;
}

const roleVariant: Record<string, "owner" | "staff" | "admin"> = {
  owner: "owner",
  staff: "staff",
  admin: "admin",
};

export default function StaffCard({ staff, onToggle }: StaffCardProps) {
  return (
    <div
      className={`bg-surface-container-lowest p-[16px] rounded-xl border border-outline-variant/30 ${
        !staff.isActive ? "opacity-60" : ""
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-[16px]">
        <div className="flex items-center gap-3">
          <AvatarInitials
            initials={staff.initials}
            size="md"
            colorClass={staff.avatarColor || "bg-surface-container-high text-on-surface-variant"}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
                {staff.name}
              </h4>
              {staff.lastActive && (
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${staff.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  {staff.lastActive}
                </span>
              )}
              <StatusBadge
                status={staff.role.toUpperCase()}
                variant={roleVariant[staff.role]}
                size="sm"
              />
            </div>
            <p className="text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
              {staff.phone}
            </p>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle?.(staff.id, !staff.isActive)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            staff.isActive ? "bg-primary" : "bg-outline-variant"
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              staff.isActive ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Stats */}
      {staff.isActive ? (
        <div className="grid grid-cols-2 gap-[16px]">
          <div>
            <p className="text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
              Total Entries
            </p>
            <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-on-surface">
              {staff.totalEntries}
            </p>
          </div>
          <div>
            <p className="text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
              Today&apos;s Collection
            </p>
            <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold text-primary">
              {formatCurrency(staff.todaysCollection)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant text-center">
          Access Disabled
        </p>
      )}
    </div>
  );
}
