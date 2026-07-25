-- store_reviews の重複防止を部分インデックスから通常のユニーク制約に変更
-- upsert(onConflict: "store_id,google_review_id") が部分インデックスと一致せず
-- "no unique or exclusion constraint matching the ON CONFLICT specification" エラーになっていたため

drop index if exists store_reviews_dedupe_idx;

alter table store_reviews
  add constraint store_reviews_dedupe_uq unique (store_id, google_review_id);
