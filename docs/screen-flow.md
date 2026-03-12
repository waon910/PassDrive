# 日本運転免許本試験 学習アプリ 画面一覧・画面遷移 v0.1

## 1. 目的

本ドキュメントは、iPad利用を前提にしたMVPの画面構成と主要な遷移を定義する。

対象は以下のMVP機能に限定する。

- 問題演習
- カテゴリ別学習
- 模擬試験
- 誤答復習
- 進捗可視化
- 用語集・標識集

## 2. iPad UI方針

### 2.1 デバイス前提

- 主対象は `iPad Safari` を含むタブレットブラウザ
- 縦向き、横向きの両対応
- キーボードなし、タッチ操作前提

### 2.2 ナビゲーション方針

- 横向きでは `左サイドナビ + 右コンテンツ` の2カラムを基本とする
- 縦向きでは `上部タイトルバー + 下部の主要アクション` を基本とする
- 問題回答中は不要な遷移を減らし、集中できるUIを優先する
- 主要導線が多い画面では、縦向きでも `短いヘッダー + クイックアクション群 + コンテンツセクション` を1画面目に収める
- グローバル遷移先は `Home / Practice / Mock Exam / Mistakes / Progress / Signs & Terms` を基本セットとして保つ
- 縦向きや狭い幅では `ハンバーガーメニューまたはドロワー` を許容するが、現在画面名とモードは常時表示する

### 2.3 UX方針

- 1画面1目的を徹底する
- 問題文、選択肢、解説は英語で読みやすい余白と行間を確保する
- 現在位置、残問数、正答状況を常に把握できるようにする
- 概要画面では `ファーストビューで次の行動候補が複数見えること` を必須とする
- 同じ重みのカードを縦に長く並べず、セクション化、横並び、固定サイド情報を使って探索コストを下げる

## 3. 画面一覧

| Screen ID | 画面名 | 役割 | MVP必須 |
| --- | --- | --- | --- |
| `SCR-01` | Welcome / Onboarding | 初回導入、英語受験向けアプリであることを伝える | Yes |
| `SCR-02` | Home Dashboard | 学習導線の起点、進捗サマリー表示 | Yes |
| `SCR-03` | Practice Setup | 学習モードやカテゴリの選択 | Yes |
| `SCR-04` | Practice Question | 通常演習の出題、回答、解説表示 | Yes |
| `SCR-05` | Mock Exam Setup | 模試開始前の確認 | Yes |
| `SCR-06` | Mock Exam Session | 模試出題中の画面 | Yes |
| `SCR-07` | Results Summary | 演習または模試の結果表示 | Yes |
| `SCR-08` | Mistakes Review | 誤答だけを再学習する導線 | Yes |
| `SCR-09` | Progress Detail | カテゴリ別進捗、弱点表示 | Yes |
| `SCR-10` | Glossary / Signs | 用語集と標識集 | Yes |

## 4. 各画面の要件

### 4.1 `SCR-01` Welcome / Onboarding

目的:

- アプリの対象が `English written test for a Japanese driver's license` であることを伝える
- 最初の行動を迷わせない

主な要素:

- アプリの価値説明
- `Start Practice`
- `Take Mock Exam`
- `Browse Signs & Terms`
- 学習データが端末内保存であることの簡易説明

主要アクション:

- 初回は `Home Dashboard` へ進む
- 再訪時はスキップ可能

### 4.2 `SCR-02` Home Dashboard

目的:

- その時点で最も適切な学習導線を提示する

主な要素:

- 直近の学習状況
- `Continue Practice`
- `Mistakes Only`
- `Start Mock Exam`
- カテゴリ別進捗の簡易カード
- 弱点カテゴリのサマリー

主要アクション:

- `Practice Setup`
- `Mock Exam Setup`
- `Mistakes Review`
- `Progress Detail`
- `Glossary / Signs`

レイアウト指針:

- 横向きでは `次にやること` を主カラムに置き、右側に `弱点・直近スコア・ショートカット` を積む
- 縦向きでは `主CTA 1つ + 主要ショートカット2〜4件 + 進捗要約` を1画面目に配置する
- カテゴリ進捗は一覧をそのまま全件縦積みせず、上位の弱点を先に見せて詳細へ遷移させる

### 4.3 `SCR-03` Practice Setup

目的:

- 通常演習の条件を決める

主な要素:

- モード選択:
  `Random`
  `By Category`
  `Mistakes First`
- カテゴリ選択
- 問題数選択
- 難易度選択
- `Start Practice`

主要アクション:

- 条件を保存して `Practice Question` へ遷移

### 4.4 `SCR-04` Practice Question

目的:

- 1問ずつ解かせ、すぐにフィードバックする

主な要素:

- 問題文
- 選択肢
- 進捗インジケータ
- `Submit Answer`
- 回答後の正誤表示
- 英語解説
- `Next Question`
- `Save to Review` のような再確認導線

UI上の重要条件:

- 横向きでは `問題 / 選択肢` と `解説 / 補足` を左右で分けられる
- 縦向きでは解答後に解説を下部展開する
- 誤タップ防止のため選択肢タップ領域を広く取る

### 4.5 `SCR-05` Mock Exam Setup

目的:

- 模試の開始条件を明示する

主な要素:

- 問題数
- 想定時間
- 合格ライン
- 出題対象バージョン
- `Start Mock Exam`

主要アクション:

- `Mock Exam Session` へ遷移

### 4.6 `SCR-06` Mock Exam Session

