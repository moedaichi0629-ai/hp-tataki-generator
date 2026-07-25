# Googleマップ店舗情報収集・HP制作管理ツール

Googleマップから店舗情報を収集し、HP制作候補の店舗を整理・編集・管理するWebアプリです。

- **第1段階**: 旧バージョンの「HPたたき台自動生成」機能を廃止し、店舗情報の収集・保存・編集・管理に特化した構成へ全面刷新
- **第2段階**: HP作成AIへ渡すための画像情報（Googleマップ写真・アップロード画像・外部URL・SNS投稿メモ）を収集・選択・整理する機能を追加（今回）

第1・2段階ではHP自体の生成やデザイン・プレビューは行いません。最終的には、ここで整理した情報をもとに、第3段階でRaddyAI・Claude Code・Cursor・Lovable・BoltなどへHP制作を依頼するためのプロンプトを生成する予定です。

## アプリURL

https://hp-tataki-generator-s74r.vercel.app/

> Google Places API・OpenAI APIの利用料金が発生するため、デモ環境でのAPIキーは常時有効化していない場合があります。また、データベース（Supabase）が未接続の状態ではエラーメッセージが表示されます（下記「セットアップ方法」参照）。

## 実装した機能

### 第1段階

- 店舗検索（地域×業種の一括検索／GoogleマップURLからの個別登録／店名・住所からの個別検索）
- 店舗情報の保存・編集（基本情報・外部リンク・Googleマップ情報・管理情報）
- 店舗一覧（検索・絞り込み・並び替え・ステータス変更・削除・重複確認）
- サービス・メニュー管理、口コミ表示・強み整理（AI下書き機能つき）、メモ機能
- 店舗ステータス・公式サイト確認状態・情報確認状態の管理、重複店舗の防止
- ダッシュボード、旧バージョンからのデータ移行機能

### 第2段階（今回追加）

- 店舗詳細に「画像管理」タブを追加（Googleマップ写真／アップロード画像／外部画像URL／SNS投稿メモ／使用画像一覧の5セクション構成）
- Google Places APIによるGoogleマップ掲載写真の参照情報取得（最大10枚、実体は保存せず都度取得）
- ブラウザからSupabase Storageへの直接アップロード（複数ファイル対応、進捗表示、破損・重複チェック）
- 外部画像URLの参照登録（SSRF対策つきの到達性・Content-Type確認、ダウンロードはしない）
- SNS投稿URLのメモ管理（自動取得は行わない）
- 画像ごとの画像種別・使用用途（複数選択可）・利用確認ステータス・表示順の管理
- 使用画像一覧でのフィルタ・並び替え・並び替えボタン
- HP制作向け画像準備状況のチェック（枚数集計・警告表示）

## 使用技術

- Next.js（App Router） / React / TypeScript
- CSS Modules
- Supabase（Postgres + Storage）… 店舗データ・画像メタデータの永続化とアップロード画像の保管
- Google Places API（Text Search / Nearby Search / Place Details / Place Photos）、Google Geocoding API
- OpenAI API（口コミ・店舗情報からの「強み整理」下書き生成にのみ使用。HPコピー生成には使用しない）
- Zod（入力値バリデーション）

## 機能一覧

### 店舗の登録方法

1. 地域×業種による一括検索（取得件数・最低評価・最低口コミ数・営業中のみ・公式サイトなし候補のみ・登録済み除外の各フィルタに対応）
2. GoogleマップURLからの個別登録（通常URL・短縮URL `maps.app.goo.gl` に対応。Place IDを直接特定できない場合は店名・座標からText Search / Nearby Searchで候補を検索し、複数候補がある場合は選択可能）
3. 店名・住所からの個別検索

### 店舗管理

- 店舗一覧：店舗名・地域・業種・評価・口コミ数・公式サイト確認状態・店舗ステータス・営業対象/対象外・登録日・更新日で絞り込み。6種類の並び替えに対応
- 店舗詳細：5タブ（基本情報／サービス・メニュー／口コミ・強み／画像管理／メモ・管理情報）
- 店舗ステータス14種類（候補〜成約・見送り・対象外。「プロンプト未作成」「プロンプト作成済み」は第3段階向けに予約）
- 公式サイト確認状態6種類。Googleマップの情報だけで「公式サイトなし」と断定しない設計
- 基本情報は項目ごとに確認状態（未確認/確認済み/要修正/掲載しない）を設定可能

