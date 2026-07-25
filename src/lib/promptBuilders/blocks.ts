import type { Store, StoreService, StoreStrengths } from "@/types/store";
import type { StoreImage } from "@/types/image";
import type { WebsiteRequirements, WebsiteSection } from "@/types/prompt";
import {
  WEBSITE_PURPOSE_LABELS,
  WEBSITE_TYPE_LABELS,
  PRIMARY_ACTION_LABELS,
  TECHNOLOGY_LABELS,
  DEPLOYMENT_METHOD_LABELS,
  SUPPORTED_DEVICE_LABELS,
  DELIVERY_FORMAT_LABELS,
  UPDATE_FRIENDLINESS_LABELS,
  SECTION_TYPE_LABELS,
} from "@/lib/promptOptions";
import {
  IMAGE_SOURCE_TYPE_LABELS,
  STORE_IMAGE_CATEGORY_LABELS,
  IMAGE_USAGE_TYPE_LABELS,
  IMAGE_PERMISSION_STATUS_LABELS,
  NON_PUBLIC_PERMISSION_STATUSES,
} from "@/lib/imageStatus";

const NOT_REGISTERED = "（未登録）";

function line(label: string, value: string | null | undefined): string | null {
  if (!value) return null;
  return `- ${label}: ${value}`;
}

export function buildPurposeBlock(requirements: WebsiteRequirements): string {
  const lines: string[] = ["## HPの目的・制作タイプ"];
  const purposeLabels = requirements.purposes.map((p) => WEBSITE_PURPOSE_LABELS[p]).join("、");
  lines.push(`- HPの目的: ${purposeLabels || NOT_REGISTERED}`);
  lines.push(`- 制作タイプ: ${requirements.websiteType ? WEBSITE_TYPE_LABELS[requirements.websiteType] : NOT_REGISTERED}`);
  const mainMessage = line("最も伝えたい内容", requirements.mainMessage);
  if (mainMessage) lines.push(mainMessage);
  const supplementary = line("補足指示", requirements.supplementaryInstructions);
  if (supplementary) lines.push(supplementary);
  return lines.join("\n");
}

export function buildTargetBlock(requirements: WebsiteRequirements): string {
  const lines: string[] = ["## 想定ターゲット"];
  lines.push(requirements.targetAudience || "想定ターゲットは未登録です。断定的なペルソナを作らず、店舗情報から自然に推測できる範囲に留めてください。");
  return lines.join("\n");
}

export function buildStoreInfoBlock(store: Store): string {
  const lines: string[] = ["## 店舗基本情報"];
  lines.push(`- 店舗名: ${store.name}`);
  const fields = [
    line("業種", store.industry),
    line("カテゴリ", store.category),
    line("店舗説明", store.description),
    line("住所", store.address),
    line("電話番号", store.phoneNumber),
    store.businessHours && store.businessHours.length > 0
      ? `- 営業時間:\n${store.businessHours.map((h) => `  - ${h}`).join("\n")}`
      : null,
    line("定休日", store.closedDays),
    line("価格帯", store.priceRange),
    line("最寄駅", store.nearestStation),
    line("駐車場情報", store.parkingInfo),
    store.paymentMethods && store.paymentMethods.length > 0 ? line("支払い方法", store.paymentMethods.join("、")) : null,
    line("バリアフリー情報", store.accessibilityInfo),
    line("公式サイトURL", store.officialWebsiteUrl),
    line("予約サイトURL", store.bookingSiteUrl),
    line("Instagram", store.instagramUrl),
    line("X", store.xUrl),
    line("Facebook", store.facebookUrl),
  ].filter((l): l is string => Boolean(l));
  lines.push(...fields);
  lines.push("");
  lines.push("上記に記載のない項目は情報が登録されていません。推測で内容を補わないでください。不明な場合は「要確認」としてください。");
  return lines.join("\n");
}

export function buildStrengthsBlock(strengths: StoreStrengths | null): string {
  const lines: string[] = ["## 店舗の強み"];
  const items = strengths
    ? [
        line("よく評価されている点", strengths.goodPoints),
        line("店舗の雰囲気", strengths.atmosphere),
        line("接客面の特徴", strengths.serviceQuality),
        line("差別化ポイント", strengths.differentiators),
        line("アクセス面の特徴", strengths.accessNotes),
        line("HPで伝えるべき内容", strengths.hpKeyMessages),
        line("おすすめの予約・問い合わせ導線", strengths.recommendedCta),
        line("注意点", strengths.cautions),
      ].filter((l): l is string => Boolean(l))
    : [];

  if (items.length === 0) {
    lines.push("店舗の強み情報は登録されていません。存在しない実績・特徴を推測で作成しないでください。");
  } else {
    lines.push(...items);
  }
  return lines.join("\n");
}

