# Git-Stars Design System

> Research-driven, accessible, themeable design system for the Git-Stars application.

**Version**: 0.1.0
**Standards**: WCAG 2.2 Level AA
**License**: ISC

---

## Features

✅ **Role-based design tokens** — Single source of truth for colors, spacing, typography
✅ **OKLCH color space** — Perceptual uniformity, better dark mode
✅ **Light/Dark/High-Contrast themes** — Automatic system preference detection
✅ **Fluid typography** — Responsive type scale with `clamp()`
✅ **4px spacing scale** — Systematic, harmonious spacing
✅ **Accessible by default** — WCAG 2.2 AA compliant, keyboard-first
✅ **Modern CSS** — Cascade layers, container queries, custom properties
✅ **Framework-agnostic** — Works with vanilla JS, React, Vue, etc.
✅ **Zero dependencies** — No external runtime, CSS-only theming

---

## Quick Start

### 1. Install

The design system is located in `shared/design-system/` and imported directly into the app.

### 2. Import

```html
<!-- In your HTML -->
<link rel="stylesheet" href="/shared/design-system/src/index.css">
```

Or in your JavaScript/CSS:

```js
// Vite/Webpack/esbuild
import '/shared/design-system/src/index.css';
```

### 3. Apply Theme

```html
<html data-theme="light"> <!-- or "dark", "hc" -->
  <body>
    <h1>Hello World</h1>
    <button class="btn primary">Click me</button>
  </body>
</html>
```

**System Preference**: If `data-theme` is omitted, the design system respects `prefers-color-scheme`.

---

## Usage

### Typography

```html
<h1>Heading 1</h1> <!-- Fluid: 40–44px -->
<h2>Heading 2</h2> <!-- Fluid: 33–37px -->
<p>Body text</p>  <!-- Fluid: 16–18px -->
<small>Caption</small> <!-- Fluid: 13–15px -->
```

### Buttons

```html
<button class="btn">Default</button>
<button class="btn primary">Primary</button>
<button class="btn secondary">Secondary</button>
<button class="btn danger">Danger</button>
<button class="btn" disabled>Disabled</button>

<!-- Icon button -->
<button class="icon-btn" aria-label="Settings">
  <i class="fa fa-cog"></i>
</button>
```

### Forms

```html
<div class="field">
  <label for="email" class="label">Email</label>
  <input type="email" id="email" class="input" placeholder="you@example.com">
  <span class="help">We'll never share your email</span>
</div>

<!-- With error -->
<div class="field error">
  <label for="password" class="label">Password</label>
  <input type="password" id="password" class="input">
  <span class="error-message">Password must be at least 8 characters</span>
</div>

<!-- Select -->
<select class="select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

<!-- Checkbox/Radio -->
<label class="checkbox">
  <input type="checkbox">
  <span>I agree to the terms</span>
</label>
```

### Layout

```html
<!-- Container -->
<div class="container">
  <h1>Content</h1>
</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>

<!-- Auto-fit grid (cards) -->
<div class="grid-auto">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <!-- Automatically calculates columns -->
</div>

<!-- Stack (vertical spacing) -->
<div class="stack">
  <h2>Title</h2>
  <p>Paragraph automatically spaced</p>
  <button class="btn">Action</button>
</div>

<!-- Cluster (horizontal wrapping) -->
<div class="cluster">
  <span class="badge">Tag 1</span>
  <span class="badge">Tag 2</span>
  <span class="badge">Tag 3</span>
</div>
```

### Cards

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card description with content</p>
  <button class="btn primary">Action</button>
</div>
```

### Navigation

```html
<!-- Nav bar -->
<nav class="nav">
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
  <a href="/docs">Docs</a>
</nav>

<!-- Breadcrumbs -->
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="separator">/</span>
  <a href="/docs">Docs</a>
  <span class="separator">/</span>
  <span aria-current="page">Getting Started</span>
</nav>

<!-- Tabs -->
<div class="tabs" role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
  <button role="tab" aria-selected="false">Tab 3</button>
</div>
```

---

## Theming

### Switching Themes

```js
// JavaScript
document.documentElement.setAttribute('data-theme', 'dark');

// Or toggle based on system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
```

### Available Themes

| Theme | Value | Use Case |
|-------|-------|----------|
| **Light** | `data-theme="light"` | Default, bright backgrounds |
| **Dark** | `data-theme="dark"` | Low-light environments |
| **High-Contrast** | `data-theme="hc"` | Accessibility, visual impairments |

### Creating Custom Themes

Override color tokens in your own CSS:

```css
[data-theme="custom"] {
  --color-bg: oklch(95% 0.05 180);
  --color-accent: oklch(60% 0.20 320);
  /* ... other tokens */
}
```

---

## Design Tokens

All design decisions are centralized in `tokens.design.json`. To modify tokens:

1. Edit `tokens.design.json`
2. Run `node scripts/build-tokens.mjs`
3. The CSS will be regenerated automatically

### Available Tokens

#### Colors
```css
var(--color-bg)              /* Background */
var(--color-surface)         /* Cards, panels */
var(--color-surface-border)  /* Borders */
var(--color-text-primary)    /* Body text */
var(--color-text-secondary)  /* Meta text */
var(--color-text-tertiary)   /* Disabled text */
var(--color-accent)          /* Links, primary buttons */
var(--color-focus-ring)      /* Focus indicators */
var(--color-success)         /* Success states */
var(--color-warning)         /* Warning states */
var(--color-danger)          /* Error states */
var(--color-info)            /* Info states */
```

#### Spacing (4px base unit)
```css
var(--space-0)  /* 0 */
var(--space-1)  /* 4px */
var(--space-2)  /* 8px */
var(--space-3)  /* 12px */
var(--space-4)  /* 16px */
var(--space-5)  /* 24px */
var(--space-6)  /* 32px */
var(--space-7)  /* 40px */
var(--space-8)  /* 56px */
var(--space-9)  /* 72px */
```

#### Typography
```css
var(--font-sans)     /* System font stack */
var(--font-mono)     /* Monospace font stack */

