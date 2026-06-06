interface SearchBarProps {
  placeholder?: string;
  icon?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({
  placeholder = "Search...",
  icon = "search",
  showFilter = false,
  onFilterClick,
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-[12px]">
      <div className="flex-1 flex items-center gap-[8px] border border-outline-variant bg-surface-container-lowest rounded-xl px-[16px] h-12 focus-within:border-primary transition-colors">
        <span className="material-symbols-outlined text-outline text-[20px]">
          {icon}
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-transparent border-none focus:outline-none w-full font-[var(--font-body)] text-[14px] leading-[20px] placeholder:text-outline-variant/60"
        />
      </div>
      {showFilter && (
        <button
          onClick={onFilterClick}
          className="w-12 h-12 flex items-center justify-center border border-outline-variant rounded-xl hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            filter_list
          </span>
        </button>
      )}
    </div>
  );
}
