import Link from "next/link";

interface FABProps {
  href?: string;
  onClick?: () => void;
  icon?: string;
  label?: string;
  className?: string;
}

export default function FAB({
  href,
  onClick,
  icon = "add",
  label,
  className = "",
}: FABProps) {
  const content = (
    <>
      <span className="material-symbols-outlined text-[32px]">{icon}</span>
      {label && (
        <span className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">
          {label}
        </span>
      )}
    </>
  );

  const baseClass = `fixed bottom-24 right-[16px] w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform z-40 ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClass}>
      {content}
    </button>
  );
}
