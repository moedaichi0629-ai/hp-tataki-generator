-- hp-tataki-generator 第3段階: HP制作条件・HP作成用プロンプト生成のスキーマ
-- Supabaseダッシュボード > SQL Editor で実行してください（0001, 0002の後に実行）。

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type prompt_ai_tool as enum (
  'raddyai',
  'claude_code',
  'cursor',
  'lovable',
  'bolt',
  'replit',
  'chatgpt',
  'gemini',
  'other'
);

create type prompt_type as enum (
  'hp_initial_creation',   -- HP初回作成（今回完成させる種別）
  'hp_revision',           -- 既存HP修正（第4段階以降で実装予定）
  'store_info_update',     -- 店舗情報修正
  'image_replacement',     -- 画像差し替え
  'section_add',           -- セクション追加
  'section_remove',        -- セクション削除
  'layout_fix',            -- 表示崩れ修正
  'mobile_fix',            -- スマホ対応修正
  'seo_improvement',       -- SEO改善
  'deploy',                -- 公開・デプロイ
  'other'                  -- その他
);

create type prompt_generation_method as enum (
  'rule_based',            -- ルールベースのみ
  'rule_based_ai_polish'   -- ルールベース＋AIによる文章整形
);

-- ---------------------------------------------------------------------------
-- website_requirements: 店舗ごとのHP制作条件（1店舗1行）
-- ---------------------------------------------------------------------------

create table website_requirements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references stores(id) on delete cascade,

  -- 基本設定
  purposes text[] not null default '{}'::text[],   -- HPの目的（複数選択）
  website_type text,                                 -- 制作タイプ
  target_audience text,                              -- 想定ターゲット
  main_message text,                                 -- 最も伝えたい内容
  key_strengths_note text,                            -- 店舗の強み（自由記述の補足。store_strengthsを補完）
  primary_action text,                                -- ユーザーに取ってほしい行動
  contact_method text,                                -- 問い合わせ方法
  reservation_method text,                            -- 予約方法
  excluded_information text,                          -- 掲載しない情報
  notes text,                                         -- 注意事項
  supplementary_instructions text,                    -- 自由入力の補足指示

  -- 技術・公開条件
  technology text,                                    -- 使用技術
  technology_other text,
  deployment_method text,                             -- 公開方法
  deployment_method_other text,
  supported_devices text[] not null default '{}'::text[], -- 対応端末（複数選択）
  seo_enabled boolean not null default true,
  accessibility_enabled boolean not null default false,
  map_enabled boolean not null default true,
  sns_enabled boolean not null default false,
  form_enabled boolean not null default false,
  animation_enabled boolean not null default false,
  update_friendliness text,                           -- 更新しやすさの希望
  external_integrations text,                          -- 外部サービス連携（自由記述）
  delivery_format text,                                -- 納品形式
  delivery_format_other text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger website_requirements_set_updated_at before update on website_requirements
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- website_sections: HPに含めるセクションの構成
-- ---------------------------------------------------------------------------

create table website_sections (
  id uuid primary key default gen_random_uuid(),
  website_requirement_id uuid not null references website_requirements(id) on delete cascade,

  section_type text not null,
  enabled boolean not null default true,
  display_order integer not null default 0,
  heading text,
  content text,
  image_ids uuid[] not null default '{}'::uuid[],
  cta text,
  instructions text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint website_sections_unique_type unique (website_requirement_id, section_type)
);

create index website_sections_requirement_id_idx on website_sections (website_requirement_id, display_order);

create trigger website_sections_set_updated_at before update on website_sections
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- prompt_templates: AIツール・プロンプト種別ごとのテンプレート
-- ---------------------------------------------------------------------------

