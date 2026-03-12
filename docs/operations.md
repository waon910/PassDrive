# PassDrive 運用ガイド

## 1. 方針の要約

PassDrive では、すべてのデータを同じデータベースへ移す方針は取りません。

- 学習者の履歴はブラウザ内の `IndexedDB` に保持する
- 管理対象のコンテンツとレビュー状態はリレーショナルなコンテンツストアへ移す
- ローカル開発では `SQLite` を使う
- Vercel などのデプロイ環境では `Postgres` を使う

この方針にする理由:

- 学習履歴は現時点では端末ローカル保存がプロダクト要件に合っている
- レビュー状態と公開状態はデプロイをまたいで永続化される必要がある
- Vercel 上ではファイルベース JSON への書き込みで管理運用を成立させられない

## 2. 現在の安全な運用モード

現在のリポジトリは、まだ file-backed なコンテンツストアでも運用できます。

これは以下を意味します。

- 学習者向け画面はローカルでも Vercel でも動作する
- ローカルの管理画面レビューは `data/samples/mvp-sample-question-set.json` に保存できる
- `CONTENT_STORE_MODE=file` の間は、Vercel 上の管理画面は読み取り専用として扱う

本番を壊さずに作業を進めたい場合は、この運用を使います。

## 2.1 リレーショナルストアモード

現在のアプリには、3つのモードで動作する `content-store` 境界があります。

- `file`
- `sqlite`
- `postgres`

使用する環境変数:

- `CONTENT_STORE_MODE`
- `CONTENT_DATABASE_URL`
- `CONTENT_DB_AUTO_SEED`

例:

```bash
# 従来どおり JSON ベースでローカル運用する
CONTENT_STORE_MODE=file

# ローカルで SQLite を使う
CONTENT_STORE_MODE=sqlite
CONTENT_DATABASE_URL=data/content/passdrive.sqlite
CONTENT_DB_AUTO_SEED=true

# デプロイ環境で Postgres を使う
CONTENT_STORE_MODE=postgres
CONTENT_DATABASE_URL=postgres://...
CONTENT_DB_AUTO_SEED=false
```

運用しやすくするため、env ファイルは用途ごとに分けるのを推奨します。

- `.env.local`
  ローカルで `npm run dev` するときの通常設定
- `.env.sqlite.local`
  `SQLite` に seed するとき専用の設定
- `.env.neon.local`
  `Neon / Postgres` に seed するとき専用の設定

推奨コマンド:

```bash
npm run content:seed:sqlite
npm run content:seed:neon
```

## 3. 現在の問題追加フロー

### 3.1 問題を追加または取り込む

既存の import script を使うか、サンプルデータセットを直接更新します。

- `scripts/import-jaf-quiz.mjs`
- `scripts/import-car-license-questions.mjs`
- `data/samples/mvp-sample-question-set.json`

問題を追加するときのルール:

- 必ず対応する `SourceReference` を作るか紐付ける
- 権利確認が終わっていない限り `rightsStatus` は `review_required` のままにする
- 新規問題は `translation_review` などの未公開状態で入れる
- `TranslationReview` と `ExplanationReview` のレコードを必ず用意する

### 3.2 ローカルで検証する

以下を実行します。

```bash
npm run validate:sample
npm run typecheck
npm run build
```

どれかが失敗する状態では、コンテンツ変更を出荷しません。

### 3.3 ローカルでレビューして公開する

ローカルの管理画面レビュー UI を使って、以下の順に確認します。

- 権利確認を承認する
- 翻訳レビューを承認する
- 解説レビューを承認する
- 公開する

このフローでは、リポジトリ内のサンプルデータファイルが更新されます。

### 3.4 コンテンツ変更をコミットする

ローカルレビューが終わったら、以下を行います。

- 更新された dataset JSON をコミットする
- PR を作るか、デプロイ対象ブランチへマージする

現時点では、この JSON ファイルをコミットしてデプロイする方法が安全な公開手順です。

## 4. 現在のデプロイフロー

### 4.1 必須の環境変数

最低限必要なもの:

- `PASSDRIVE_APP_PASSWORD`

DB ベースのコンテンツストアを使う場合は、さらに以下も必要です。

