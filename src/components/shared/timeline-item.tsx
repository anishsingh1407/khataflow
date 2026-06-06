import { formatCurrency } from "@/lib/utils";

interface TimelineItemProps {
  type: "udhar" | "payment";
  title: string;
  details?: string;
  amount: number;
  time: string;
  isLast?: boolean;
}

export default function TimelineItem({
  type,
  title,
  details,
  amount,
  time,
  isLast = false,
}: TimelineItemProps) {
  const isUdhar = type === "udhar";

  return (
    <div
      className={`relative pl-8 ${
        !isLast
          ? "before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-[-20px] before:w-[2px] before:bg-outline-variant"
          : ""
      }`}
    >
      {/* Dot indicator */}
      <div
        className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
          isUdhar
            ? "bg-error"
            : "bg-primary"
        }`}
      >
        <span className="material-symbols-outlined text-white text-[16px]">
          {isUdhar ? "remove" : "add"}
        </span>
      </div>

      {/* Card */}
      <div className="bg-surface-container-lowest p-[16px] rounded-lg border border-outline-variant">
        <div className="flex justify-between items-start">
          <h4 className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface">
            {title}
          </h4>
          <span
            className={`font-[var(--font-heading)] text-[20px] leading-[28px] font-bold ${
              isUdhar ? "text-error" : "text-primary"
            }`}
          >
            {isUdhar ? "+" : "-"} {formatCurrency(amount)}
          </span>
        </div>
        {details && (
          <p className="font-[var(--font-body)] text-[14px] leading-[20px] text-on-surface-variant mb-2">
            {details}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[14px]">
            schedule
          </span>
          <span className="font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium text-on-surface-variant">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
