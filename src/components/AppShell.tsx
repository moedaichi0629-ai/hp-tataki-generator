"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/search", label: "店舗検索" },
  { href: "/stores", label: "店舗一覧" },
  { href: "/settings", label: "設定" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          店舗情報収集・HP制作管理ツール
        </Link>
        <nav className={styles.headerNav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? styles.navLinkActive : styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? styles.sideLinkActive : styles.sideLink}
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
