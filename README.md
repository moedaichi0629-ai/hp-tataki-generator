# Googleマップ店舗情報収集・HP制作管理ツール

Googleマップから店舗情報を収集し、HP制作候補の店舗を整理・編集・管理するWebアプリです。
第1段階として、旧バージョンの「HPたたき台自動生成」機能を廃止し、店舗情報の収集・保存・編集・管理に特化した構成へ全面刷新しました。

最終的には、ここで整理した情報をもとに、第3段階でRaddyAI・Claude Code・Cursor・Lovable・BoltなどへHP制作を依頼するためのプロンプトを生成する予定です。

## アプリURL

https://hp-tataki-generator-s74r.vercel.app/

> Google Places API・OpenAI APIの利用料金が発生するため、デモ環境でのAPIキーは常時有効化していない場合があります。また、データベース（Supabase）が未接続の状態ではエラーメッセージが表示されます（下記「セットアップ方法」参照）。

## 実装した機能（第1段階）

- 店舗検索（地域×業種の一括検索／GoogleマップURLからの個別登録／店名・住所からの個別検索）
- 店舗情報の保存・編集（基本情報・外部リンク・Googleマップ情報・管理情報）
- 店舗一覧（検索・絞り込み・並び替え・ステータス変更・削除・重複確認）
- 店舗詳細（基本情報／サービス・メニュー／口コミ・強み／メモ・管理情報の4タブ構成）
- サービス・メニュー管理（追加・編集・削除・複製・並び替え・掲載可否）
- 口コミ表示（Googleマップからの取得・帰属表示）と店舗の強み整理（AI下書き機能つき）
- メモ機能（種別つきの営業メモ）
- 店舗ステータス・公式サイト確認状態・情報確認状態の管理
- 重複店舗の防止（Place ID完全一致／店名・住所・電話番号・緯度経度による近似判定）
- ダッシュボード（登録数・各種ステータス集計・最近の登録/更新店舗）
- 旧バージョン（localStorage保存の検索・生成履歴）からのデータ移行機能

## 使用技術

- Next.js（App Router） / React / TypeScript
- CSS Modules
- Supabase（Postgres）… 店舗データの永続化（サーバー側のみservice_role キーで接続）
- Google Places API（Text Search / Nearby Search / Place Details）、Google Geocoding API
- OpenAI API（口コミ・店舗情報からの「強み整理」下書き生成にのみ使用。HPコピー生成には使用しない）
- Zod（入力値バリデーション）

## 機能一覧

### 店舗の登録方法

1. 地域×業種による一括検索（取得件数・最低評価・最低口コミ数・営業中のみ・公式サイトなし候補のみ・登録済み除外の各フィルタに対応）
2. GoogleマップURLからの個別登録（通常URL・短縮URL `maps.app.goo.gl` に対応。Place IDを直接特定できない場合は店名・座標からText Search / Nearby Searchで候補を検索し、複数候補がある場合は選択可能）
3. 店名・住所からの個別検索

### 店舗管理

- 店舗一覧：店舗名・地域・業種・評価・口コミ数・公式サイト確認状態・店舗ステータス・営業対象/対象外・登録日・更新日で絞り込み。6種類の並び替えに対応
- 店舗詳細：4タブ（基本情報／サービス・メニュー／口コミ・強み／メモ・管理情報）
- 店舗ステータス14種類（候補〜成約・見送り・対象外。「プロンプト未作成」「プロンプト作成済み」は第3段階向けに予約）
- 公式サイト確認状態6種類（未確認/公式サイトなし/公式サイトあり/予約サイトのみ/SNSのみ/確認が必要）。Googleマップの情報だけで「公式サイトなし」と断定しない設計
- 基本情報は項目ごとに確認状態（未確認/確認済み/要修正/掲載しない）を設定可能

### データの重複防止

- Place IDが一致する場合は新規登録せず、既存店舗を案内
- Place IDがない場合は店名・住所・電話番号・緯度経度（半径50m以内）の組み合わせで重複候補を検出し、ユーザーに確認を求める（自動統合はしない）

## 実装手順

1. 既存プロジェクト構成の調査（Next.js App Router / Google Places・Sheets連携 / localStorage履歴 / 未使用のSupabase型定義など）
2. 削除対象（HPたたき台生成・営業文生成・スプレッドシート保存）と残す対象（店舗検索・Google連携）の整理
3. Supabaseへのデータベース設計・マイグレーションSQL作成
4. HP生成関連のAPI Route・ライブラリ・型定義・UIの削除
5. 店舗検索APIの拡張、GoogleマップURL解決・個別検索APIの新規実装
6. 重複判定ロジックと店舗CRUD APIの実装
7. ダッシュボード・店舗一覧・店舗詳細・編集・設定の各画面実装
8. サービス・メニュー／口コミ・強み／メモの機能実装
9. データベース未接続時にも必ずJSONエラーを返すよう、全API Routeにエラーハンドリングを統一
10. TypeScriptチェック・ESLint・ビルド確認
11. README更新

