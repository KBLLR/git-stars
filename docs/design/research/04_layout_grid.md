# Layout & Grid System — Git-Stars Design System
**Date**: 2025-11-17
**Goal**: Define spacing scale, grid system, breakpoints, and container strategies for consistent, responsive layouts

---

## Executive Summary

### Recommendation
- **Spacing Scale**: **4px base unit** (8-point grid system)
- **Grid**: **12-column CSS Grid** with subgrid support
- **Breakpoints**: **Mobile-first** with 4 breakpoints
- **Containers**: **Fluid with max-width** (1200px)
- **Modern Features**: **Container queries** for component-level responsiveness

---

## 1. Spacing Scale (4px Base Unit)

### Rationale
- **Divisibility**: 4 divides evenly into common viewport widths (320, 768, 1024, 1200)
- **Precision**: Provides enough granularity without over-complication
- **Industry Standard**: Used by Linear, Tailwind, Material Design, Apple HIG
- **Accessibility**: Ensures minimum 44px touch targets (11× base unit)

### Scale Definition

| Token         | Multiplier | px Value | rem Equivalent | Usage                          |
|---------------|------------|----------|----------------|--------------------------------|
| `--space-0`   | 0×         | 0        | 0              | No spacing                     |
| `--space-1`   | 1×         | 4px      | 0.25rem        | Fine adjustments, borders      |
| `--space-2`   | 2×         | 8px      | 0.5rem         | Tight padding, small gaps      |
| `--space-3`   | 3×         | 12px     | 0.75rem        | Compact elements               |
| `--space-4`   | 4×         | 16px     | 1rem           | Default padding/gap            |
| `--space-5`   | 6×         | 24px     | 1.5rem         | Comfortable spacing            |
| `--space-6`   | 8×         | 32px     | 2rem           | Section padding                |
| `--space-7`   | 10×        | 40px     | 2.5rem         | Large component padding        |
| `--space-8`   | 14×        | 56px     | 3.5rem         | Generous section margins       |
| `--space-9`   | 18×        | 72px     | 4.5rem         | Extra-large spacing (rare)     |

### CSS Implementation
```css
:root {
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
}
```

### Usage Examples
```css
.card {
  padding: var(--space-5); /* 24px */
  gap: var(--space-4);     /* 16px */
}

.header {
  padding-block: var(--space-3);  /* 12px top/bottom */
  padding-inline: var(--space-5); /* 24px left/right */
}

.section {
  margin-block: var(--space-8); /* 56px vertical rhythm */
}
```

---

## 2. Grid System

### 12-Column Grid

**Rationale**:
- **Flexible**: Divides evenly by 2, 3, 4, 6, 12 (supports halves, thirds, quarters)
- **Industry Standard**: Bootstrap, Tailwind, GitHub all use 12 columns
- **Not Too Complex**: 16 columns offer diminishing returns

### CSS Grid Implementation
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4); /* 16px */
}

/* Span utilities */
.col-span-1  { grid-column: span 1; }
.col-span-2  { grid-column: span 2; }
.col-span-3  { grid-column: span 3; }
.col-span-4  { grid-column: span 4; }
.col-span-6  { grid-column: span 6; }
.col-span-8  { grid-column: span 8; }
.col-span-12 { grid-column: span 12; }

/* Full-width */
.col-full { grid-column: 1 / -1; }
```

### Responsive Grid
```css
/* Mobile: Stack everything */
@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet: 6-column */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Desktop: Full 12-column */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(12, 1fr);
  }
}
```

### Auto-Fit Grid (for Cards)
**For dynamic card layouts** (repository grid):
```css
#reposContainer {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5); /* 24px */
}
```

**Benefits**:
- Automatically calculates columns based on available width
- No breakpoints needed for basic responsiveness
- Cards always fill space efficiently

---

## 3. Container System

### Standard Container
```css
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```

**Breakdown**:
- `100% - 2rem`: Full width minus 1rem (16px) padding on each side
- `1200px`: Maximum content width (prevents line length issues on ultrawide monitors)
- `margin-inline: auto`: Centers container

### Container Variants
```css
.container-narrow {
  width: min(100% - 2rem, 800px);
  margin-inline: auto;
}

.container-wide {
  width: min(100% - 2rem, 1600px);
  margin-inline: auto;
}

