# ADR-0001: Design System Architecture

**Date**: 2025-11-17
**Status**: Accepted
**Deciders**: Design Engineering Agent
**Context**: Git-Stars Design System MVP

---

## Context and Problem Statement

Git-Stars currently employs a **theme-based CSS architecture** with six visual themes applied via body classes. While functional, this approach suffers from:
- **Maintenance overhead**: 60+ hardcoded color values duplicated across themes
- **No design tokens**: Colors, spacing, typography defined ad-hoc
- **Accessibility gaps**: Inconsistent contrast ratios, no reduced-motion support
- **Scalability issues**: Adding new themes or updating brand colors requires editing multiple files

**Decision**: How should we architect a maintainable, accessible, and scalable design system for Git-Stars?

---

## Decision Drivers

1. **Maintainability**: Single source of truth for design decisions
2. **Accessibility**: WCAG 2.2 AA compliance by default
3. **Performance**: Minimal CSS bundle size (<60 KB gzipped)
4. **Developer Experience**: Easy to apply, hard to misuse
5. **Future-Proofing**: Support light/dark/high-contrast modes without code duplication
6. **Framework Agnostic**: Works with vanilla JS, React, Vue, etc.

---

## Considered Options

### Option 1: Continue Body Class Themes
**Approach**: Enhance current system with CSS variables

**Pros**:
- ✅ Minimal refactor
- ✅ Familiar to team

**Cons**:
- ❌ High specificity (`.retro .repo-card`)
- ❌ Duplication across theme files
- ❌ No dark mode
- ❌ Difficult to ensure accessibility

**Verdict**: ❌ **Rejected** — Technical debt outweighs migration cost

---

### Option 2: Utility-First (Tailwind-style)
**Approach**: Atomic CSS classes for every style

**Pros**:
- ✅ No custom CSS needed
- ✅ Tree-shakeable
- ✅ Enforced consistency

**Cons**:
- ❌ Verbose HTML (`class="p-4 bg-white rounded-lg shadow-md..."`)
- ❌ Requires build tooling (Tailwind compiler)
- ❌ Learning curve for non-Tailwind users
- ❌ Harder to theme dynamically

**Verdict**: ❌ **Rejected** — Too prescriptive for our use case

---

### Option 3: CSS-in-JS (Styled Components, Emotion)
**Approach**: Scoped component styles in JavaScript

**Pros**:
- ✅ Component encapsulation
- ✅ Dynamic theming via JS

**Cons**:
- ❌ Framework lock-in (React, Vue)
- ❌ Runtime overhead
- ❌ Violates "framework-agnostic" requirement

**Verdict**: ❌ **Rejected** — Not suitable for vanilla JS app

---

### Option 4: Design Token System + Cascade Layers (CHOSEN)
**Approach**: Role-based CSS custom properties with cascade layers for specificity control

**Architecture**:
```
@layer reset, tokens, base, components, utilities;
```

**Pros**:
- ✅ **Single source of truth**: tokens.design.json → CSS variables
- ✅ **Explicit specificity**: Layers prevent cascade conflicts
- ✅ **Theme switching**: Change data-theme attribute, tokens update
- ✅ **Accessibility**: Tokens verified for contrast before implementation
- ✅ **Performance**: Minimal JS, CSS-only theming
- ✅ **Framework-agnostic**: Works with any stack
- ✅ **Modern**: Leverages OKLCH, container queries, fluid typography

**Cons**:
- ⚠️ **Browser support**: Cascade layers (Chrome 99+, Safari 15.4+, Firefox 97+) — 94% global support
- ⚠️ **Initial setup**: Requires token build script

**Verdict**: ✅ **ACCEPTED**

---

## Decision

### Architecture: Design Token System with Cascade Layers

#### 1. **Token Taxonomy**

**Roles, not primitives**:
```
brand.default.oklch.bg → roles.color.light.bg → --color-bg
```

**Token Structure**:
- **Brand**: Raw color values (OKLCH for perceptual uniformity)
- **Roles**: Semantic mappings (bg, surface, text-primary, accent, etc.)
- **Modes**: light, dark, hc (high-contrast)

**File**: `shared/design-system/tokens.design.json`

#### 2. **CSS Architecture**

**Cascade Layers**:
```css
@layer reset, tokens, base, components, utilities;
```

- **reset**: Normalize browser defaults
- **tokens**: CSS custom properties from design tokens
- **base**: Element selectors (body, h1, p)
- **components**: Component classes (.btn, .card, .nav)
- **utilities**: Utility classes (.stack, .cluster, .sr-only)

**Specificity Control**: Later layers win over earlier layers, regardless of source order.

#### 3. **Color System**

**OKLCH** (not HSL/RGB):
- **Perceptual uniformity**: Equal lightness values appear equally bright
- **Better dark mode**: Easier to maintain contrast ratios
- **Future-proof**: New CSS color space with wide gamut support

**Example**:
```css
--color-bg: oklch(98% 0.01 250);           /* Light mode */
--color-text-primary: oklch(20% 0.02 250); /* Dark text */
```