## ディレクトリ構成

```
hp-tataki-generator/
├── .env.local.example            # 環境変数テンプレート
├── supabase/
│   └── migrations/
│       └── 0001_init.sql         # Supabaseテーブル定義（stores, store_services, store_reviews,
│                                  #   store_strengths, store_notes, search_histories）
├── src/
│   ├── app/
│   │   ├── page.tsx               # ダッシュボード
│   │   ├── search/                # 店舗検索（3方式のタブ + 検索履歴）
│   │   ├── stores/
│   │   │   ├── page.tsx           # 店舗一覧
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # 店舗詳細（4タブ）
│   │   │       └── edit/          # 店舗情報編集
│   │   ├── settings/              # 環境変数状況・データ移行
│   │   └── api/
│   │       ├── search/            # 地域×業種検索・URL解決・店名検索
│   │       ├── stores/            # 店舗CRUD・services・reviews・strengths・notes・duplicates
│   │       ├── search-histories/
│   │       ├── dashboard/
│   │       ├── migrate/           # 旧localStorageデータの移行
│   │       └── settings/          # 環境変数設定状況
│   ├── components/                # AppShell, StoreStatusBadge, ConfirmDialog など共通UI
│   ├── lib/                       # Supabaseクライアント、店舗マッパー、重複判定、
│   │                               #   GoogleマップURL解決（SSRF対策）、バリデーション等
│   ├── styles/common.module.css   # 全画面共通のUIスタイル
│   └── types/                     # ドメイン型・Supabaseテーブル型
└── tsconfig.json
```

## セットアップ方法

1. 依存パッケージをインストール

   ```
   npm install
   ```

2. `.env.local.example` をコピーして `.env.local` を作成し、APIキー・Supabase接続情報を設定

3. Supabaseプロジェクトを作成し、SQL Editorで `supabase/migrations/0001_init.sql` を実行

4. 開発サーバーを起動

   ```
   npm run dev
   ```

## 環境変数

```
GOOGLE_PLACES_API_KEY=       # Google Places API・Geocoding APIキー
OPENAI_API_KEY=              # OpenAI APIキー（強み整理のAI下書き機能に使用）
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=                # SupabaseプロジェクトのURL
SUPABASE_SERVICE_ROLE_KEY=   # Supabaseのservice_roleキー（サーバー専用）
```

いずれもサーバー側（API Route）でのみ使用し、クライアントに直接送出しません。

## 工夫した点

- **重複登録の防止**：Place ID完全一致を最優先とし、Place IDが無い場合も店名・住所・電話番号・緯度経度（半径50m）の組み合わせで近似判定を行い、自動統合はせずユーザーに確認を委ねる設計にした
- **GoogleマップURLのSSRF対策**：短縮URL展開時はリダイレクト追跡を`redirect: "manual"`で行い、Locationヘッダのホストを`google.com` / `goo.gl`系のみに限定。不正なリダイレクト先が検出された場合は処理を中断する
- **DB未接続時の耐障害性**：Supabase未設定時にAPI Routeが例外を投げても、必ず日本語のJSONエラーを返すよう全ルートでハンドリングを統一し、画面がクラッシュしないようにした
- **AI利用範囲の限定**：OpenAIは「口コミ・店舗情報からの強み整理の下書き」にのみ使用し、料金やスタッフ名・実績の創作を禁じるプロンプト制約と、画面上の免責表示を必須にした
- **第2・3段階を見据えたスキーマ**：`store_images` / `website_requirements` / `website_sections` / `generated_prompts` を`store_id`で連携できる設計にしておき、画像管理・HP制作条件・プロンプト生成を追加しやすくした

## 今後追加したい機能（第2・3段階）

- 画像管理（店舗画像のアップロード・整理）
- HP制作条件設定（トーン・カラー・掲載必須事項など）
- 使用AIツール選択（RaddyAI / Claude Code / Cursor / Lovable / Bolt）
- HP作成用プロンプト生成
- プロンプト履歴管理

## 学んだこと

- 単一ページの生成ツールを、複数テーブルにまたがる管理システムへ移行する際は、削除範囲と残す範囲を先に明文化してから着手すると手戻りが少ない
- 「Googleマップに公式サイトがない＝実在しない」と断定しない設計（確認状態を多段階で持つ）は、営業判断を誤らせないための重要な安全策になる
- サーバーレス環境では、DB未接続などの初期化エラーが同期的にthrowされるケースを想定し、全APIルートで一貫したエラーハンドリングを行う必要がある
