"use client";

import styles from "./edit.module.css";
import { FIELD_VERIFICATION_STATUS_OPTIONS } from "@/lib/storeStatus";
import type { FieldVerificationStatus, VerifiableStoreField } from "@/types/store";

export default function VerifiableField({
  label,
  field,
  value,
  status,
  onValueChange,
  onStatusChange,
  multiline,
}: {
  label: string;
  field: VerifiableStoreField;
  value: string;
  status: FieldVerificationStatus;
  onValueChange: (value: string) => void;
  onStatusChange: (field: VerifiableStoreField, status: FieldVerificationStatus) => void;
  multiline?: boolean;
}) {
  return (
    <div className={styles.fieldWithStatus}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onValueChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onValueChange(e.target.value)} />
      )}
      <div className={styles.statusRow}>
        <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>確認状態:</span>
        <select value={status} onChange={(e) => onStatusChange(field, e.target.value as FieldVerificationStatus)}>
          {FIELD_VERIFICATION_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
