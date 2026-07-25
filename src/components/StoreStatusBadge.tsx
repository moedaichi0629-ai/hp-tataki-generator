import { STORE_STATUS_LABELS } from "@/lib/storeStatus";
import type { StoreStatus } from "@/types/store";
import styles from "./StoreStatusBadge.module.css";

const DONE_LIKE: StoreStatus[] = ["closed_won", "sample_done"];
const WARN_LIKE: StoreStatus[] = ["skipped", "not_target"];

export default function StoreStatusBadge({ status }: { status: StoreStatus }) {
  const variant = DONE_LIKE.includes(status) ? styles.done : WARN_LIKE.includes(status) ? styles.warn : styles.neutral;
  return <span className={`${styles.badge} ${variant}`}>{STORE_STATUS_LABELS[status]}</span>;
}