目的:

- 本試験に近い連続回答体験を提供する

主な要素:

- 残り時間
- 現在の設問番号
- 問題文
- 選択肢
- `Previous`
- `Next`
- `Finish Exam`

UI上の重要条件:

- 模試中は解説を即時表示しない
- 横向きでは `問題一覧パネル` を任意表示できる
- 縦向きでは `残り時間` と `現在番号` を上部固定する

### 4.7 `SCR-07` Results Summary

目的:

- 結果を即座に理解させ、次の学習へ繋げる

主な要素:

- スコア
- 合否判定
- カテゴリ別正答率
- 間違えた問題数
- `Retry Mistakes`
- `Take Another Mock Exam`
- `Back to Home`

### 4.8 `SCR-08` Mistakes Review

目的:

- 誤答問題だけを効率よく潰す

主な要素:

- 誤答問題一覧またはカードビュー
- 最新誤答順、カテゴリ順の切り替え
- `Retry All`
- 個別問題への再挑戦導線

レイアウト指針:

- 横向きでは `フィルター/要約` と `誤答一覧` を分け、必要なら `選択中の問題プレビュー` を右ペインに置く
- 縦向きでは一覧を `2列カード` または `カテゴリ別セクション` に分割し、1列の長大リストを避ける
- 問題全文と解説は初期表示で全件展開しない

### 4.9 `SCR-09` Progress Detail

目的:

- 学習進捗と弱点を見せる

主な要素:

- カテゴリ別正答率
- 最近の模試推移
- 苦手タグ
- 学習回数

レイアウト指針:

- 横向きでは `弱点ハイライト` を主領域に置き、`全体精度` `模試スコア` `学習回数` を補助パネルへ集約する
- カテゴリ別進捗はスコアカードの壁ではなく、比較しやすい行グリッドまたは2列グリッドで表示する
- 縦向きでは要約指標を先にまとめ、その下にカテゴリ別詳細を置く
- 推奨学習アクション

### 4.10 `SCR-10` Glossary / Signs

目的:

- 問題で頻出の用語と標識を引けるようにする

主な要素:

- 検索
- カテゴリフィルタ
- 用語カード
- 標識カード
- 詳細説明パネル

UI上の重要条件:

- 横向きでは `一覧 + 詳細` の2ペインが有効
- 縦向きでは詳細をシートまたは別画面で表示する

## 5. 主要遷移

### 5.1 初回利用フロー

1. `SCR-01 Welcome / Onboarding`
2. `SCR-02 Home Dashboard`
3. `SCR-03 Practice Setup`
4. `SCR-04 Practice Question`
5. `SCR-07 Results Summary`

### 5.2 通常学習フロー

1. `SCR-02 Home Dashboard`
2. `SCR-03 Practice Setup`
3. `SCR-04 Practice Question`
4. `SCR-07 Results Summary`
5. `SCR-08 Mistakes Review` または `SCR-02 Home Dashboard`

### 5.3 模試フロー

1. `SCR-02 Home Dashboard`
2. `SCR-05 Mock Exam Setup`
3. `SCR-06 Mock Exam Session`
4. `SCR-07 Results Summary`
5. `SCR-08 Mistakes Review`

### 5.4 用語参照フロー

1. `SCR-02 Home Dashboard`
2. `SCR-10 Glossary / Signs`
3. 必要に応じて `SCR-03 Practice Setup` または `SCR-04 Practice Question`

## 6. ナビゲーション構造

### 6.1 グローバル導線

常時アクセス可能にしたい主要導線は以下。

- Home
- Practice
- Mock Exam
- Mistakes
- Progress
- Signs & Terms

### 6.2 画面ごとの制御

- `SCR-04 Practice Question` ではグローバル導線を弱める
- `SCR-06 Mock Exam Session` では離脱防止のため最小限のヘッダのみ
- `SCR-07 Results Summary` で次の行動を明示する

## 7. 画面ごとに必要なデータ

| Screen ID | 主データ |
| --- | --- |
| `SCR-01` | 静的コピー、利用条件メモ |
| `SCR-02` | `UserProgress`, 最近の `ExamSession`, 弱点カテゴリ集計 |
| `SCR-03` | `Category`, `Tag`, 出題対象 `Question` 件数 |
| `SCR-04` | `Question`, `Choice`, `Explanation`, `UserProgress` |
| `SCR-05` | 模試設定、`ContentVersion`, 出題可能問題数 |
| `SCR-06` | `ExamSession`, `ExamSessionAnswer`, `Question`, `Choice` |
| `SCR-07` | `ExamSession`, `ExamSessionAnswer`, カテゴリ別集計 |
| `SCR-08` | 誤答対象 `Question`, `UserProgress` |
| `SCR-09` | `UserProgress`, `ExamSession`, カテゴリ別集計 |
| `SCR-10` | `GlossaryTerm`, `Category` |

## 8. ワイヤー作成前に確定すべきこと

1. 横向き時に `サイドナビ固定` にするか
2. 模試の `問題数` `制限時間` `合格ライン`
3. 通常演習で `解説即時表示` を標準にするか
4. 誤答復習画面を `一覧型` にするか `そのまま出題型` にするか

## 9. 次の推奨作業

1. この画面一覧を前提に `画面別ワイヤーフレーム` を作る
2. `Question` `ExamSession` `UserProgress` を使った画面ごとの表示項目を確定する
3. その後にフロントエンド実装へ入る