var(--step--2)       /* 11–13px (fine print) */
var(--step--1)       /* 13–15px (caption) */
var(--step-0)        /* 16–18px (body) */
var(--step-1)        /* 19–21px (large body) */
var(--step-2)        /* 23–26px (h4) */
var(--step-3)        /* 28–31px (h3) */
var(--step-4)        /* 33–37px (h2) */
var(--step-5)        /* 40–44px (h1) */
var(--step-6)        /* 48–53px (display) */
```

#### Radius
```css
var(--radius-0)     /* 0 (sharp) */
var(--radius-1)     /* 4px (subtle) */
var(--radius-2)     /* 8px (buttons, inputs) */
var(--radius-3)     /* 12px (cards) */
var(--radius-4)     /* 16px (panels) */
var(--radius-full)  /* 9999px (pills, badges) */
```

#### Shadows
```css
var(--shadow-0)  /* None */
var(--shadow-1)  /* Subtle (cards) */
var(--shadow-2)  /* Card hover */
var(--shadow-3)  /* Floating */
var(--shadow-4)  /* Modals */
```

#### Z-Index
```css
var(--z-base)           /* 0 */
var(--z-dropdown)       /* 100 */
var(--z-sticky)         /* 200 */
var(--z-fixed)          /* 300 */
var(--z-modal-backdrop) /* 400 */
var(--z-modal)          /* 500 */
var(--z-popover)        /* 600 */
var(--z-tooltip)        /* 700 */
```

---

## Accessibility

### Built-in Features

✅ **Color Contrast**: All text/background combinations tested at WCAG AA (4.5:1 minimum)
✅ **Focus Indicators**: 2px offset outline with high contrast
✅ **Touch Targets**: Minimum 44px height on buttons and inputs
✅ **Reduced Motion**: Respects `prefers-reduced-motion`
✅ **Semantic HTML**: Component examples use correct elements
✅ **Keyboard Navigation**: Full tab order, Escape key support
✅ **Screen Reader Support**: ARIA labels, roles, live regions

### Utilities

```html
<!-- Screen reader only -->
<span class="sr-only">Hidden from visual users, read by screen readers</span>

<!-- Skip link (shows on focus) -->
<a href="#main" class="skip-link">Skip to main content</a>
```

---

## Browser Support

### Baseline
- **Chrome**: 99+ (cascade layers)
- **Safari**: 15.4+ (cascade layers)
- **Firefox**: 97+ (cascade layers)
- **Edge**: 99+

**Global Support**: ~94%

### Fallback
For older browsers, CSS gracefully degrades:
- Cascade layers ignored (styles still apply)
- OKLCH falls back to sRGB
- Container queries progressive enhancement

---

## Performance

- **CSS Bundle Size**: ~15 KB gzipped (all themes)
- **Zero JavaScript**: CSS-only theming
- **System Fonts**: No web font loading delay
- **Tree-Shakeable**: Import only what you need

---

## Development

### Build Tokens
```bash
node scripts/build-tokens.mjs
```

### Watch Mode (future)
```bash
npm run watch:tokens
```

---

## Architecture

See [ADR-0001](/design/system/adr/ADR-0001-design-system-architecture.md) for architectural decisions.

**Cascade Layers**:
```
@layer reset, tokens, base, components, utilities;
```

This ensures utilities always override components, which always override base styles.

---

## Migration Guide

### From Old Themes

**Before**:
```css
.card {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
}
```

**After**:
```css
.card {
  background: var(--color-surface);
  padding: var(--space-5);
  border-radius: var(--radius-3);
}
```

---

## Contributing

1. **Research First**: All design decisions documented in `/design/research/`
2. **Update Tokens**: Edit `tokens.design.json`, not CSS directly
3. **Run Build**: `node scripts/build-tokens.mjs` after token changes
4. **Test Accessibility**: Verify WCAG AA compliance with Axe DevTools
5. **Document**: Update this README and relevant docs

---

## License

ISC © Git-Stars Contributors

---

## Resources

- [Design Tokens](/design/research/)
- [Accessibility Assessment](/design/research/05_a11y_assessment.md)
- [Typography Research](/design/research/03_typography.md)
- [Layout & Grid](/design/research/04_layout_grid.md)
- [Competitive Analysis](/design/research/02_competitive.md)
