# テーマ

[English](themes.md)

6つのビルトインテーマ。`--theme <名前>` で選択。

---

## `github`

デフォルト。クラシックなGitHubダークグリーン。

```bash
--theme github
```

![github](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-github.svg)

---

## `deep-space`

深い青の宇宙パレット。ワープ効果が強く、ピーク輝度も高い。

```bash
--theme deep-space
```

![deep-space](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-deep-space.svg)

---

## `monochrome`

グレースケールのミニマリズム。色よりも形。

```bash
--theme monochrome
```

![monochrome](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-monochrome.svg)

---

## `solar-flare`

暖かい赤橙トーン。強烈なワープ効果。

```bash
--theme solar-flare
```

![solar-flare](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-solar-flare.svg)

---

## `event-horizon`

ほぼ真っ黒。異常点がグリッドを歪めるまで、ほとんど見えない。

```bash
--theme event-horizon
```

![event-horizon](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-event-horizon.svg)

---

## `paper-light`

ライト背景。GitHubのライトモードに対応。

```bash
--theme paper-light
```

![paper-light](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-paper-light.svg)

---

## 後方互換性

レガシー名 `dark` / `light` も使用可能：

| レガシー | マッピング先 |
|---------|------------|
| `dark` | `github` |
| `light` | `paper-light` |

## ローカルでプレビュー生成

```bash
node dist/cli.js --demo --theme <名前>
```

`--demo` ならGitHubトークン不要。