.container-fluid {
  width: 100%;
  padding-inline: var(--space-4); /* No max-width */
}
```

**Usage**:
- **`.container`**: Default for most content
- **`.container-narrow`**: Article/documentation content (better readability)
- **`.container-wide`**: Dashboards, data tables
- **`.container-fluid`**: Full-bleed sections

---

## 4. Breakpoints

### Mobile-First Strategy

| Name       | Min Width | Max Width | Usage                                      |
|------------|-----------|-----------|-------------------------------------------|
| **xs**     | 0         | 639px     | Small phones (portrait)                   |
| **sm**     | 640px     | 767px     | Large phones (landscape)                  |
| **md**     | 768px     | 1023px    | Tablets                                   |
| **lg**     | 1024px    | 1279px    | Laptops, desktops                         |
| **xl**     | 1280px    | —         | Large desktops                            |

### CSS Custom Properties for Breakpoints
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Media Query Usage
```css
/* Mobile-first: Add complexity as screen grows */

/* Base styles (mobile) */
.filters {
  flex-direction: column;
  gap: var(--space-3);
}

/* Tablet and up */
@media (min-width: 768px) {
  .filters {
    flex-direction: row;
    gap: var(--space-4);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .filters {
    gap: var(--space-5);
  }
}
```

---

## 5. Container Queries (Modern Approach)

### Rationale
- **Component-level responsiveness** — Components adapt to their container, not viewport
- **Encapsulation** — Component styles don't leak based on page context
- **Future-proof** — Browser support: Chrome 105+, Safari 16+, Firefox 110+ (93% global)

### Implementation
```css
/* Define container */
.card-grid {
  container-type: inline-size;
  container-name: card-grid;
}

/* Component adapts to container width */
.card {
  padding: var(--space-4);
}

@container card-grid (min-width: 400px) {
  .card {
    padding: var(--space-5);
    display: flex;
    gap: var(--space-4);
  }
}

@container card-grid (min-width: 700px) {
  .card {
    padding: var(--space-6);
  }
}
```

### Use Cases for Git-Stars
1. **Repository Cards**: Adjust layout based on grid width (not viewport)
2. **Sidebar Panel**: Different spacing when panel is narrow vs. full-width
3. **Filter Bar**: Horizontal/vertical layout based on container width

---

## 6. Radius (Border Radius) Scale

### Scale Definition
```css
:root {
  --radius-0: 0px;      /* Sharp corners */
  --radius-1: 0.25rem;  /* 4px - Subtle */
  --radius-2: 0.5rem;   /* 8px - Buttons, inputs */
  --radius-3: 0.75rem;  /* 12px - Cards */
  --radius-4: 1rem;     /* 16px - Panels */
  --radius-full: 9999px; /* Pills, badges, circular buttons */
}
```

### Usage
```css
.btn {
  border-radius: var(--radius-2); /* 8px */
}

.card {
  border-radius: var(--radius-3); /* 12px */
}

.badge {
  border-radius: var(--radius-full); /* Pill shape */
}
```

---

## 7. Shadow Scale

### Scale Definition
```css
:root {
  --shadow-0: none;
  --shadow-1: 0 1px 2px oklch(0% 0 0 / 0.08);         /* Subtle */
  --shadow-2: 0 2px 8px oklch(0% 0 0 / 0.12);         /* Card */
  --shadow-3: 0 4px 16px oklch(0% 0 0 / 0.16);        /* Floating */
  --shadow-4: 0 8px 32px oklch(0% 0 0 / 0.24);        /* Modal */
  --shadow-inset: inset 0 1px 3px oklch(0% 0 0 / 0.1); /* Neumorphic */
}
```

### Usage
```css
.card {
  box-shadow: var(--shadow-1);
}

.card:hover {
  box-shadow: var(--shadow-2);
}

.modal {
  box-shadow: var(--shadow-4);
}
```

---

## 8. Z-Index Scale

### Rationale
Prevent "z-index: 9999" chaos by defining a systematic scale.

```css
:root {
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

### Usage
```css
.main-header {
  position: fixed;
  z-index: var(--z-fixed); /* 300 */
}

.readme-panel {
  position: fixed;
  z-index: var(--z-modal); /* 500 */
}

.filters {
  position: fixed;
  z-index: var(--z-sticky); /* 200 */
}
```

---

## 9. Layout Primitives (Utility Classes)

### Stack (Vertical Rhythm)
```css
.stack > * + * {
  margin-top: var(--space-4);
}

.stack-sm > * + * {
  margin-top: var(--space-2);
}

.stack-lg > * + * {
  margin-top: var(--space-6);
}
```

**Usage**:
```html
<div class="stack">
  <h2>Heading</h2>
  <p>Paragraph automatically spaced</p>
  <p>Another paragraph</p>
</div>
```

### Cluster (Horizontal Grouping)
```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}
```

**Usage**: Badges, tags, action buttons

### Center
```css
.center {
  box-sizing: content-box;
  max-width: var(--measure, 66ch);
  margin-inline: auto;
  padding-inline: var(--space-4);
}
```

**Usage**: Centered content blocks

### Sidebar Layout
```css
.sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
}

.sidebar > :first-child {
  flex-basis: 20rem;
  flex-grow: 1;
}

.sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-inline-size: 50%;
}
```

**Usage**: Two-column layouts (filters + content)

---

## 10. Responsive Strategy Summary

### Mobile-First Cascade
1. **Base styles** (mobile): Single column, stacked, larger touch targets
2. **Tablet** (768px+): Two-column layouts, horizontal navigation
3. **Desktop** (1024px+): Full grid, sidebar layouts, hover states

### Container Queries for Components
- **Cards**: Adjust internal layout based on card width
- **Panels**: Change padding/density based on panel width
- **Forms**: Stack on narrow, side-by-side labels on wide

### Fluid Sizing
- **Typography**: `clamp()` for responsive font sizes
- **Spacing**: Consider fluid spacing for large gaps (advanced)

---

## 11. Implementation Checklist

### ✅ **Phase 1: Tokens**
- [x] Define spacing scale (--space-0 through --space-9)
- [x] Define radius scale (--radius-0 through --radius-full)
- [x] Define shadow scale (--shadow-0 through --shadow-4)
- [x] Define z-index scale (--z-base through --z-tooltip)

### ✅ **Phase 2: Grid System**
- [x] 12-column grid with span utilities
- [x] Auto-fit grid for card layouts
- [x] Container classes (standard, narrow, wide, fluid)

### ✅ **Phase 3: Breakpoints**
- [x] Define breakpoint tokens
- [x] Mobile-first media queries
- [x] Container query support for modern browsers

### ✅ **Phase 4: Utilities**
- [x] Stack (vertical rhythm)
- [x] Cluster (horizontal wrapping)
- [x] Center (content centering)
- [x] Sidebar (two-column layout)

---

## 12. Migration from Current System

### Current Issues (from Audit)
- ❌ Ad-hoc spacing: 4px, 5px, 6px, 8px, 10px, 12px, 14px, 15px, 18px, 20px, 24px, 80px, 100px
- ❌ No systematic grid
- ❌ Fixed positioning without z-index scale
- ❌ Media queries only (no container queries)

### Migration Plan
1. **Replace hardcoded padding/margin/gap** with `var(--space-*)` tokens
2. **Consolidate .grid styles** into unified 12-column system
3. **Update #reposContainer** to use auto-fit grid with spacing tokens
4. **Add container queries** for .card, .filters, .readme-panel
5. **Introduce utility classes** to reduce inline styles

### Before/After Example
```css
/* BEFORE */
.card {
  padding: 15px; /* Ad-hoc */
  border-radius: 8px; /* Hardcoded */
  box-shadow: 0 2px 5px rgba(0,0,0,0.1); /* Custom */
}

/* AFTER */
.card {
  padding: var(--space-5); /* Systematic */
  border-radius: var(--radius-3); /* Token */
  box-shadow: var(--shadow-1); /* Consistent */
}
```

---

## Summary

### ✅ **Adopt for Design System MVP**
1. **Spacing Scale**: 4px base unit (--space-0 to --space-9)
2. **Grid**: 12-column CSS Grid + auto-fit for cards
3. **Breakpoints**: Mobile-first (640px, 768px, 1024px, 1280px)
4. **Containers**: Fluid with max-width 1200px
5. **Radius**: 5-step scale (0, 4px, 8px, 12px, 16px, full)
6. **Shadow**: 5-level scale for depth
7. **Z-Index**: 8-level stacking context
8. **Utilities**: Stack, cluster, center, sidebar layouts

### 🔄 **Future Enhancement** (Post-MVP)
1. **Fluid spacing**: `clamp()` for responsive gaps (advanced)
2. **Subgrid**: When browser support reaches 95%+
3. **Layout animations**: FLIP technique for smooth transitions

---

**Next Step**: Proceed to **Step 5: Accessibility Assessment** to verify contrast ratios and remediation strategies.