export function buildServicesBlock(services: StoreService[]): string {
  const lines: string[] = ["## サービス・メニュー"];
  const published = services.filter((s) => s.isPublished);

  if (published.length === 0) {
    lines.push("サービス・メニュー情報は登録されていません。存在しないサービスや料金を作成しないでください。");
    return lines.join("\n");
  }

  published.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.name}`);
    if (s.description) lines.push(`   - 説明: ${s.description}`);
    lines.push(`   - 料金: ${s.price ? `${s.price}${s.priceNote ? `（${s.priceNote}）` : ""}` : "要確認（推測しないこと）"}`);
    if (s.duration) lines.push(`   - 所要時間: ${s.duration}`);
    if (s.targetAudience) lines.push(`   - おすすめ対象: ${s.targetAudience}`);
    if (s.features) lines.push(`   - 特徴: ${s.features}`);
  });
  return lines.join("\n");
}

export function buildActionBlock(requirements: WebsiteRequirements): string {
  const lines: string[] = ["## ユーザーに取ってほしい行動・問い合わせ方法"];
  lines.push(
    `- 取ってほしい行動: ${requirements.primaryAction ? PRIMARY_ACTION_LABELS[requirements.primaryAction] : NOT_REGISTERED}`
  );
  lines.push(`- 問い合わせ方法: ${requirements.contactMethod || NOT_REGISTERED}`);
  lines.push(`- 予約方法: ${requirements.reservationMethod || NOT_REGISTERED}`);
  return lines.join("\n");
}

function describeImageReference(image: StoreImage): string {
  if (image.sourceType === "user_upload" && image.storageUrl) return `画像URL: ${image.storageUrl}`;
  if (image.sourceType === "external_url" && image.externalUrl) return `画像URL: ${image.externalUrl}`;
  if (image.sourceType === "google_maps") {
    return "参照方法: システム内の参照情報のみ（直接使用可能な公開URLではありません。実際に掲載する場合は担当者が画像を別途用意します）";
  }
  if (image.sourceType === "sns_reference" && image.snsPostUrl) {
    return `参照方法: SNS投稿URL ${image.snsPostUrl}（画像そのものではなく参考情報です）`;
  }
  return "参照方法: 情報なし";
}

// 見出し（##）はテンプレート側（prompt_templates.template_body）が
// {{SECTIONS_BLOCK}}の直前に用意しているため、ここでは見出しを付けない
export function buildSectionsBlock(sections: WebsiteSection[], imagesById: Map<string, StoreImage>): string {
  const enabled = [...sections].filter((s) => s.enabled).sort((a, b) => a.displayOrder - b.displayOrder);
  const lines: string[] = [];

  if (enabled.length === 0) {
    lines.push("セクションが選択されていません。");
    return lines.join("\n");
  }

  enabled.forEach((section, i) => {
    const label = SECTION_TYPE_LABELS[section.sectionType] ?? section.sectionType;
    lines.push(`${i + 1}. ${label}${section.heading ? `（見出し案: ${section.heading}）` : ""}`);
    lines.push(
      `   - 掲載内容: ${section.content || "店舗情報・強み・サービスから、事実の範囲内で自然な内容にしてください（存在しない情報を作らないこと）"}`
    );
    if (section.cta) lines.push(`   - CTA: ${section.cta}`);
    const images = section.imageIds.map((id) => imagesById.get(id)).filter((img): img is StoreImage => Boolean(img));
    if (images.length > 0) {
      lines.push(`   - 使用画像: ${images.map((img) => `${img.name || "（無題）"}（ID: ${img.id}）`).join("、")}`);
    } else {
      lines.push("   - 使用画像: 指定なし（このセクションに無関係な画像を勝手に使用しないでください）");
    }
    if (section.instructions) lines.push(`   - 補足指示: ${section.instructions}`);
  });

  return lines.join("\n");
}

export interface ImageSelectionResult {
  allowed: StoreImage[];
  excluded: { image: StoreImage; reason: string }[];
}

const NON_PUBLIC_REASON_LABELS: Record<string, string> = {
  not_allowed: "使用不可",
  unconfirmed: "利用未確認",
  sales_proposal_only: "営業提案用のみ（正式公開用には未使用）",
};

export function selectImagesForPrompt(images: StoreImage[], isSalesSample: boolean): ImageSelectionResult {
  const allowed: StoreImage[] = [];
  const excluded: { image: StoreImage; reason: string }[] = [];

  for (const image of images) {
    if (!image.isSelected) {
      excluded.push({ image, reason: "使用しない設定" });
      continue;
    }
    // 営業提案用サンプルの場合のみ「営業提案用のみ」画像を例外的に許可する
    const isRestricted =
      NON_PUBLIC_PERMISSION_STATUSES.includes(image.permissionStatus) &&
      !(image.permissionStatus === "sales_proposal_only" && isSalesSample);
    if (isRestricted) {
      excluded.push({ image, reason: NON_PUBLIC_REASON_LABELS[image.permissionStatus] ?? "利用条件を満たさない" });
      continue;
    }
    allowed.push(image);
  }

  return { allowed, excluded };
}

export function buildImagesBlock(images: StoreImage[], isSalesSample: boolean): string {
  const { allowed, excluded } = selectImagesForPrompt(images, isSalesSample);
  const lines: string[] = ["## 使用できる画像"];

  if (allowed.length === 0) {
    lines.push("使用できる画像がありません。画像を使用する指示は行わず、画像なしで構成してください。");
  } else {
    allowed
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((img, i) => {
        lines.push(`${i + 1}. ${img.name || "（無題）"}（画像ID: ${img.id}）`);
        lines.push(`   - 画像種別: ${STORE_IMAGE_CATEGORY_LABELS[img.imageType]}`);
        lines.push(`   - 取得元: ${IMAGE_SOURCE_TYPE_LABELS[img.sourceType]}`);
        lines.push(`   - ${describeImageReference(img)}`);
        lines.push(
          `   - 使用用途: ${img.usageTypes.length > 0 ? img.usageTypes.map((u) => IMAGE_USAGE_TYPE_LABELS[u]).join("、") : "指定なし"}`
        );
        lines.push(`   - 利用確認状態: ${IMAGE_PERMISSION_STATUS_LABELS[img.permissionStatus]}`);
        if (img.memo) lines.push(`   - メモ: ${img.memo}`);
      });

    if (allowed.some((img) => img.sourceType === "google_maps")) {
      lines.push("");
      lines.push(
        "注意: この画像は営業提案用の参考画像です。正式公開前に、店舗から提供された画像または使用許可を得た画像へ差し替えてください。Googleマップ由来の写真を店舗提供画像として扱わないでください。"
      );
    }
  }

  if (excluded.length > 0) {
    lines.push("");
    lines.push("## 使用しない画像（このリストの画像は絶対に使用しないでください）");
    excluded.forEach(({ image, reason }) => {
      lines.push(`- ${image.name || "（無題）"}（画像ID: ${image.id}） - 理由: ${reason}`);
    });
  }

  lines.push("");
  lines.push("上記のリストにない画像や、外部から取得した無関係な画像を勝手に使用しないでください。");

  return lines.join("\n");
}

export function buildTechBlock(requirements: WebsiteRequirements): string {
  const lines: string[] = ["## 使用技術・公開条件"];
  const technology = requirements.technology
    ? `${TECHNOLOGY_LABELS[requirements.technology]}${requirements.technology === "other" && requirements.technologyOther ? `（${requirements.technologyOther}）` : ""}`
    : NOT_REGISTERED;
  lines.push(`- 使用技術: ${technology}`);

  const deployment = requirements.deploymentMethod
    ? `${DEPLOYMENT_METHOD_LABELS[requirements.deploymentMethod]}${requirements.deploymentMethod === "other" && requirements.deploymentMethodOther ? `（${requirements.deploymentMethodOther}）` : ""}`
    : NOT_REGISTERED;
  lines.push(`- 公開方法: ${deployment}`);

  lines.push(
    `- 対応端末: ${requirements.supportedDevices.length > 0 ? requirements.supportedDevices.map((d) => SUPPORTED_DEVICE_LABELS[d]).join("、") : "スマートフォン優先（未指定）"}`
  );
  lines.push(`- SEO対応: ${requirements.seoEnabled ? "必要" : "不要"}`);
  lines.push(`- アクセシビリティ対応: ${requirements.accessibilityEnabled ? "必要" : "不要"}`);
  lines.push(`- Googleマップ埋め込み: ${requirements.mapEnabled ? "必要" : "不要"}`);
  lines.push(`- SNSリンク: ${requirements.snsEnabled ? "必要" : "不要"}`);
  lines.push(`- フォーム: ${requirements.formEnabled ? "必要" : "不要"}`);
  lines.push(`- アニメーション: ${requirements.animationEnabled ? "使用してよい" : "使用しない"}`);
  if (requirements.updateFriendliness) {
    lines.push(`- 更新しやすさの希望: ${UPDATE_FRIENDLINESS_LABELS[requirements.updateFriendliness]}`);
  }
  if (requirements.externalIntegrations) lines.push(`- 外部サービス連携: ${requirements.externalIntegrations}`);
  const delivery = requirements.deliveryFormat
    ? `${DELIVERY_FORMAT_LABELS[requirements.deliveryFormat]}${requirements.deliveryFormat === "other" && requirements.deliveryFormatOther ? `（${requirements.deliveryFormatOther}）` : ""}`
    : NOT_REGISTERED;
  lines.push(`- 納品形式: ${delivery}`);
  if (requirements.excludedInformation) lines.push(`- 掲載しない情報: ${requirements.excludedInformation}`);
  if (requirements.notes) lines.push(`- 注意事項: ${requirements.notes}`);
  return lines.join("\n");
}

const PROHIBITION_ITEMS = [
  "登録されていない店舗情報を推測して追加しない",
  "存在しないサービスを作らない",
  "存在しない料金を作らない",
  "存在しないスタッフ名を作らない",
  "存在しない実績を作らない",
  "口コミをそのまま転載しない",
  "不明な情報は「要確認」とするか掲載しない",
  "店舗名を変更しない",
  "住所を変更しない",
  "電話番号を変更しない",
  "営業時間を変更しない",
  "選択されていない画像を使用しない",
  "使用不可の画像を使用しない",
  "外部の無関係な画像を勝手に使用しない",
  "画像を変更する場合は指定画像だけを使用する",
  "著作権や利用許可が未確認の画像を正式公開用として扱わない",
  "Googleマップ写真を店舗提供画像として扱わない",
  "架空の予約リンクを作らない",
  "架空のSNSリンクを作らない",
  "フォーム送信先を勝手に決めない",
];

export function buildProhibitionsBlock(): string {
  return PROHIBITION_ITEMS.map((item) => `- ${item}`).join("\n");
}

export function buildChecklistBlock(requirements: WebsiteRequirements): string {
  const lines: string[] = [
    "- スマートフォン表示で崩れがないか",
    "- 店舗名・住所・電話番号・営業時間が正しいか",
    "- 指定した画像だけが表示されているか",
    "- 予約・問い合わせへの導線が分かりやすいか",
    "- リンク切れがないか",
  ];
  if (requirements.formEnabled) lines.push("- フォームが正しく動作するか（送信先は未設定のため要確認）");
  if (requirements.mapEnabled) lines.push("- Googleマップが正しい住所で表示されているか");
  if (requirements.seoEnabled) lines.push("- タイトル・メタ情報が設定されているか");
  return ["## 完成後の確認項目", ...lines].join("\n");
}

const DEV_WORKFLOW_TEXT = `## 実装の進め方

- 機能単位で段階的に実装し、1つの機能を実装するたびにビルド確認を行ってください
- ファイル構成・コンポーネント構成・データ構造は、指定された技術・セクション構成に応じて適切に設計してください
- レスポンシブ対応・SEO・アクセシビリティ・フォーム・Googleマップ埋め込み・SNSリンクは、上記「使用技術・公開条件」の指定に従ってください
- エラーハンドリング（フォーム送信失敗時の表示など）を実装してください
- APIキーなど機密情報が必要な場合は環境変数で管理し、コードに直接書かないでください
- 実装後にテスト項目（表示崩れ・リンク切れ・フォーム動作・レスポンシブ）を確認してください
- ビルドが通ることを確認してください
- 変更内容についてREADMEを更新してください
- 実装完了後、変更したファイル・確認結果・残課題を報告してください`;

export function buildDevWorkflowBlock(): string {
  return DEV_WORKFLOW_TEXT;
}
