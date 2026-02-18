# GitHub Contribution Gravity Lens

## ルール
1. @claude/log/fix1_log.md に作業ログを残す
2. 実装はアーキテクチャ分割する

## Design Revision Specification

---

## 1. 目的

現在の実装は「最大コミット地点のみが膨張する」仕様となっており、
視覚的に単調で“空間が歪んでいる”印象が弱い。

本改修では以下を目的とする：

* 単一点膨張から「空間歪曲」への進化
* 重力レンズとして自然な干渉構造の導入
* 色設計・余白設計による洗練度向上
* README上での視認性と高級感の両立

---

## 2. 重力源の設計変更

### 2.1 単一最大値の廃止

従来：

* 最大commit地点のみを重力中心とする

変更後：

* 上位N週（推奨N=3）を重力源とする
* 各重力源の影響を加算

```
totalDisplacement = Σ displacement_i
```

### 2.2 重心計算

```
peaks = topNWeeksByContribution
cx = weightedAverage(peaks.x)
cy = weightedAverage(peaks.y)
```

---

## 3. 座標変形方式の変更

### 3.1 サイズ変形の廃止

* セルの拡大縮小は禁止
* 視覚変化は座標移動のみで表現

### 3.2 重力歪曲式

```
dx = x - cx
dy = y - cy
r2 = dx*dx + dy*dy + epsilon
factor = clamp(k * mass / r2, 0, MAX_WARP)

x' = x + dx * factor
y' = y + dy * factor
```

### 3.3 干渉

複数重力源が存在する場合：

```
x' = x + Σ(dx_i * factor_i)
y' = y + Σ(dy_i * factor_i)
```

---

## 4. 正規化・暴走防止

### 4.1 外れ値クリップ

```
maxCount = percentile95(allCounts)
normalized = min(count, maxCount) / maxCount
```

### 4.2 非線形マッピング

```
mass = pow(normalized, 0.6)
```

### 4.3 上限値

```
factor <= 0.35
```

---

## 5. レイアウト改善

### 5.1 セル寸法

* セルサイズ: 11px
* ギャップ: 4px
* 角丸: 2px

目的：歪曲を視認しやすくする

---

## 6. カラーデザイン改修

### 6.1 背景

```
Background Top:    #0b0f14
Background Bottom: #0f1720
```

縦方向に微弱グラデーション

### 6.2 セルカラーパレット（宇宙寄り）

```
Base:   #13202b
Level1: #1f3b4d
Level2: #255d73
Level3: #2e86a7
Level4: #66c2ff
```

### 6.3 質量中心強調

* 最大歪曲時のみ色温度を微妙に紫寄りへシフト
* 推奨: #8b5cf6 (opacity 0.15以下)

---

## 7. 光学表現

### 7.1 ブラックホール本体は描画しない

### 7.2 微弱リング

* 最大歪曲時のみ
* opacity 0.05以下
* ぼかし弱

目的：物理的印象の付与

---

## 8. アニメーション改善

### 8.1 構成（4秒ループ）

1. 静止 (1秒)
2. 密度収束演出 (0.6秒)
3. 歪曲発生 (0.8秒)
4. 最大歪曲ホールド (0.8秒)
5. 復元 (0.8秒)

### 8.2 イージング

```
cubic-bezier(0.4, 0.0, 0.2, 1)
```

---

## 9. タイポグラフィ調整

テキスト：

"Your commits bend spacetime."

* 位置: 右下固定
* font-family: Inter, system-ui
* font-weight: 300
* letter-spacing: 0.08em
* opacity: 0.35
* size: 10px

テキストは説明ではなく余韻とする

---

## 10. 非機能要件

* GIF容量2MB以下
* SVG互換
* README背景とのコントラスト確保
* 過度なSF表現を避ける

---

## 11. 禁止事項

* 強いグロー
* 黒丸ブラックホール描画
* 激しい色変化
* 過剰なパーティクル

---

## 12. 成功基準

* 一見GitHub草と認識できる
* しかし明確に歪んでいる
* 上品で静かな異常感がある
* 説明なしでも違和感が伝わる

---

## 13. ライセンス

MIT
