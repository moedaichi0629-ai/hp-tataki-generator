-- hp-tataki-generator 第1段階: 店舗情報収集・管理システムの初期スキーマ
-- Supabaseダッシュボード > SQL Editor で実行してください。

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type official_website_status as enum (
  'unconfirmed',      -- 未確認
  'none',              -- 公式サイトなし
  'exists',            -- 公式サイトあり
  'booking_site_only', -- 予約サイトのみ
  'sns_only',          -- SNSのみ
  'needs_check'        -- 確認が必要
);

create type store_status as enum (
  'candidate',            -- 候補
  'info_checking',        -- 情報確認中
  'requirements_input',   -- 制作条件入力中（第3段階用）
  'prompt_not_created',   -- プロンプト未作成（第3段階用）
  'prompt_created',       -- プロンプト作成済み（第3段階用）
  'hp_in_progress',       -- HP作成中
  'sample_done',          -- サンプル完成
  'sales_planned',        -- 営業予定
  'sales_done',           -- 営業済み
  'replied',              -- 返信あり
  'negotiating',          -- 商談中
  'closed_won',           -- 成約
  'skipped',              -- 見送り
  'not_target'            -- 対象外
);

create type field_verification_status as enum (
  'unconfirmed',    -- 未確認
  'confirmed',      -- 確認済み
  'needs_fix',      -- 要修正
  'do_not_publish'  -- 掲載しない
);

create type note_type as enum (
  'research',       -- 店舗調査
  'hp_production',  -- HP制作
  'sales',          -- 営業
  'check_item',     -- 確認事項
  'other'           -- その他
);

-- ---------------------------------------------------------------------------
-- stores: 店舗の識別情報・基本情報・外部リンク・Googleマップ情報・管理情報
-- ---------------------------------------------------------------------------

create table stores (
  id uuid primary key default gen_random_uuid(),
  place_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 基本情報
  name text not null,
  industry text,
  category text,
  description text,
  address text,
  lat numeric,
  lng numeric,
  phone_number text,
  business_hours jsonb, -- 曜日別の営業時間テキスト配列など
  closed_days text,
  price_range text,
  nearest_station text,
  parking_info text,
  payment_methods text[],
  accessibility_info text,

  -- 外部リンク
  google_maps_url text,
  official_website_url text,
  booking_site_url text,
  instagram_url text,
  x_url text,
  facebook_url text,
  other_sns_urls text[],

  -- Googleマップ情報
  google_rating numeric,
  google_review_count integer,
  google_categories text[],
  google_last_fetched_at timestamptz,

  -- 管理情報
  store_status store_status not null default 'candidate',
  is_sales_target boolean not null default true,
  official_website_status official_website_status not null default 'unconfirmed',
  info_verification_status field_verification_status not null default 'unconfirmed',
  memo text,
  -- 基本情報の項目ごとの確認状態（項目名 -> field_verification_status文字列）
  verification_state jsonb not null default '{}'::jsonb,

  constraint stores_lat_range check (lat is null or (lat >= -90 and lat <= 90)),
  constraint stores_lng_range check (lng is null or (lng >= -180 and lng <= 180)),
  constraint stores_rating_range check (google_rating is null or (google_rating >= 0 and google_rating <= 5)),
  constraint stores_review_count_nonnegative check (google_review_count is null or google_review_count >= 0)
);

-- Place IDは登録済みなら重複不可（NULL＝Place ID未取得の店舗は複数許容）
create unique index stores_place_id_unique on stores (place_id) where place_id is not null;
create index stores_name_idx on stores (name);
create index stores_status_idx on stores (store_status);
create index stores_created_at_idx on stores (created_at desc);
create index stores_updated_at_idx on stores (updated_at desc);

-- ---------------------------------------------------------------------------
-- store_services: サービス・メニュー
-- ---------------------------------------------------------------------------

create table store_services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  description text,
  price text,
  price_note text,
  duration text,
  target_audience text,
  features text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  verification_status field_verification_status not null default 'unconfirmed',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_services_store_id_idx on store_services (store_id, display_order);

-- ---------------------------------------------------------------------------
-- store_reviews: Googleマップの口コミキャッシュ
-- ---------------------------------------------------------------------------

create table store_reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  author_name text,
  rating numeric,
  review_text text,
  posted_at timestamptz,
  source text not null default 'google',
  google_review_id text,
  fetched_at timestamptz not null default now(),

  constraint store_reviews_rating_range check (rating is null or (rating >= 0 and rating <= 5))
);

create unique index store_reviews_dedupe_idx on store_reviews (store_id, google_review_id) where google_review_id is not null;
create index store_reviews_store_id_idx on store_reviews (store_id);

-- ---------------------------------------------------------------------------
-- store_strengths: 口コミ・店舗情報から整理した強み（1店舗1行）
-- ---------------------------------------------------------------------------

create table store_strengths (
  store_id uuid primary key references stores(id) on delete cascade,
  good_points text,
  atmosphere text,
  service_quality text,
  access_notes text,
  target_customer text,
  differentiators text,
  potential_concerns text,
  hp_key_messages text,
  recommended_cta text,
  cautions text,
  improvement_candidates text,
  ai_generated boolean not null default false,
  ai_disclaimer_shown boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- store_notes: メモ・管理情報
-- ---------------------------------------------------------------------------

create table store_notes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  title text,
  body text not null,
  note_type note_type not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_notes_store_id_idx on store_notes (store_id, created_at desc);

-- ---------------------------------------------------------------------------
-- search_histories: 検索履歴（旧localStorage実装の代替）
-- ---------------------------------------------------------------------------

create table search_histories (
  id uuid primary key default gen_random_uuid(),
  search_type text not null, -- region_industry / map_url / name_address
  region text,
  industry text,
  params jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index search_histories_created_at_idx on search_histories (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at 自動更新トリガー
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stores_set_updated_at before update on stores
  for each row execute function set_updated_at();

create trigger store_services_set_updated_at before update on store_services
  for each row execute function set_updated_at();

create trigger store_strengths_set_updated_at before update on store_strengths
  for each row execute function set_updated_at();

create trigger store_notes_set_updated_at before update on store_notes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- このアプリはサーバー側のAPI Routeがservice_roleキーでのみアクセスする設計のため、
-- ポリシーは追加しない（service_roleはRLSを無視するため引き続き全操作可能）。
-- anon/authenticatedキーからのアクセスをデフォルトで拒否するために有効化のみ行う。
-- ---------------------------------------------------------------------------

alter table stores enable row level security;
alter table store_services enable row level security;
alter table store_reviews enable row level security;
alter table store_strengths enable row level security;
alter table store_notes enable row level security;
alter table search_histories enable row level security;

-- ---------------------------------------------------------------------------
-- 第2段階（画像管理）・第3段階（HP制作プロンプト）で追加予定のテーブル（今回は作成しない）
-- すべて store_id uuid references stores(id) on delete cascade で連携する想定:
--   store_images         : 店舗画像の保存・管理
--   website_requirements : HP制作条件（トーン、色、掲載必須事項など）
--   website_sections      : HPのセクション構成案
--   generated_prompts     : AIツール向けに生成したHP作成プロンプトの履歴
-- ---------------------------------------------------------------------------