#### 4. **Typography**

**System Font Stack** (MVP):
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

**Fluid Type Scale** (1.2 ratio):
```css
--step-0: clamp(1.00rem, 0.95rem + 0.25vw, 1.12rem);
--step-1: clamp(1.20rem, 1.13rem + 0.35vw, 1.34rem);
--step-2: clamp(1.44rem, 1.34rem + 0.50vw, 1.60rem);
/* ... */
```

#### 5. **Spacing Scale**

**4px base unit**:
```css
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-5: 1.5rem;  /* 24px */
--space-6: 2rem;    /* 32px */
--space-7: 2.5rem;  /* 40px */
--space-8: 3.5rem;  /* 56px */
--space-9: 4.5rem;  /* 72px */
```

#### 6. **Theming Strategy**

**Data Attribute** (not body class):
```html
<html data-theme="dark">
```

**CSS**:
```css
:root {
  /* Default light */
  --color-bg: oklch(98% 0.01 250);
}

[data-theme="dark"] {
  --color-bg: oklch(14% 0.02 250);
}

[data-theme="hc"] {
  --color-bg: black;
}
```

**Respects System Preference**:
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Apply dark tokens if no data-theme */
  }
}
```

#### 7. **Component Strategy**

**Shared Base + Theme Variants**:
```css
/* Base (all themes) */
.btn {
  padding: 0 var(--space-4);
  height: 44px;
  border-radius: var(--radius-2);
  background: var(--color-surface);
  color: var(--color-text-primary);
}

/* Primary variant */
.btn.primary {
  background: var(--color-accent);
  color: var(--color-bg);
}
```

No theme-specific overrides needed—tokens handle theming.

#### 8. **Build Process**

**Script**: `shared/design-system/scripts/build-tokens.mjs`

**Input**: `tokens.design.json`
**Output**: `src/styles/themes.css` (generated CSS variables)

**Rationale**: Centralize design decisions in JSON, generate CSS automatically.

---

## Consequences

### ✅ **Positive**

1. **Single Source of Truth**: Changing accent color requires 1 edit in tokens.design.json
2. **Accessibility by Default**: Tokens verified for WCAG AA before generation
3. **Theme Parity**: Light/dark/high-contrast share same token names, different values
4. **Developer Velocity**: Applying design system = use token variables
5. **Performance**: CSS-only theming, no JS runtime overhead
6. **Future-Proof**: OKLCH, container queries, cascade layers

### ⚠️ **Negative**

1. **Browser Support**: Cascade layers require modern browsers (94% support)
   - **Mitigation**: Acceptable for developer-focused tool; fallback to non-layered CSS
2. **OKLCH Learning Curve**: Team must understand new color space
   - **Mitigation**: Provide color picker tool, document rationale
3. **Build Step**: Requires running `build-tokens.mjs` when tokens change
   - **Mitigation**: Add to `npm run build`, watch mode for dev

### 🔄 **Neutral**

1. **Migration Effort**: ~40 hours to refactor existing themes
   - One-time cost, long-term savings
2. **Documentation**: Must document token usage, component patterns
   - Required for any design system

---

## Compliance

### WCAG 2.2 AA

| Criterion   | Implementation                          | Status      |
|-------------|-----------------------------------------|-------------|
| 1.4.3       | Color contrast verified in tokens       | ✅ Built-in |
| 1.4.10      | Reflow (responsive grid)                | ✅ Built-in |
| 1.4.12      | Text spacing (line-height, margins)     | ✅ Built-in |
| 2.3.3       | Reduced motion guards                   | ✅ Built-in |
| 2.4.7       | Focus indicators                        | ✅ Built-in |
| 2.5.8       | Target size (44px buttons)              | ✅ Built-in |
| 4.1.2       | Semantic HTML in component examples     | ⚠️ Developer responsibility |

---

## References

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [OKLCH Color Space](https://oklch.com/)
- [CSS Cascade Layers (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Design Tokens W3C Community Group](https://design-tokens.github.io/community-group/)
- [Utopia: Fluid Responsive Design](https://utopia.fyi/)

---

## Alternatives Considered (Summary)

| Option                     | Verdict    | Reason                                      |
|----------------------------|------------|---------------------------------------------|
| Body class themes          | ❌ Rejected | High specificity, duplication               |
| Utility-first (Tailwind)   | ❌ Rejected | Verbose HTML, build dependency              |
| CSS-in-JS                  | ❌ Rejected | Framework lock-in, runtime overhead         |
| **Design Tokens + Layers** | ✅ Accepted | Maintainable, accessible, performant        |

---

## Approval

**Decision**: Implement design token system with cascade layers
**Date**: 2025-11-17
**Status**: ✅ Accepted

---

## Notes

- This ADR documents the **architectural decision**—implementation details in design system files.
- Future ADRs may address component library expansion, visual regression testing, etc.
- Design system versioned separately from application (allows independent updates).
