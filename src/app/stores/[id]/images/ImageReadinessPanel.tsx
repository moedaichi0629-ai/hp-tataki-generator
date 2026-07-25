import common from "@/styles/common.module.css";
import styles from "./images.module.css";
import { computeImageReadiness } from "@/lib/imageReadiness";
import type { StoreImage } from "@/types/image";

export default function ImageReadinessPanel({ images }: { images: StoreImage[] }) {
  const summary = computeImageReadiness(images);

  return (
    <div className={common.card}>
      <h2 className={common.sectionTitle}>HP制作向け画像チェック</h2>
      <div className={common.statGrid} style={{ marginBottom: 0 }}>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.selectedCount}</span>
          <span className={common.statLabel}>使用画像</span>
        </div>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.mainCandidateCount}</span>
          <span className={common.statLabel}>メイン画像候補</span>
        </div>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.exteriorCount}</span>
          <span className={common.statLabel}>店舗外観</span>
        </div>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.interiorCount}</span>
          <span className={common.statLabel}>店舗内観</span>
        </div>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.confirmedPermissionCount}</span>
          <span className={common.statLabel}>利用確認済み</span>
        </div>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.unconfirmedPermissionCount}</span>
          <span className={common.statLabel}>利用未確認</span>
        </div>
        <div className={common.statCard}>
          <span className={common.statValue}>{summary.publicReadyCount}</span>
          <span className={common.statLabel}>正式公開可能</span>
        </div>
      </div>

      {summary.warnings.length > 0 && (
        <div className={styles.warningList}>
          {summary.warnings.map((w) => (
            <div key={w} className={styles.warningItem}>
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
