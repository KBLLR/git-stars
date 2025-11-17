# How-To: Apply the Design System

**Goal**: Learn how to use the Git-Stars design system in your pages and components.

---

## Prerequisites

- Design system files in `/shared/design-system/`
- Basic knowledge of HTML and CSS
- Vite build setup (already configured)

---

## Step 1: Import the Design System

### Option A: In HTML (Static Pages)

Add to your `<head>`:

```html
<link rel="stylesheet" href="/shared/design-system/src/index.css">
```

### Option B: In JavaScript (Vite/Webpack)

Import in your entry file (e.g., `main.js`):

```js
import '/shared/design-system/src/index.css';
```

---

## Step 2: Set the Theme

Add `data-theme` attribute to `<html>` or `<body>`:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Git Stars</title>
  <link rel="stylesheet" href="/shared/design-system/src/index.css">
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

### Available Themes

- `data-theme="light"` — Light mode (default)
- `data-theme="dark"` — Dark mode
- `data-theme="hc"` — High-contrast mode

### Automatic Theme Detection

If you omit `data-theme`, the system respects the user's OS preference (`prefers-color-scheme`).

---

## Step 3: Use Design Tokens

Replace hardcoded values with CSS custom properties:

### Before (Hardcoded)
```css
.my-card {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
```

### After (Design Tokens)
```css
.my-card {
  background: var(--color-surface);
  padding: var(--space-5);
  border-radius: var(--radius-3);
  box-shadow: var(--shadow-1);
}
```

**Benefits**:
- Automatic theming (light/dark/high-contrast)
- Consistent spacing
- Easier maintenance

---

## Step 4: Apply Utility Classes

### Layout Example

```html
<div class="container">
  <div class="stack">
    <h1>Welcome to Git Stars</h1>
    <p>Organize your starred repositories with ease.</p>
    <button class="btn primary">Get Started</button>
  </div>
</div>
```

**Result**:
- `.container` — Centers content, max-width 1200px
- `.stack` — Adds vertical spacing between children
- `.btn.primary` — Primary button with accessible sizing

### Grid Example

```html
<div class="grid-auto">
  <div class="card">
    <h3>Repository 1</h3>
    <p>Description of the repository</p>
  </div>
  <div class="card">
    <h3>Repository 2</h3>
    <p>Description of the repository</p>
  </div>
  <div class="card">
    <h3>Repository 3</h3>
    <p>Description of the repository</p>
  </div>
</div>
```

**Result**: Responsive grid that automatically calculates columns based on available width.

---

## Step 5: Build Components

### Button

```html
<!-- Default -->
<button class="btn">Cancel</button>

<!-- Primary -->
<button class="btn primary">Save</button>

<!-- Danger -->
<button class="btn danger">Delete</button>

<!-- Disabled -->
<button class="btn" disabled>Disabled</button>

<!-- Icon button -->
<button class="icon-btn" aria-label="Settings">
  <i class="fa fa-cog"></i>
</button>
```

### Form Field

```html
<div class="field">
  <label for="email" class="label">Email Address</label>
  <input type="email" id="email" class="input" placeholder="you@example.com">
  <span class="help">We'll never share your email with anyone</span>
</div>
```

### Card

```html
<div class="card">
  <h3>Card Title</h3>
  <p class="text-secondary">This is a card description with semantic colors.</p>
  <div class="cluster">
    <span class="badge">Tag 1</span>
    <span class="badge accent">Tag 2</span>
  </div>
</div>
```

---

## Step 6: Theme Switching (JavaScript)

Add a theme toggle button:

```html
<button id="themeToggle" class="btn">Toggle Dark Mode</button>

<script>
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // Load saved theme on page load
  const saved = localStorage.getItem('theme');
  if (saved) {
    html.setAttribute('data-theme', saved);
  }
</script>
```

---

## Step 7: Accessibility Checklist

✅ **Add Skip Link**:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

✅ **Use Semantic HTML**:
```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main" id="main-content">...</main>
```

✅ **Label All Form Inputs**:
```html
<label for="username">Username</label>
<input type="text" id="username" class="input">
```

✅ **Provide ARIA Labels for Icon Buttons**:
```html
<button class="icon-btn" aria-label="Close panel">
  <i class="fa fa-times"></i>
</button>
```

---

## Step 8: Common Patterns

### Sticky Header

```css
.main-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-surface-border);
}
```

### Modal Overlay

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: oklch(0% 0 0 / 0.5);
  z-index: var(--z-modal-backdrop);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-surface);
  border-radius: var(--radius-4);
  box-shadow: var(--shadow-4);
  padding: var(--space-6);
  z-index: var(--z-modal);
}
```

### Responsive Navigation

```html
<nav class="nav">
  <a href="/" aria-current="page">Home</a>
  <a href="/docs">Docs</a>
  <a href="/about">About</a>
</nav>
```

---

## Troubleshooting

### Theme Not Applying

**Problem**: Colors don't change when switching themes.

**Solution**: Ensure you're using CSS custom properties, not hardcoded values.

```css
/* ❌ Wrong */
.card {
  background: #fff;
}

/* ✅ Correct */
.card {
  background: var(--color-surface);
}
```

### OKLCH Not Supported

**Problem**: Colors look wrong in older browsers.

**Solution**: OKLCH gracefully degrades to sRGB. If critical, add fallback:

```css
.card {
  background: #ffffff; /* Fallback */
  background: var(--color-surface); /* OKLCH */
}
```

### Focus Indicators Not Visible

**Problem**: Focus outlines not showing.

**Solution**: Ensure `:focus-visible` is not being overridden. Check for:

```css
/* Remove this if present */
*:focus {
  outline: none;
}
```

---

## Next Steps

- **Read Reference**: [Token Reference](/docs/reference/tokens.md)
- **Understand Why**: [Rationale & Decisions](/docs/explanation/rationale.md)
- **Learn More**: [Getting Started Tutorial](/docs/tutorials/getting-started-design.md)

---

**Questions?** See the [Design System README](/shared/design-system/README.md) or open an issue.