- `CONTENT_STORE_MODE`
- `CONTENT_DATABASE_URL`

### 4.2 現時点での Vercel デプロイ

今の本番安全フローは以下です。

1. ローカルでコンテンツレビューを完了する
2. 更新済み dataset ファイルをコミットする
3. Git に push する
4. Vercel にそのコミットをビルド・デプロイさせる

重要:

- まだ file-backed ストレージを使っている間は、Vercel 上の管理画面更新を本番保存として信用しない
- file-backed の間の管理画面は、確認用途が中心である

### 4.2.1 Postgres ベースのデプロイへ移る場合

Postgres の準備ができたら、以下の順で進めます。

1. `CONTENT_STORE_MODE=postgres` を設定する
2. `CONTENT_DATABASE_URL` を設定する
3. 対象データベースに対して seed / import を実行する
4. アプリをデプロイする

推奨 seed コマンド:

```bash
CONTENT_STORE_MODE=postgres CONTENT_DATABASE_URL=postgres://... npm run content:seed
```

### 4.3 Preview 環境

Preview デプロイは、レイアウトやルート挙動の確認には有効です。  
ただし file-backed ストレージの間は、書き込み可能な管理環境として扱いません。

## 5. 目標とするデータベース運用

次の実装段階では、ひとつの `content-store` 境界の裏側に、2つのリレーショナルアダプタを持たせます。

- ローカル開発用の `SQLite` アダプタ
- デプロイ環境用の `Postgres` アダプタ

feature コードは、どちらの保存先でも同じ境界を通して読み書きする前提にします。

JSON dataset の役割は今後こうします。

- seed 用データ
- テスト用 fixture
- migration / import 用の入力データ

つまり、最終的には production の source of truth ではなくします。

このリポジトリには、すでに最初の relational-store runtime と seed コマンドが入っています。  
ただし、DB ベース運用を本番で完全に回すには、まだ運用確認と検証が必要です。

## 6. 目標とする問題追加フロー

DB ベースのコンテンツストア実装後は、以下の流れにします。

1. 問題をリレーショナルなコンテンツストアへ取り込む
2. ローカル SQLite または共有 preview DB で、権利・翻訳・解説をレビューする
3. 管理画面から公開する
4. 学習者向け画面は、Postgres に保存された公開済みデータを読む

この段階でも JSON import 自体は有用ですが、公開状態の正本は DB に持たせます。

### 6.1 ローカル SQLite 運用

推奨するローカルフロー:

1. `CONTENT_STORE_MODE=sqlite` を設定する
2. `CONTENT_DATABASE_URL=data/content/passdrive.sqlite` を使う
3. 初回に `npm run content:seed` を実行するか、空 DB に対して auto-seed を使う
4. ローカルでアプリと管理画面を使う

この形にすると、ローカル挙動を将来の本番構成に近づけられます。

例:

`.env.local`

```bash
PASSDRIVE_APP_PASSWORD=your-local-password
CONTENT_STORE_MODE=sqlite
CONTENT_DATABASE_URL=data/content/passdrive.sqlite
CONTENT_DB_AUTO_SEED=true
```

`.env.sqlite.local`

```bash
CONTENT_STORE_MODE=sqlite
CONTENT_DATABASE_URL=data/content/passdrive.sqlite
CONTENT_DB_AUTO_SEED=true
```

`.env.neon.local`

```bash
CONTENT_STORE_MODE=postgres
CONTENT_DATABASE_URL=postgres://...
CONTENT_DB_AUTO_SEED=false
```

## 7. 切り替え計画

以下の順で進めます。

1. 現在の `content-store` 境界の裏側に DB ベースの保存実装を入れる
2. JSON は seed / import 用フォーマットとして残す
3. 現在の sample dataset からローカル SQLite を seed する
4. Vercel で使う Postgres を preview 用に seed する
5. review action を DB ベースの保存へ切り替える
6. publish と revalidate の挙動を確認する
7. 通常運用から file-backed review を外す

## 8. 今はやらないこと

現時点では、以下はスコープ外です。

- 学習履歴をブラウザ外へ移すこと
- 完全なアカウントベース認証を入れること
- 永続化境界が安定する前に複雑な CMS を作ること