create table prompt_templates (
  id uuid primary key default gen_random_uuid(),
  ai_tool prompt_ai_tool not null,
  prompt_type prompt_type not null,
  version integer not null default 1,
  template_body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prompt_templates_lookup_idx on prompt_templates (ai_tool, prompt_type, is_active);

create trigger prompt_templates_set_updated_at before update on prompt_templates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- generated_prompts: 生成したプロンプトの保存・履歴
-- ---------------------------------------------------------------------------

create table generated_prompts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  website_requirement_id uuid references website_requirements(id) on delete set null,

  title text not null,
  prompt_type prompt_type not null,
  ai_tool prompt_ai_tool not null,
  custom_ai_tool text,
  content text not null,

  store_updated_at_snapshot timestamptz,
  images_updated_at_snapshot timestamptz,
  template_version integer,
  generation_method prompt_generation_method not null default 'rule_based',

  is_used boolean not null default false,
  memo text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generated_prompts_store_id_idx on generated_prompts (store_id, created_at desc);
create index generated_prompts_created_at_idx on generated_prompts (created_at desc);

create trigger generated_prompts_set_updated_at before update on generated_prompts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security（service_roleのみで運用。ポリシーは付与しない）
-- ---------------------------------------------------------------------------

alter table website_requirements enable row level security;
alter table website_sections enable row level security;
alter table prompt_templates enable row level security;
alter table generated_prompts enable row level security;

-- ---------------------------------------------------------------------------
-- prompt_templates 初期データ（hp_initial_creation × 9ツール、version=1）
-- プレースホルダーはアプリ側（src/lib/promptBuilders/renderTemplate.ts）で
-- 安全なMarkdown断片に置換される。生の店舗データを直接埋め込むことはない。
-- ---------------------------------------------------------------------------

insert into prompt_templates (ai_tool, prompt_type, version, template_body, is_active) values
('raddyai', 'hp_initial_creation', 1, $TPL$# HPたたき台作成のお願い（RaddyAI向け）

あなたはホームページ制作アシスタントです。以下の店舗情報をもとに、1ページ完結型のホームページを作成してください。専門的な実装の詳細よりも、店舗情報・構成・掲載内容・使用する画像の指定を最優先で守ってください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## ページ構成（この順番でセクションを作成してください）

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

このホームページは、スマートフォンで見やすいことを最優先にしてください。予約・問い合わせへの導線を、ページ内の分かりやすい場所に配置してください。1回の作成で全体像ができるだけ完成し、あとから部分的に修正しやすい構成にしてください。

{{CHECKLIST_BLOCK}}
$TPL$, true),

('claude_code', 'hp_initial_creation', 1, $TPL$# ホームページ実装依頼（Claude Code向け）

あなたはソフトウェアエンジニアです。以下の要件に従って、店舗のホームページを実装してください。**機能単位で段階的に実装し、一度に全体を壊さないでください。** 各機能を実装したらビルド確認を行ってから次に進んでください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## 必要セクション（表示順）

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

{{DEV_WORKFLOW_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

{{CHECKLIST_BLOCK}}
$TPL$, true),

('cursor', 'hp_initial_creation', 1, $TPL$# ホームページ実装依頼（Cursor向け）

あなたはソフトウェアエンジニアです。以下の要件に従って、店舗のホームページを実装してください。**機能単位で段階的に実装し、一度に全体を壊さないでください。** 各機能を実装したらビルド確認を行ってから次に進んでください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## 必要セクション（表示順）

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

{{DEV_WORKFLOW_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

{{CHECKLIST_BLOCK}}
$TPL$, true),

('lovable', 'hp_initial_creation', 1, $TPL$# ホームページ作成依頼（Lovable向け）

以下の店舗のホームページを作成してください。コードの細かい実装詳細よりも、画面構成・掲載内容・使用画像の指定を優先してください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## 画面構成（この順番でセクションを配置）

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

スマートフォン表示を最優先にし、予約・問い合わせへの導線を分かりやすく配置してください。

{{CHECKLIST_BLOCK}}
$TPL$, true),

('bolt', 'hp_initial_creation', 1, $TPL$# ホームページ作成依頼（Bolt向け）

以下の店舗のホームページを作成してください。コードの細かい実装詳細よりも、画面構成・掲載内容・使用画像の指定を優先してください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## 画面構成（この順番でセクションを配置）

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

スマートフォン表示を最優先にし、予約・問い合わせへの導線を分かりやすく配置してください。

{{CHECKLIST_BLOCK}}
$TPL$, true),

('replit', 'hp_initial_creation', 1, $TPL$# ホームページ作成依頼（Replit向け）

以下の店舗のホームページを作成してください。コードの細かい実装詳細よりも、画面構成・掲載内容・使用画像の指定を優先してください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## 画面構成（この順番でセクションを配置）

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

スマートフォン表示を最優先にし、予約・問い合わせへの導線を分かりやすく配置してください。

{{CHECKLIST_BLOCK}}
$TPL$, true),

('chatgpt', 'hp_initial_creation', 1, $TPL$# ホームページのたたき台作成依頼

以下の店舗情報をもとに、ホームページのたたき台（構成案と各セクションの文章）を作成してください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## ページ構成

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

{{CHECKLIST_BLOCK}}
$TPL$, true),

('gemini', 'hp_initial_creation', 1, $TPL$# ホームページのたたき台作成依頼

以下の店舗情報をもとに、ホームページのたたき台（構成案と各セクションの文章）を作成してください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## ページ構成

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

{{CHECKLIST_BLOCK}}
$TPL$, true),

('other', 'hp_initial_creation', 1, $TPL$# ホームページのたたき台作成依頼

以下の店舗情報をもとに、ホームページのたたき台（構成案と各セクションの文章）を作成してください。

{{PURPOSE_BLOCK}}

{{STORE_INFO_BLOCK}}

{{TARGET_BLOCK}}

{{STRENGTHS_BLOCK}}

{{SERVICES_BLOCK}}

{{ACTION_BLOCK}}

## ページ構成

{{SECTIONS_BLOCK}}

{{IMAGES_BLOCK}}

{{TECH_BLOCK}}

## 必ず守ってください

{{PROHIBITIONS_BLOCK}}

{{CHECKLIST_BLOCK}}
$TPL$, true);

-- ---------------------------------------------------------------------------
-- 第4段階以降で追加予定（今回は作成しない）:
--   その他のprompt_type（hp_revision, image_replacement 等）の生成ロジック
--   prompt_templatesの管理画面（現状はSQL Editorでの直接編集を想定）
-- ---------------------------------------------------------------------------
