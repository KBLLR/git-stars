# Design System Architecture & Decisions

This document explains the key architectural decisions and rationale behind the Git-Stars design system.

## Why OKLCH Color Space?

We use OKLCH (Oklab Lightness Chroma Hue) instead of traditional RGB or HSL:

### Benefits

1. **Perceptually Uniform**: Equal numerical changes produce equal perceived color differences
2. **Predictable Lightness**: 50% lightness looks consistently medium across all hues
3. **Future-Proof**: Native browser support, no compilation needed
4. **Wide Gamut**: Supports P3 and beyond for modern displays
5. **Accessibility**: Easier to ensure consistent contrast ratios

### Example

```css
/* Traditional HSL - inconsistent perceived brightness */
--blue: hsl(220, 80%, 50%);   /* Appears darker */
--yellow: hsl(60, 80%, 50%);  /* Appears brighter */

/* OKLCH - consistent perceived brightness */
--blue: oklch(65% 0.16 230);    /* L=65% */
--yellow: oklch(65% 0.16 110);  /* L=65% - same lightness! */
```

## Role-Based Tokens

We use semantic/role-based tokens rather than generic color names:

```css
/* ❌ Generic (bad) */
--blue-500: oklch(65% 0.16 230);

/* ✅ Role-based (good) */
--color-accent: oklch(65% 0.16 230);
```

### Why?

- **Semantic Meaning**: `--color-accent` communicates purpose, not implementation
- **Theme Flexibility**: Can change the actual color without updating usage
- **Maintainability**: Easier to understand and refactor
- **Consistency**: Ensures consistent use across the app

## CSS Layers

We use `@layer` to control specificity and cascade order:

```css
@layer reset, tokens, base, components, utilities;
```

### Layer Purposes

1. **reset**: Normalize browser defaults (lowest specificity)
2. **tokens**: CSS custom properties
3. **base**: Element-level styles (body, h1-h6, a, etc.)
4. **components**: Component classes (.btn, .card, etc.)
5. **utilities**: Utility classes (.container, .grid, etc.) - highest specificity

### Benefits

- Predictable cascade without `!important`
- Easy to override in consuming applications
- Clear separation of concerns
- Future-proof architecture

## Fluid Typography

We use `clamp()` for responsive type scaling:

```css
--step-0: clamp(1.00rem, 0.95rem + 0.25vw, 1.12rem);
```

### Why Clamp?

- **No Media Queries**: Smoothly scales between breakpoints
- **Accessibility**: Respects user font-size preferences
- **Performance**: Calculated by browser, no JS needed
- **Maintainability**: Single source of truth per size

## Spacing Scale

Our 0-9 spacing scale follows a harmonious progression:

```
0px → 4px → 8px → 12px → 16px → 24px → 32px → 40px → 56px → 72px
```

### Rationale

- **Base-4 System**: Aligns with common design grids
- **Logical Progression**: Each step has clear use cases
- **Limited Options**: Prevents arbitrary spacing values
- **Muscle Memory**: Designers/developers learn the scale quickly

## Theming Approach

We support three modes: light, dark, and high-contrast.

### System Preference Detection

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* Auto dark mode */
  }
}
```

### Manual Override

```html
<html data-theme="dark">
```

### Benefits

- **User Choice**: Respect system preference or allow manual control
- **Accessibility**: High-contrast mode for users with low vision
- **Future Modes**: Easy to add custom brand themes

## Component Philosophy

### Minimal Component Set

We provide primitives, not full-featured components:

- ✅ `.btn` - Basic button styling
- ✅ `.card` - Basic card container
- ❌ No complex `.carousel`, `.datepicker`, etc.

### Why Minimal?

1. **Framework Agnostic**: Works with React, Vue, vanilla JS
2. **Composition Over Complexity**: Build complex UIs from simple pieces
3. **Smaller Bundle**: Less unused CSS
4. **Flexibility**: Easy to customize without fighting opinions

## Utility Classes

We include layout utilities for common patterns:

```css
.container { /* max-width container */ }
.grid { /* CSS grid */ }
.row { /* flexbox row */ }
.stack { /* vertical rhythm */ }
```

### When to Use Utilities?

- **Frequent Patterns**: Layouts used across many pages
- **Prototyping**: Quick mockups and experiments
- **One-offs**: Simple layouts that don't warrant a component

### When NOT to Use?

- **Complex Components**: Create dedicated classes instead
- **Excessive Nesting**: Prefer semantic component classes

## Accessibility First

### Built-in A11y Features

1. **Focus Indicators**: Visible `:focus-visible` outlines
2. **Color Contrast**: All color pairs meet WCAG AA (4.5:1 text, 3:1 UI)
3. **Reduced Motion**: Respects `prefers-reduced-motion`
4. **Semantic HTML**: Encourages proper markup
5. **Screen Reader Classes**: `.sr-only` utility

### Testing Approach

- Automated: axe-core, Lighthouse CI
- Manual: Keyboard navigation, screen reader testing
- Continuous: Integrate into CI/CD pipeline

## Performance Considerations

### CSS Size

- **Minimal Footprint**: ~15KB uncompressed
- **Tree-Shakeable**: Import only what you need
- **No Runtime JS**: Pure CSS solution

### Build Process

- **One-Time Build**: `npm run build:tokens` generates CSS
- **No PostCSS Required**: Native CSS features only
- **Fast Iteration**: Change JSON, rebuild, done

## Versioning Strategy

We use semantic versioning:

- **Major (1.0.0)**: Breaking changes to token names or structure
- **Minor (0.1.0)**: New tokens, non-breaking additions
- **Patch (0.0.1)**: Bug fixes, documentation updates

## Future Roadmap

### Planned Enhancements

1. **Visual Regression Testing**: Automated screenshot comparison
2. **Design Tool Integration**: Export tokens to Figma/Sketch
3. **Expanded Components**: Tables, tabs, tooltips, modals
4. **Animation Primitives**: Reusable transitions and keyframes
5. **CSS Container Queries**: Enhanced responsive utilities

### Non-Goals

- **Framework-Specific Wrappers**: Remain framework-agnostic
- **JavaScript Components**: CSS-only, no behavior
- **Every Possible Variant**: Focus on core use cases

## Contributing

When extending the design system:

1. **Check Existing Tokens**: Can you use what's there?
2. **Propose New Tokens**: Open an issue first
3. **Update Documentation**: Document new additions
4. **Test Accessibility**: Run automated and manual tests
5. **Update Changelog**: Note changes for versioning

## References

- [OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Fluid Typography](https://modern-fluid-typography.vercel.app/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
