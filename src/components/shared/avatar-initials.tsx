interface AvatarInitialsProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  colorClass?: string;
  imageUrl?: string;
  borderClass?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-14 h-14 text-lg",
};

export default function AvatarInitials({
  initials,
  size = "md",
  colorClass = "bg-surface-container-high text-on-surface-variant",
  imageUrl,
  borderClass = "",
}: AvatarInitialsProps) {
  if (imageUrl) {
    return (
      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden flex-shrink-0 ${borderClass}`}
      >
        <img
          src={imageUrl}
          alt={initials}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colorClass} ${borderClass}`}
    >
      {initials}
    </div>
  );
}
