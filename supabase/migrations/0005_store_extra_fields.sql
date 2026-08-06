-- 店舗にHP作成後のリンク・営業済みチェック・登録時の検索条件（地域×業種検索のスナップショット）を追加

alter table stores
  add column created_hp_url text,
  add column sales_contacted boolean not null default false,
  add column registration_region text,
  add column registration_search_radius_meters integer;
