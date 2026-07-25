import type { Store, StoreService, StoreStrengths } from "@/types/store";
import type { StoreImage } from "@/types/image";
import type { PromptAiTool, WebsiteRequirements, WebsiteSection } from "@/types/prompt";

export interface PromptReadinessResult {
  errors: string[];
  warnings: string[];
  infos: string[];
  canGenerate: boolean;
}

export interface PromptReadinessInput {
  store: Store;
  requirements: WebsiteRequirements | null;
  sections: WebsiteSection[];
  images: StoreImage[];
  services: StoreService[];
  strengths: StoreStrengths | null;
  aiTool: PromptAiTool | null;
}

function hasAnyStrength(strengths: StoreStrengths | null): boolean {
  if (!strengths) return false;
  return Boolean(
    strengths.goodPoints ||
      strengths.atmosphere ||
      strengths.serviceQuality ||
      strengths.differentiators ||
      strengths.hpKeyMessages
  );
}

// 生成前チェック（第2段階のimageReadiness.tsと同様、都度計算する純粋関数）
export function checkPromptReadiness(input: PromptReadinessInput): PromptReadinessResult {
  const { store, requirements, sections, images, services, strengths, aiTool } = input;
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!store.name) errors.push("店舗名が未入力です。");
  if (!store.industry) errors.push("業種が未入力です。");
  if (!store.address) errors.push("住所が未入力です。");

  if (!requirements || requirements.purposes.length === 0) errors.push("HPの目的が選択されていません。");
  if (!requirements?.websiteType) errors.push("制作タイプが選択されていません。");
  if (!requirements?.targetAudience) errors.push("想定ターゲットが未入力です。");
  if (!requirements?.primaryAction) errors.push("ユーザーに取ってほしい行動が選択されていません。");
  if (!requirements?.contactMethod && !requirements?.reservationMethod) {
    errors.push("問い合わせ方法または予約方法のどちらかを入力してください。");
  }
  if (!sections.some((s) => s.enabled)) errors.push("必要セクションが1つも選択されていません。");
  if (!aiTool) errors.push("使用するAIツールが選択されていません。");

  if (!store.phoneNumber) warnings.push("電話番号が未確認です。");
  if (!store.businessHours || store.businessHours.length === 0) warnings.push("営業時間が未確認です。");
  if (services.length === 0) warnings.push("サービス・メニュー情報が登録されていません。");
  if (!hasAnyStrength(strengths)) warnings.push("店舗の強みが整理されていません。");

  const selectedImages = images.filter((i) => i.isSelected);
  if (selectedImages.length === 0) warnings.push("使用する画像が選択されていません。");
  if (!selectedImages.some((i) => i.imageType === "main_candidate")) {
    warnings.push("メイン画像候補が選択されていません。");
  }
  if (!store.officialWebsiteUrl) infos.push("公式サイトURLが未登録です。");
  if (!store.instagramUrl && !store.xUrl && !store.facebookUrl && (store.otherSnsUrls?.length ?? 0) === 0) {
    infos.push("SNSのURLが未登録です。");
  }
  if (!sections.some((s) => s.enabled && s.sectionType === "faq")) {
    infos.push("よくある質問セクションが選択されていません。");
  }

  return { errors, warnings, infos, canGenerate: errors.length === 0 };
}
