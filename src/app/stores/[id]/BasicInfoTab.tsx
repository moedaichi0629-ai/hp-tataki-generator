import Link from "next/link";
import common from "@/styles/common.module.css";
import styles from "./detail.module.css";
import type { Store } from "@/types/store";

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "未登録";
  return String(value);
}

function displayList(value: string[] | null | undefined): string {
  if (!value || value.length === 0) return "未登録";
  return value.join(" / ");
}

export default function BasicInfoTab({ store }: { store: Store }) {
  return (
    <div className={common.card}>
      <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
        <h2 className={common.sectionTitle}>基本情報</h2>
        <Link href={`/stores/${store.id}/edit`} className={common.buttonPrimary}>
          基本情報を編集する
        </Link>
      </div>

      <dl className={styles.infoGrid}>
        <dt>店舗名</dt>
        <dd>{store.name}</dd>
        <dt>業種</dt>
        <dd>{displayValue(store.industry)}</dd>
        <dt>カテゴリ</dt>
        <dd>{displayValue(store.category)}</dd>
        <dt>店舗説明</dt>
        <dd style={{ whiteSpace: "pre-line" }}>{displayValue(store.description)}</dd>
        <dt>住所</dt>
        <dd>{displayValue(store.address)}</dd>
        <dt>緯度・経度</dt>
        <dd>{store.lat != null && store.lng != null ? `${store.lat}, ${store.lng}` : "未登録"}</dd>
        <dt>電話番号</dt>
        <dd>{displayValue(store.phoneNumber)}</dd>
        <dt>営業時間</dt>
        <dd>{displayList(store.businessHours)}</dd>
        <dt>定休日</dt>
        <dd>{displayValue(store.closedDays)}</dd>
        <dt>価格帯</dt>
        <dd>{displayValue(store.priceRange)}</dd>
        <dt>最寄駅</dt>
        <dd>{displayValue(store.nearestStation)}</dd>
        <dt>駐車場情報</dt>
        <dd>{displayValue(store.parkingInfo)}</dd>
        <dt>支払い方法</dt>
        <dd>{displayList(store.paymentMethods)}</dd>
        <dt>バリアフリー情報</dt>
        <dd>{displayValue(store.accessibilityInfo)}</dd>
      </dl>

      <h3 className={common.sectionTitle}>外部リンク</h3>
      <dl className={styles.infoGrid}>
        <dt>Googleマップ</dt>
        <dd>{store.googleMapsUrl ? <a href={store.googleMapsUrl} target="_blank" rel="noopener noreferrer">開く</a> : "未登録"}</dd>
        <dt>公式サイト</dt>
        <dd>{store.officialWebsiteUrl ? <a href={store.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">開く</a> : "未登録"}</dd>
        <dt>予約サイト</dt>
        <dd>{store.bookingSiteUrl ? <a href={store.bookingSiteUrl} target="_blank" rel="noopener noreferrer">開く</a> : "未登録"}</dd>
        <dt>Instagram</dt>
        <dd>{store.instagramUrl ? <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer">開く</a> : "未登録"}</dd>
        <dt>X</dt>
        <dd>{store.xUrl ? <a href={store.xUrl} target="_blank" rel="noopener noreferrer">開く</a> : "未登録"}</dd>
        <dt>Facebook</dt>
        <dd>{store.facebookUrl ? <a href={store.facebookUrl} target="_blank" rel="noopener noreferrer">開く</a> : "未登録"}</dd>
        <dt>その他SNS</dt>
        <dd>{displayList(store.otherSnsUrls)}</dd>
      </dl>

      <h3 className={common.sectionTitle}>Googleマップ情報</h3>
      <dl className={styles.infoGrid}>
        <dt>評価</dt>
        <dd>{displayValue(store.googleRating)}</dd>
        <dt>口コミ数</dt>
        <dd>{displayValue(store.googleReviewCount)}</dd>
        <dt>Googleカテゴリ</dt>
        <dd>{displayList(store.googleCategories)}</dd>
        <dt>最終取得日時</dt>
        <dd>{store.googleLastFetchedAt ? new Date(store.googleLastFetchedAt).toLocaleString("ja-JP") : "未取得"}</dd>
        <dt>Place ID</dt>
        <dd>{displayValue(store.placeId)}</dd>
      </dl>
    </div>
  );
}
