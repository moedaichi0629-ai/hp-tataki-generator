import { OFFICIAL_WEBSITE_STATUS_OPTIONS } from "@/lib/storeStatus";
import type { OfficialWebsiteStatus } from "@/types/store";

export default function OfficialWebsiteStatusSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: OfficialWebsiteStatus;
  onChange: (value: OfficialWebsiteStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      className={className}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as OfficialWebsiteStatus)}
      aria-label="公式サイト確認状態"
    >
      {OFFICIAL_WEBSITE_STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