### データの重複防止

- Place IDが一致する場合は新規登録せず、既存店舗を案内
- Place IDがない場合は店名・住所・電話番号・緯度経度（半径50m以内）の組み合わせで重複候補を検出し、ユーザーに確認を求める（自動統合はしない）

### 画像管理（第2段階）

- **Googleマップ写真**: Place Details APIの`photos`フィールドから最大10枚の写真参照情報（`photo_reference`・幅・高さ・投稿者情報）を取得。グリッド表示、チェックボックスでの複数選択、一括での使用可否変更・利用確認ステータス変更・ギャラリー設定に対応
- **アップロード画像**: JPEG/PNG/WebP、1ファイル10MB以下、複数同時アップロード。ドラッグ&ドロップ対応、進捗表示、ブラウザデコードによる破損チェック、同名ファイルの重複確認
- **外部画像URL**: URLを参照情報として保存（ダウンロードしない）。登録前にSSRF対策つきの到達性・Content-Type確認を実施
- **SNS投稿メモ**: Instagram/X/Facebookなどの投稿URLをメモとして保存（自動取得・スクレイピングは行わない）
- **使用画像一覧**: 全画像を横断してフィルタ（使用状況・取得元・利用確認・画像種別・使用用途）・並び替え（表示順・登録日・画像名・サイズ・取得元）。表示順は上下ボタンで変更可能
- **HP制作向け画像チェック**: 使用画像数・メイン候補数・利用確認状況などを集計し、画像0枚やメイン候補なしなどの場合に警告を表示

## 実装手順

### 第1段階

1. 既存プロジェクト構成の調査
2. 削除対象と残す対象の整理
3. Supabaseへのデータベース設計・マイグレーションSQL作成
4. HP生成関連のAPI Route・ライブラリ・型定義・UIの削除
5. 店舗検索APIの拡張、店舗CRUD・重複判定の実装
6. ダッシュボード・店舗一覧・店舗詳細・編集・設定の各画面実装
7. 全API Routeでのエラーハンドリング統一
8. TypeScriptチェック・ESLint・ビルド確認、README更新

### 第2段階

1. 第1段階後のコード構成（店舗詳細タブ構成・DB・Google Places API利用状況・ストレージ有無）を確認
2. 画像データ構造（`store_images` / `store_social_image_references`）を設計し、Supabase Storageバケットとあわせてマイグレーション作成
3. Google Places APIの写真参照取得処理・サーバープロキシ配信を実装
4. 署名付きアップロードURル方式でのブラウザ直アップロードを実装（Vercelのリクエストボディ上限を回避するため）
5. 外部URL確認（SSRF対策）・SNS投稿メモ・画像CRUD・並び替え・一括操作のAPIを実装
6. 画像管理タブのUI（5セクション＋プレビュー＋準備状況パネル）を実装し店舗詳細へ組み込み
7. 店舗削除時のStorageクリーンアップを追加
8. TypeScriptチェック・ESLint・ビルド確認
9. 実際のSupabaseプロジェクトに対するAPI疎通確認（一覧取得・Googleマップ写真取得・写真プロキシ配信・SSRF拒否確認・署名付きURLアップロード・登録/更新/削除・Storage実削除まで確認）
10. README更新

## ディレクトリ構成

