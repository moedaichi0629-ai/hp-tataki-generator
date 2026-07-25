import { STORE_STATUS_OPTIONS } from "@/lib/storeStatus";
import type { StoreStatus } from "@/types/store";

export default function StoreStatusSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: StoreStatus;
  onChange: (value: StoreStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      className={className}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StoreStatus)}
      aria-label="店舗ステータス"
    >
      {STORE_STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
