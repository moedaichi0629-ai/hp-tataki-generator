import Link from "next/link";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="パンくずリスト">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className={styles.item}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 && <span className={styles.separator}>/</span>}
        </span>
      ))}
    </nav>
  );
}
