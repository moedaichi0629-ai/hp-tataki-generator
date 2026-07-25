-- hp-tataki-generator 第2段階: 画像管理機能のスキーマ
-- Supabaseダッシュボード > SQL Editor で実行してください（0001_init.sqlの後に実行）。

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type image_source_type as enum (
  'google_maps',      -- Googleマップ
  'store_provided',   -- 店舗提供
  'user_upload',       -- ユーザーアップロード
  'external_url',      -- 外部URL
  'sns_reference',      -- SNS投稿メモ
  'free_material',      -- フリー素材
  'ai_generated',        -- AI生成
  'other'                -- その他
);

create type store_image_category as enum (
  'main_candidate', -- メイン画像候補
  'exterior',       -- 店舗外観
  'interior',       -- 店舗内観
  'staff',          -- スタッフ
  'product',        -- 商品
  'service',        -- サービス
  'menu',           -- メニュー
  'facility',       -- 設備
  'access',         -- アクセス
  'logo',           -- ロゴ
  'other'           -- その他
);

create type image_permission_status as enum (
  'unconfirmed',         -- 未確認
  'sales_proposal_only', -- 営業提案用のみ
  'store_permitted',     -- 店舗から使用許可あり
  'store_provided',      -- 店舗提供画像
  'self_prepared',       -- 自分で用意した画像
  'free_material',       -- フリー素材
  'ai_generated',        -- AI生成画像
  'public_ready',        -- 正式公開使用可能
  'not_allowed'          -- 使用不可
);

-- ---------------------------------------------------------------------------
-- store_images
-- ---------------------------------------------------------------------------

create table store_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,

  name text,
  image_type store_image_category not null default 'other',
  source_type image_source_type not null,

  -- Googleマップ写真（実体は保存せず参照のみ）
  google_photo_resource_name text,

  -- ユーザーアップロード（Supabase Storage）
  storage_url text,

  -- 外部URL・SNS投稿（ダウンロードせず参照のみ）
  external_url text,
  sns_post_url text,

  author_name text,
  google_maps_uri text,

  width integer,
  height integer,
  file_size integer,
  mime_type text,

  is_selected boolean not null default true,
  usage_types text[] not null default '{}'::text[],
  permission_status image_permission_status not null default 'unconfirmed',
  display_order integer not null default 0,
  memo text,

  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint store_images_dimensions_nonnegative check (
    (width is null or width >= 0) and (height is null or height >= 0)
  ),
  constraint store_images_file_size_nonnegative check (file_size is null or file_size >= 0)
);

-- Googleマップ写真は再取得のたびにupsertし重複させない
create unique index store_images_google_photo_unique_idx
  on store_images (store_id, google_photo_resource_name)
  where google_photo_resource_name is not null;

create index store_images_store_id_idx on store_images (store_id, display_order);
create index store_images_source_type_idx on store_images (store_id, source_type);

create trigger store_images_set_updated_at before update on store_images
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- store_social_image_references（SNS投稿メモ。特定の画像レコードとは紐づかない自由メモ）
-- ---------------------------------------------------------------------------

create table store_social_image_references (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,

  sns_type text not null, -- instagram / x / facebook / other
  post_url text not null,
  description text,
  planned_use boolean not null default false,
  confirmation_status text not null default 'unconfirmed',
  memo text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_social_image_references_store_id_idx
  on store_social_image_references (store_id, created_at desc);

create trigger store_social_image_references_set_updated_at before update on store_social_image_references
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security（service_roleのみで運用。ポリシーは付与しない）
-- ---------------------------------------------------------------------------

alter table store_images enable row level security;
alter table store_social_image_references enable row level security;

-- ---------------------------------------------------------------------------
-- Supabase Storage: 店舗画像用バケット
-- 読み取りは公開、書き込みはservice_role発行の署名付きアップロードURL経由のみ
-- （anon/authenticatedへの書き込みポリシーは付与しない）
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-images', 'store-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "store-images public read" on storage.objects;
create policy "store-images public read"
  on storage.objects for select
  using (bucket_id = 'store-images');