```
hp-tataki-generator/
├── .env.local.example              # 環境変数テンプレート
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql           # 店舗関連テーブル（stores, store_services, store_reviews,
│       │                           #   store_strengths, store_notes, search_histories）
│       └── 0002_store_images.sql   # 画像関連テーブル（store_images, store_social_image_references）
│                                   #   + Supabase Storageバケット(store-images)
├── src/
│   ├── app/
│   │   ├── page.tsx                 # ダッシュボード
│   │   ├── search/                  # 店舗検索（3方式のタブ + 検索履歴）
│   │   ├── stores/
│   │   │   ├── page.tsx             # 店舗一覧
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # 店舗詳細（5タブ）
│   │   │       ├── edit/            # 店舗情報編集
│   │   │       └── images/          # 画像管理タブの各セクション
│   │   ├── settings/                # 環境変数状況・データ移行
│   │   └── api/
│   │       ├── search/              # 地域×業種検索・URL解決・店名検索
│   │       ├── stores/
│   │       │   └── [id]/
│   │       │       ├── images/      # 画像CRUD・Googleマップ写真取得・写真プロキシ・
│   │       │       │                #   アップロードURL発行・外部URL確認・並び替え・一括操作
│   │       │       └── social-image-references/  # SNS投稿メモCRUD
│   │       ├── search-histories/
│   │       ├── dashboard/
│   │       ├── migrate/             # 旧localStorageデータの移行
│   │       └── settings/            # 環境変数設定状況
│   ├── components/                  # AppShell, StoreStatusBadge, ConfirmDialog など共通UI
│   ├── lib/                         # Supabaseクライアント、店舗/画像マッパー、重複判定、
│   │                                 #   GoogleマップURL解決・外部URL安全性検証（SSRF対策）、
│   │                                 #   アップロード検証、画像準備状況の計算等
│   ├── styles/common.module.css     # 全画面共通のUIスタイル
│   └── types/                       # ドメイン型・Supabaseテーブル型
└── tsconfig.json
```

## セットアップ方法

1. 依存パッケージをインストール

   ```
   npm install
   ```

2. `.env.local.example` をコピーして `.env.local` を作成し、APIキー・Supabase接続情報を設定

3. Supabaseプロジェクトを作成し、SQL Editorで `supabase/migrations/0001_init.sql` → `0002_store_images.sql` の順に実行（`0002`はSupabase Storageのバケット`store-images`も作成します）

4. 開発サーバーを起動

   ```
   npm run dev
   ```

## 環境変数

```
GOOGLE_PLACES_API_KEY=          # Google Places API・Geocoding APIキー
OPENAI_API_KEY=                 # OpenAI APIキー（強み整理のAI下書き機能に使用）
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=                   # SupabaseプロジェクトのURL（サーバー専用）
SUPABASE_SERVICE_ROLE_KEY=      # Supabaseのservice_roleキー（サーバー専用・秘密）
NEXT_PUBLIC_SUPABASE_URL=       # SUPABASE_URLと同じ値（ブラウザから直接アップロードするため必要）
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabaseのanon/publishableキー（公開可能な鍵）
```

`SUPABASE_SERVICE_ROLE_KEY`はAPI Routeでのみ使用し、クライアントに送出しません。`NEXT_PUBLIC_`が付く2つは、ブラウザからSupabase Storageへ直接ファイルをアップロードするために必要な、公開しても問題ない鍵です（実際のアップロード先パスは、サーバーが発行する署名付きURLでのみ許可されます）。

## Google Places API写真取得の仕組み

- 既存の実装と同じレガシーPlaces API（`maps.googleapis.com/maps/api/place/*`）を継続使用し、Place Detailsの`photos`フィールドのみを要求するfield mask（`place_id,photos`）で取得します
- 取得するのは`photo_reference`（写真参照情報）・幅・高さ・投稿者情報のみで、**画像の実体（バイナリ）は一切ダウンロード・保存しません**
- 画面での表示は、サーバー側プロキシ（`GET /api/stores/[id]/images/google-photo`）が都度Google Photo APIを呼び出して配信します。これによりAPIキーをクライアントに渡さず、かつGoogleマップ写真を自前ストレージへ無期限保存しない設計にしています
- 「写真情報を取得」ボタンは新規取得・再取得の両方を兼ね、`photo_reference`が期限切れになっていた場合も再取得により最新の参照情報に更新されます
- Googleマップ写真の帰属表示（投稿者名・Googleマップへのリンク）は削除せず常に表示します

## 画像アップロードの仕組み

- Vercelのサーバーレス関数にはリクエストボディに約4.5MBの上限があり、推奨の「10MB以下」をサーバー経由アップロードでは満たせません
- そのため、サーバー（`POST /api/stores/[id]/images/upload-url`）はSupabase Storageの**署名付きアップロードURL**を発行するだけに留め、**ブラウザから直接Supabase Storageへアップロード**します（サーバーはファイルの実バイトを一切扱いません）
- 破損チェックと画像サイズ（幅・高さ）の取得は、ブラウザの`Image()`デコード（失敗時＝破損とみなす）を利用しています
- アップロード先のバケット`store-images`には、Supabase側で`file_size_limit`（10MB）と`allowed_mime_types`（JPEG/PNG/WebP）を設定し、ストレージ側でも制限を強制しています

