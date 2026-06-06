import { formatCurrency } from "@/lib/utils";

interface ActivityItemProps {
  customerName: string;
  time: string;
  amount: number;
  type: "udhar" | "payment";
  label: string;
}

export default function ActivityItem({
  customerName,
  time,
  amount,
  type,
  label,
}: ActivityItemProps) {
  const isUdhar = type === "udhar";

  return (
    <div className="p-[16px] flex items-center justify-between hover:bg-surface-container transition-colors">
      <div className="flex items-center gap-[16px]">
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">person</span>
        </div>
        <div>
          <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
            {customerName}
          </p>
          <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.5px] font-medium">
            {time}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold ${
            isUdhar ? "text-error" : "text-secondary"
          }`}
        >
          {isUdhar ? "+" : "-"}
          {formatCurrency(amount)}
        </p>
        <p className="text-[10px] text-outline font-bold uppercase">{label}</p>
      </div>
    </div>
  );
}
