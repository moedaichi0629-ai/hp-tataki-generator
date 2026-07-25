import OpenAI from "openai";
import type { Store, StoreReview } from "@/types/store";

export const STRENGTHS_AI_DISCLAIMER =
  "AIによる分析結果です。事実と異なる可能性があるため、内容を確認してから使用してください。";

const STRENGTHS_SYSTEM_PROMPT = `あなたは、店舗のGoogleマップ情報と口コミから、ホームページ制作のための「事実整理」を行うアシスタントです。

厳守事項:
- 与えられた店舗情報・口コミに書かれていない内容を作らないこと（推測での補完禁止）。
- 料金やサービス内容を推測して書かないこと。
- スタッフの氏名を作らないこと。
- 実績・受賞歴・取引実績などを作らないこと。
- 事実（口コミや店舗情報に明記されている内容）と、そこから読み取れる意見・印象を混同せず、意見は「〜という声がある」「〜と感じられる」のように書くこと。
- 口コミ本文をそのまま転載しないこと。要点を独自の文章でまとめること。
- 材料が不足している項目は無理に埋めず、空文字列にすること。
- 出力は必ず指定のJSON形式のみ。前後に説明文やMarkdownを付けないこと。`;

function buildStrengthsUserPrompt(store: Store, reviews: StoreReview[]): string {
  const reviewLines = reviews
    .slice(0, 20)
    .map((r, i) => `${i + 1}. 評価:${r.rating ?? "不明"} 「${(r.reviewText ?? "").slice(0, 300)}」`)
    .join("\n");

  return `以下の店舗情報と口コミをもとに、ホームページ制作のための強み・特徴を整理してください。

店舗名: ${store.name}
業種: ${store.industry ?? "不明"}
店舗説明: ${store.description ?? "なし"}
住所: ${store.address ?? "不明"}
最寄駅: ${store.nearestStation ?? "不明"}

口コミ（最大20件）:
${reviewLines || "口コミなし"}

次のJSON形式で出力してください（キー名は必ずそのまま使うこと。材料がない項目は空文字列）:
{
  "goodPoints": "よく評価されている点",
  "atmosphere": "店舗の雰囲気",
  "serviceQuality": "接客面の特徴",
  "differentiators": "商品・サービスの特徴、他店との差別化ポイント",
  "accessNotes": "アクセス面の特徴",
  "targetCustomer": "想定ターゲット",
  "potentialConcerns": "利用者が感じそうな不安",
  "hpKeyMessages": "HPで伝えるべき内容",
  "recommendedCta": "おすすめの予約・問い合わせ導線",
  "cautions": "注意点",
  "improvementCandidates": "改善候補"
}`;
}

export interface StrengthsAiDraft {
  goodPoints: string;
  atmosphere: string;
  serviceQuality: string;
  differentiators: string;
  accessNotes: string;
  targetCustomer: string;
  potentialConcerns: string;
  hpKeyMessages: string;
  recommendedCta: string;
  cautions: string;
  improvementCandidates: string;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEYが設定されていません。.env.localを確認してください。");
  }
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export async function generateStrengthsDraft(store: Store, reviews: StoreReview[]): Promise<StrengthsAiDraft> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: getModel(),
    messages: [
      { role: "system", content: STRENGTHS_SYSTEM_PROMPT },
      { role: "user", content: buildStrengthsUserPrompt(store, reviews) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAIからの応答が空でした。");
  }

  return JSON.parse(content) as StrengthsAiDraft;
}

const PROMPT_POLISH_SYSTEM_PROMPT = `あなたは、渡されたMarkdown文書の「文章の言い回し」だけを整えるアシスタントです。

厳守事項:
- 見出し（#, ##, ###）、箇条書き、番号付きリスト、テーブルなどのMarkdown構造は変更しないこと。
- 記載されている事実（店舗名・住所・電話番号・営業時間・料金・画像ID・URLなど）を一切追加・削除・変更しないこと。
- 新しい項目や新しい見出しを追加しないこと。
- 「要確認」「未登録」「不明」などの表記はそのまま残すこと（勝手に補完しない）。
- 変更してよいのは、日本語としての読みやすさ・言い回しの自然さのみ。
- 出力は整形後のMarkdown全文のみ。前後に説明文を付けないこと。`;

// ルールベースで生成済みのMarkdownプロンプトの「言い回し」だけを整える（事実の変更は禁止）
export async function polishPromptText(markdown: string): Promise<string> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: getModel(),
    messages: [
      { role: "system", content: PROMPT_POLISH_SYSTEM_PROMPT },
      { role: "user", content: markdown },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAIからの応答が空でした。");
  }

  return content.trim();
}
