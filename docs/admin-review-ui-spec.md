# Admin Review UI Spec v0.2

## 1. Purpose

`/admin/review` は、問題の公開状態を管理するための画面とする。

旧仕様にあった以下のレビュー操作は持たない。

- 翻訳レビュー承認
- 解説レビュー承認
- 添付画像や権利の承認フロー

## 2. Routes

- `/admin/review`
- `/admin/review/questions/[questionId]`

## 3. Dashboard responsibilities

一覧画面でできること:

- `published` / `unpublished` の件数確認
- カテゴリ、検索語、公開状態での絞り込み
- 問題詳細への移動

一覧画面で表示する情報:

- question id
- category
- english stem
- source name
- current status
- updated date

## 4. Detail responsibilities

詳細画面でできること:

- 問題文、選択肢、解説、画像、source context の確認
- `published` なら `Unpublish Question`
- `unpublished` なら `Publish Question`

詳細画面でやらないこと:

- 翻訳メモ表示
- 解説レビュー履歴表示
- 権利承認ボタン表示

## 5. Practice integration

`/practice` では現在表示中の問題を `unpublished` にできる。

期待挙動:

- 実行後は `/practice` に戻る
- revalidate 後、その問題は learner routes から外れる

## 6. State model

`Question.status`

- `published`: learner routes で表示する
- `unpublished`: learner routes から除外する

新規追加問題の初期値は `published`。

## 7. Non-goals

- reviewer assignment
- multi-step approval workflow
- rights status matrix
- translation / explanation review records