## Googleマップ写真の保存制限

- Googleマップ写真は`photo_reference`のみをデータベースに保存し、画像の実体は保存しません
- 表示のたびにGoogle Places APIから取得するため、Googleマップ側の写真が更新・削除された場合も追従します
- `photo_reference`が期限切れで取得に失敗した場合は、店舗詳細の「写真情報を取得」から再取得できます

## 画像利用確認ステータス

各画像には以下の利用確認ステータスを設定できます。

未確認 / 営業提案用のみ / 店舗から使用許可あり / 店舗提供画像 / 自分で用意した画像 / フリー素材 / AI生成画像 / 正式公開使用可能 / 使用不可

このうち「未確認」「営業提案用のみ」「使用不可」は、第3段階の正式なHP作成用プロンプト生成時には使用しない画像として区別できるよう設計しています（`src/lib/imageStatus.ts`の`NON_PUBLIC_PERMISSION_STATUSES`）。

## 工夫した点

- **重複登録の防止**：Place ID完全一致を最優先とし、Place IDが無い場合も店名・住所・電話番号・緯度経度（半径50m）の組み合わせで近似判定を行い、自動統合はせずユーザーに確認を委ねる設計にした
- **GoogleマップURL・外部画像URLのSSRF対策**：GoogleマップURLの短縮URL展開はGoogle系ドメインへの許可リスト方式、外部画像URLはDNS解決したIPアドレスがプライベート/ループバック/リンクローカル帯域でないことを検証する方式と、URLの性質に応じて適切な対策を使い分けている
- **DB未接続時の耐障害性**：Supabase未設定時にAPI Routeが例外を投げても、必ず日本語のJSONエラーを返すよう全ルートでハンドリングを統一し、画面がクラッシュしないようにした
- **AI利用範囲の限定**：OpenAIは「口コミ・店舗情報からの強み整理の下書き」にのみ使用し、料金やスタッフ名・実績の創作を禁じるプロンプト制約と、画面上の免責表示を必須にした
- **画像の非保存設計**：Googleマップ写真は参照情報のみ保存しプロキシ配信、外部URL・SNS投稿も参照のみで、実体を持つのはユーザーが明示的にアップロードした画像だけという一貫した方針にした
- **Vercelの制約を踏まえたアップロード設計**：サーバーレス関数のボディサイズ上限を回避するため、署名付きURLによるブラウザ→Storage直アップロード方式を採用した
- **第3段階を見据えたスキーマ**：`website_requirements` / `website_sections` / `generated_prompts` を`store_id`で連携できる設計にしておき、HP制作条件・プロンプト生成を追加しやすくした。画像の「準備状況チェック」はDBに結果を保存せず、`store_images`テーブルを正として都度計算する純粋関数（`imageReadiness.ts`）にすることで、第3段階のプロンプト生成前チェックでもそのまま再利用できるようにした

## 今後追加したい機能（第3段階）

- HP制作条件設定
- 必要セクション選択
- 使用AIツール選択（RaddyAI / Claude Code / Cursor / Lovable / Bolt）
- HP作成用プロンプト生成
- プロンプト編集・保存・履歴管理

## 学んだこと

- 単一ページの生成ツールを、複数テーブルにまたがる管理システムへ移行する際は、削除範囲と残す範囲を先に明文化してから着手すると手戻りが少ない
- 「Googleマップに公式サイトがない＝実在しない」と断定しない設計（確認状態を多段階で持つ）は、営業判断を誤らせないための重要な安全策になる
- サーバーレス環境では、DB未接続などの初期化エラーが同期的にthrowされるケースを想定し、全APIルートで一貫したエラーハンドリングを行う必要がある
- Vercelのようなサーバーレス環境でファイルアップロードを扱う場合、リクエストボディサイズの上限を早い段階で確認しておかないと、後から署名付きURL方式への設計変更が必要になる
- Supabase StorageのAPIゲートウェイは、署名付きアップロードURLへのリクエストであってもプロジェクトのAPIキー（anon/publishable）を要求するため、「サーバーの秘密鍵だけで完結する」という当初の想定が崩れることがある。ライブラリの内部実装（HTTPリクエストの実体）を確認してから設計する重要性を実感した
