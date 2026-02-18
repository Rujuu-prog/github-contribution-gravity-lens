# Themes

[Japanese / 日本語](themes_ja.md)

6 built-in themes. Use `--theme <name>` to select.

---

## `github`

Default theme. The classic GitHub dark green palette.

```bash
--theme github
```

![github](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-github.svg)

---

## `deep-space`

Deep blue cosmic palette. Stronger warp and brighter peaks.

```bash
--theme deep-space
```

![deep-space](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-deep-space.svg)

---

## `monochrome`

Grayscale minimalism. Form over color.

```bash
--theme monochrome
```

![monochrome](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-monochrome.svg)

---

## `solar-flare`

Warm red-orange tones. Intense warp effects.

```bash
--theme solar-flare
```

![solar-flare](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-solar-flare.svg)

---

## `event-horizon`

Near-black. The grid is barely visible — until anomalies distort it.

```bash
--theme event-horizon
```

![event-horizon](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-event-horizon.svg)

---

## `paper-light`

Light background. Matches GitHub's light mode.

```bash
--theme paper-light
```

![paper-light](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-paper-light.svg)

---

## Backward Compatibility

Legacy names `dark` and `light` still work:

| Legacy | Maps To |
|--------|---------|
| `dark` | `github` |
| `light` | `paper-light` |

## Generate Previews Locally

```bash
node dist/cli.js --demo --theme <name>
```

No GitHub token required with `--demo`.
