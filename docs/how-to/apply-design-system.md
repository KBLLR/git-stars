# How to Apply the Design System

This guide explains how to integrate and use the Git-Stars design system in your application.

## Quick Start

### 1. Import the Design System

Add this import to your main CSS file (e.g., `src/frontend/css/index.css`):

```css
@import url("../../../shared/design-system/src/index.css");
```

Or, if using Vite/Webpack, you can import it in your JavaScript entry point:

```javascript
import '../../../shared/design-system/src/index.css';
```

### 2. Build Tokens

The design system uses a build step to convert `tokens.design.json` into CSS custom properties:

```bash
npm run build:tokens
```

This generates the theme variables in `shared/design-system/src/styles/themes.css`.

### 3. Apply Theme Attribute

Control the theme by setting a `data-theme` attribute on the `<html>` or `<body>` element:

```html
<!-- Light theme (explicit) -->
<html data-theme="light">

<!-- Dark theme -->
<html data-theme="dark">

<!-- High-contrast theme -->
<html data-theme="hc">

<!-- Auto (follows system preference) -->
<html>
```

## Using Design Tokens

### Color Tokens

Replace hard-coded colors with semantic color tokens:

```css
/* Before */
.card {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
}

/* After */
.card {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-surface-border);
}
```

See the [Token Reference](../reference/tokens.md) for a complete list.

## Next Steps

- Review the [Token Reference](../reference/tokens.md)
- Read the [Design Decisions](../explanation/design-decisions.md)
- Try the [Tutorial](../tutorials/refactoring-styles.md)
