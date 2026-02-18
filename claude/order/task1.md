# GitHub Contribution Gravity Lens

## ルール
1. @claude/log/task1_log.md に作業ログを残す
2. 実装はアーキテクチャ分割する

## 1. 概要

GitHubのContribution Grid（草）を入力データとして使用し、
コミット活動量を「質量」とみなして空間を歪曲させるアニメーションを生成するOSS。

最終成果物はREADMEに埋め込み可能なアニメーションGIFまたはSVG。

コンセプト：

> Your commits bend spacetime.

視覚的に「静かな異常」を生むことを目的とする。

---

## 2. 目的

* 既存の草可視化（snake等）とは異なる未開拓表現を実現する
* README上で視覚的に完結するインパクトを持たせる
* GitHub Actionsで自動更新可能にする
* 抽象的でありながら上品なビジュアルを維持する

---

## 3. 入力データ

### 3.1 データソース

* GitHub GraphQL API または REST API
* 過去1年間のContribution count（日単位）

### 3.2 データ形式

```ts
interface ContributionDay {
  date: string;        // YYYY-MM-DD
  count: number;       // 0以上
  level: 0 | 1 | 2 | 3 | 4;
}
```

---

## 4. 正規化・上限設計（重要）

大量コミットユーザーにより歪曲が破綻しないよう、
物理量は直接使用しない。

### 4.1 正規化

```
maxCount = percentile95(allCounts)
normalized = min(count, maxCount) / maxCount
```

* 上位5%をクリップ
* 外れ値を抑制
* 0〜1へ正規化

### 4.2 非線形マッピング

歪曲強度は線形にしない。

```
mass = pow(normalized, 0.6)
```

* 大量コミットによる暴走防止
* 低〜中活動ユーザーでも視覚差が出る

### 4.3 強度上限

```
factor <= MAX_WARP (例: 0.35)
```

空間破綻を防ぐためハードリミットを設ける。

---

## 5. 表示仕様

### 5.1 基本表示

* 7×約52グリッド
* セルサイズ: 12px
* セル間隔: 3px
* 角丸: 2px

### 5.2 アニメーション構成（4秒ループ）

#### Phase 1（0〜1秒）

静止状態

#### Phase 2（1〜2秒）

緩やかな歪み開始（ease-in）

#### Phase 3（2〜3秒）

最大歪曲（0.8秒ホールド）

#### Phase 4（3〜4秒）

自然復元（ease-out）

イージング関数：

* cubic-bezier(0.4, 0.0, 0.2, 1)

---

## 6. 重力歪曲アルゴリズム

### 6.1 質量中心の決定

```
center = weightedAverage(topNWeeks)
```

単一最大値ではなく上位N週の重心を採用。
より自然な見た目を実現。

### 6.2 座標変換

```
dx = x - cx
dy = y - cy
r2 = dx*dx + dy*dy + epsilon
factor = clamp(k * mass / r2, 0, MAX_WARP)

x' = x + dx * factor
y' = y + dy * factor
```

---

## 7. デザイン仕様（重要）

### 7.1 ビジュアル方針

* 派手にしない
* 黒い円やブラックホール本体は描画しない
* 「見えない質量」を表現する
* 静かで知的な印象を保つ

### 7.2 カラーパレット

ダークテーマ推奨：

```
Background: #0d1117
Grid Base:  #161b22
Level 1:    #0e4429
Level 2:    #006d32
Level 3:    #26a641
Level 4:    #39d353
Warp Glow:  rgba(120, 255, 180, 0.08)
```

最大歪曲時のみ微弱なグローを追加。

### 7.3 光学表現

* 外周にごく薄いリング歪み
* セル間の線を描かない
* 影を使わない
* ミニマル優先

### 7.4 タイポグラフィ（オプション）

右下に小さく：

```
Your commits bend spacetime.
```

フォント：Inter / system-ui
サイズ：10px
不透明度：0.5

---

## 8. レンダリング仕様

### 8.1 SVG出力

* `<rect>`で描画
* transform属性で座標補間
* SMILまたはCSS animation

### 8.2 GIF出力

* Node.js + canvas
* 24fps
* 4秒ループ
* 最大容量2MB以下

推奨幅: 800px

---

## 9. GitHub Actions

### 9.1 実行タイミング

* 毎日0:00 UTC
* workflow_dispatch対応

### 9.2 処理フロー

1. API取得
2. 正規化
3. 重心計算
4. フレーム生成
5. 出力更新

---

## 10. CLI仕様

```
npx github-contribution-gravity-lens
```

オプション:

* `--theme dark|light`
* `--strength number`
* `--duration number`
* `--clip-percent number`

---

## 11. 非機能要件

* Node.js 18以上
* 実行時間1分以内
* APIレート制限遵守
* README互換

---

## 12. 想定リスク

* 抽象的すぎて意味が伝わらない
* 強度設計ミスで破綻
* GIF容量肥大化

---

## 13. ライセンス

MIT License
