# Tutorial: Refactoring Existing Styles to Use Design Tokens

This step-by-step tutorial shows you how to refactor an existing component to use the Git-Stars design system.

## Before: Ad-hoc Styles

Let's start with a typical component using hard-coded values:

```css
.notification {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: "Roboto", Arial, sans-serif;
  color: #1f2937;
}

.notification--success {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}

.notification--error {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
}

.notification__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}

.notification__message {
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.notification__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #9ca3af;
}

.notification__close:hover {
  color: #1f2937;
}
```

## Step 1: Identify Token Opportunities

Before refactoring, map hard-coded values to design tokens:

| Hard-coded Value | Design Token | Category |
|------------------|--------------|----------|
| `#ffffff` | `var(--color-surface)` | Color |
| `#e5e7eb` | `var(--color-surface-border)` | Color |
| `8px` | `var(--radius-2)` | Border radius |
| `16px` | `var(--space-4)` | Spacing |
| `20px` | `var(--space-5)` | Spacing |
| `12px` | `var(--space-3)` | Spacing |
| `0 2px 8px rgba(...)` | `var(--shadow-2)` | Shadow |
| `"Roboto", Arial...` | `var(--font-sans)` | Typography |
| `#1f2937` | `var(--color-text-primary)` | Color |
| `#10b981` | `var(--color-success)` | Color |
| `#ef4444` | `var(--color-danger)` | Color |
| `16px` | `var(--step-0)` | Font size |
| `14px` | `var(--step--1)` | Font size |
| `#6b7280` | `var(--color-text-secondary)` | Color |

## Step 2: Refactor Core Styles

Replace hard-coded values with tokens:

```css
.notification {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-2);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-3);
  box-shadow: var(--shadow-2);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}
```

## Step 3: Refactor Variants

Update success and error variants:

```css
.notification--success {
  border-left: 4px solid var(--color-success);
  background: var(--color-surface-hover); /* or keep custom if needed */
}

.notification--error {
  border-left: 4px solid var(--color-danger);
  background: var(--color-surface-hover);
}
```

## Step 4: Refactor Typography

Update font sizes and colors:

```css
.notification__title {
  font-size: var(--step-0);
  font-weight: 700;
  margin: 0 0 var(--space-2);
}

.notification__message {
  font-size: var(--step--1);
  line-height: 1.5;
  color: var(--color-text-secondary);
}
```

## Step 5: Refactor Interactive Elements

Update button styles:

```css
.notification__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.notification__close:hover {
  color: var(--color-text-primary);
}

.notification__close:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

## After: Token-Based Styles

Here's the complete refactored component:

```css
.notification {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-2);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-3);
  box-shadow: var(--shadow-2);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.notification--success {
  border-left: 4px solid var(--color-success);
  background: var(--color-surface-hover);
}

.notification--error {
  border-left: 4px solid var(--color-danger);
  background: var(--color-surface-hover);
}

.notification__title {
  font-size: var(--step-0);
  font-weight: 700;
  margin: 0 0 var(--space-2);
}

.notification__message {
  font-size: var(--step--1);
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.notification__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.notification__close:hover {
  color: var(--color-text-primary);
}

.notification__close:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

## Benefits Gained

✅ **Theme Support**: Automatically adapts to light/dark/high-contrast modes  
✅ **Consistency**: Uses same spacing, colors, shadows as rest of app  
✅ **Maintainability**: Change tokens globally, not per-component  
✅ **Accessibility**: Built-in focus states and semantic colors  
✅ **Responsive**: Fluid typography scales naturally

## Common Pitfalls

### ❌ Don't use tokens for everything

Some values should remain hard-coded:

```css
/* ❌ Over-tokenization */
.icon {
  width: var(--space-5);  /* Bad: size has semantic meaning */
}

/* ✅ Keep semantic values hard-coded */
.icon {
  width: 24px;  /* Icon size, not spacing */
}
```

### ❌ Don't break theming

Avoid mixing tokens with hard-coded colors:

```css
/* ❌ Mixed approach breaks themes */
.button {
  background: var(--color-accent);
  color: #ffffff;  /* Won't adapt to dark theme! */
}

/* ✅ Consistent token usage */
.button {
  background: var(--color-accent);
  color: var(--color-bg);  /* Contrasts in all themes */
}
```

### ❌ Don't use wrong token categories

```css
/* ❌ Using spacing for font sizes */
.text {
  font-size: var(--space-4);  /* Wrong! Use --step-* */
}

/* ✅ Use correct category */
.text {
  font-size: var(--step-0);
}
```

## Practice Exercise

Try refactoring this card component on your own:

```css
.product-card {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.product-card__image {
  border-radius: 8px;
  margin-bottom: 16px;
}

.product-card__title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #111827;
}

.product-card__price {
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 12px;
}

.product-card__description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}
```

<details>
<summary>Click to see the solution</summary>

```css
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-3);
  padding: var(--space-6);
  box-shadow: var(--shadow-3);
}

.product-card__image {
  border-radius: var(--radius-2);
  margin-bottom: var(--space-4);
}

.product-card__title {
  font-size: var(--step-1);
  font-weight: 600;
  margin: 0 0 var(--space-2);
  color: var(--color-text-primary);
}

.product-card__price {
  font-size: var(--step-3);
  font-weight: 700;
  color: var(--color-success);
  margin-bottom: var(--space-3);
}

.product-card__description {
  font-size: var(--step--1);
  color: var(--color-text-secondary);
  line-height: 1.6;
}
```

</details>

## Next Steps

- Apply these techniques to your own components
- Review the [Token Reference](../reference/tokens.md) for all available tokens
- Read [Design Decisions](../explanation/design-decisions.md) to understand the "why"
