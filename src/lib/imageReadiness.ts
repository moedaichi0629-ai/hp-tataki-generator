import { NON_PUBLIC_PERMISSION_STATUSES } from "@/lib/imageStatus";
import type { StoreImage } from "@/types/image";

export interface ImageReadinessSummary {
  totalCount: number;
  selectedCount: number;
  mainCandidateCount: number;
  exteriorCount: number;
  interiorCount: number;
  confirmedPermissionCount: number;
  unconfirmedPermissionCount: number;
  publicReadyCount: number;
  warnings: string[];
}

// store_imagesの配列から準備状況サマリーと警告を都度計算する純粋関数。
// 結果は永続化せず、第3段階のプロンプト生成前チェックでも同じ関数をstore_imagesに対して再実行する想定。
export function computeImageReadiness(images: StoreImage[]): ImageReadinessSummary {
  const selected = images.filter((i) => i.isSelected);
  const mainCandidates = selected.filter((i) => i.imageType === "main_candidate");
  const exteriors = selected.filter((i) => i.imageType === "exterior");
  const interiors = selected.filter((i) => i.imageType === "interior");
  const confirmedPermission = selected.filter((i) => !NON_PUBLIC_PERMISSION_STATUSES.includes(i.permissionStatus));
  const unconfirmedPermission = selected.filter((i) => i.permissionStatus === "unconfirmed");
  const publicReady = selected.filter((i) => i.permissionStatus === "public_ready");
  const googleMapsOnly =
    selected.length > 0 && selected.every((i) => i.sourceType === "google_maps");
  const notAllowedSelected = selected.some((i) => i.permissionStatus === "not_allowed");
  const brokenExternal = selected.some(
    (i) => i.sourceType === "external_url" && !i.externalUrl
  );

  const warnings: string[] = [];
  if (selected.length === 0) warnings.push("使用画像が0枚です。HP制作に使用する画像を選択してください。");
  if (mainCandidates.length === 0) warnings.push("メイン画像候補が選択されていません。");
  if (selected.length > 0 && unconfirmedPermission.length === selected.length) {
    warnings.push("すべての画像が利用未確認です。利用確認ステータスを設定してください。");
  }
  if (publicReady.length === 0) warnings.push("正式公開用に使える画像（利用確認ステータスが「正式公開使用可能」）がありません。");
  if (googleMapsOnly) warnings.push("Googleマップ写真だけが選択されています。権利関係を確認のうえ利用確認ステータスを設定してください。");
  if (notAllowedSelected) warnings.push("「使用不可」に設定された画像が選択されています。選択を解除してください。");
  if (brokenExternal) warnings.push("外部URLが設定されていない画像があります。");

  return {
    totalCount: images.length,
    selectedCount: selected.length,
    mainCandidateCount: mainCandidates.length,
    exteriorCount: exteriors.length,
    interiorCount: interiors.length,
    confirmedPermissionCount: confirmedPermission.length,
    unconfirmedPermissionCount: unconfirmedPermission.length,
    publicReadyCount: publicReady.length,
    warnings,
  };
}
