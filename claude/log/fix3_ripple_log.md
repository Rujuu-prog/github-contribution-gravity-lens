# fix3 波紋エフェクト（Ripple Effect）実装ログ

## 概要
異常点を震源とした波紋エフェクトを実装。近いセルから順にワープが広がり、復元時は逆に外側から波が引いていく。

## Round 1: computeWarpDelay (gravity.ts)
- テスト7件追加 → 全パス
- 各セルの最近接異常点への距離をRで正規化して0-1のdelayRatioを返す
- 異常点自身=0, R外=0, R内=dist/R

## Round 2: getWarpProgressWithDelay (animation.ts)
- テスト9件追加 → 全パス
- Phase 3: warpStart = 0.275 + delay * 0.195 から 0.60 まで
- Phase 5: 0.675 から restoreEnd = 1.00 - delay * 0.195 まで（逆波紋）

## Round 3: getBrightnessProgressWithDelay (animation.ts)
- テスト6件追加 → 全パス
- Phase 2: brightStart = 0.20 + delay * 0.06 から 0.275 まで
- Phase 5: warpと同じ restoreEnd

## Round 4: render-gif.ts 波紋統合
- ループ外で maxWarpedCells + warpDelays を事前計算
- フレーム内でセルごとに WithDelay 関数で補間
- 既存5テスト全パス

## Round 5: render-svg.ts 波紋統合
- キーフレーム百分率をセルごとに動的計算
- warpStartPct, restoreEndPct, brightStartPct をdelayから算出
- テスト修正+2件追加 → 21テスト全パス

## Round 6: index.ts エクスポート + 全テスト確認
- computeWarpDelay, getWarpProgressWithDelay, getBrightnessProgressWithDelay エクスポート
- 全211テスト通過

## 結果
- 新関数3つ: computeWarpDelay, getWarpProgressWithDelay, getBrightnessProgressWithDelay
- テスト: 187 → 211 (+24)
- 変更ファイル: gravity.ts, animation.ts, render-gif.ts, render-svg.ts, index.ts + テスト3ファイル
