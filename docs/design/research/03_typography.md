# Typography Research — Git-Stars Design System
**Date**: 2025-11-17
**Goal**: Select font families and define a systematic type scale for clarity, performance, and accessibility

---

## Executive Summary

### Recommendation
Adopt a **hybrid approach**:
- **Primary**: **System font stack** for instant load and native feel
- **Optional Enhancement**: **Inter Variable** (self-hosted) for refined aesthetics when performance budget allows

**Type Scale**: **1.2 ratio (minor third)** with **fluid sizing via `clamp()`** for responsive typography without breakpoints.

---

## 1. Font Family Evaluation

### Option 1: System Font Stack (Recommended for MVP)
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji",
             "Segoe UI Emoji", "Segoe UI Symbol";
```

#### Pros
✅ **Zero load time** — Instant text rendering (no FOIT/FOUT)
✅ **Native feel** — Matches user's OS, feels familiar
✅ **Excellent legibility** — OS vendors optimize for screen reading
✅ **No licensing** — Free, no external dependencies
✅ **Performance** — ~20–30 KB savings vs. web fonts
✅ **Accessibility** — Respects user's font preferences (dyslexia fonts, etc.)

#### Cons
❌ **Less distinctive** — Won't stand out from OS defaults
❌ **Cross-platform variance** — Different rendering on macOS/Windows/Linux

#### Verdict
**Best for MVP** — Prioritizes performance and accessibility, aligns with GitHub's approach.

---

### Option 2: Inter Variable (Self-Hosted)
**Source**: [rsms.me/inter](https://rsms.me/inter/) (Open Font License)
**File Size**: ~150 KB (variable font, woff2)

#### Pros
✅ **Modern aesthetics** — Clean, contemporary, developer-approved
✅ **Variable font** — Single file for all weights (100–900)
✅ **Excellent hinting** — Crisp at small sizes (12px–16px)
✅ **OpenType features** — Tabular numbers, stylistic sets, case-sensitive punctuation
✅ **Free & open-source** — No licensing fees
✅ **Used by Linear, Vercel** — Proven in production

#### Cons
⚠️ **Load time** — ~150 KB (gzipped ~110 KB) adds to initial paint
⚠️ **Self-hosting required** — No Google Fonts version (deprecated)
⚠️ **Flash of unstyled text** — Risk of FOUT if not preloaded

#### Verdict
**Ideal for future enhancement** — Consider after MVP if brand distinction > performance cost.

---

### Option 3: Roboto (Current, Not Recommended)
**Current Usage**: Loaded from Google Fonts CDN

#### Issues with Current Approach
❌ **External dependency** — Third-party request blocks rendering
❌ **Not variable** — Loading 3 static weights = 3 files
❌ **Google Fonts CDN** — GDPR concerns in EU, potential blocking in China
❌ **Generic aesthetics** — Roboto is overused, lacks distinction

#### Verdict
**Migrate away** — Replace with system stack or Inter.

---

### Monospace Font for Code/Terminal

```css
font-family: ui-monospace, "SF Mono", "Cascadia Code", "Source Code Pro",
             Menlo, Monaco, "Courier New", monospace;
```

#### Rationale
- **`ui-monospace`** — New system monospace stack (Safari 13.1+, Chrome 87+)
- **Fallbacks** — Covers macOS (SF Mono, Menlo), Windows (Cascadia Code), Linux (monospace)
- **No web font needed** — Terminal theme can rely on native monospace

---

## 2. Type Scale Definition

### Mathematical Ratio: **1.2 (Minor Third)**

**Rationale**:
- **Subtle but distinct** — Enough differentiation between sizes without jarring jumps
- **Compact** — Fits developer UX (information density > luxury spacing)
- **Proven** — Used by Linear, Notion, Raindrop

#### Scale Calculation (Base 16px = 1rem)

| Step      | Calculation        | px (approx) | rem   | Usage                  |
|-----------|--------------------|-------------|-------|------------------------|
| **-2**    | 16 ÷ 1.2²          | 11.11       | 0.694 | Fine print, legal      |
| **-1**    | 16 ÷ 1.2           | 13.33       | 0.833 | Caption, badge, meta   |
| **0** (base) | 16              | 16          | 1     | Body text              |
| **1**     | 16 × 1.2           | 19.20       | 1.2   | Large body, small h4   |
| **2**     | 16 × 1.2²          | 23.04       | 1.44  | H4                     |
| **3**     | 16 × 1.2³          | 27.65       | 1.728 | H3                     |
| **4**     | 16 × 1.2⁴          | 33.18       | 2.074 | H2                     |
| **5**     | 16 × 1.2⁵          | 39.81       | 2.488 | H1                     |
| **6**     | 16 × 1.2⁶          | 47.78       | 2.986 | Display (hero)         |

---

## 3. Fluid Typography with `clamp()`

### Rationale
- **Responsive without breakpoints** — Scales smoothly between min/max based on viewport width
- **Better UX** — Text grows on larger screens, shrinks on mobile naturally
- **Less CSS** — No media query spaghetti

### Formula
```
clamp(MIN, PREFERRED, MAX)
```

**PREFERRED** uses viewport width (`vw`) to create fluid scaling:
```
PREFERRED = BASE_REM + (TARGET_REM - BASE_REM) × (100vw - MIN_VW) / (MAX_VW - MIN_VW)
```

**Simplified for our use**:
- **MIN_VW**: 320px (mobile)
- **MAX_VW**: 1200px (desktop)

### Implementation

```css
:root {
  /* Step -2: Fine print */
  --step--2: clamp(0.69rem, 0.66rem + 0.15vw, 0.79rem);

  /* Step -1: Caption */
  --step--1: clamp(0.83rem, 0.79rem + 0.20vw, 0.96rem);

  /* Step 0: Body base */
  --step-0: clamp(1.00rem, 0.95rem + 0.25vw, 1.12rem);

  /* Step 1: Large body */
  --step-1: clamp(1.20rem, 1.13rem + 0.35vw, 1.34rem);

  /* Step 2: H4 */
  --step-2: clamp(1.44rem, 1.34rem + 0.50vw, 1.60rem);

  /* Step 3: H3 */
  --step-3: clamp(1.73rem, 1.57rem + 0.75vw, 1.92rem);

  /* Step 4: H2 */
  --step-4: clamp(2.07rem, 1.83rem + 1.15vw, 2.30rem);

  /* Step 5: H1 */
  --step-5: clamp(2.49rem, 2.13rem + 1.70vw, 2.76rem);

  /* Step 6: Display */
  --step-6: clamp(2.99rem, 2.47rem + 2.45vw, 3.31rem);
}
```

#### Usage Example
```css
body {
  font-size: var(--step-0);
  line-height: 1.6;
}

h1 {
  font-size: var(--step-5);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

h2 { font-size: var(--step-4); line-height: 1.15; }
h3 { font-size: var(--step-3); line-height: 1.2; }
h4 { font-size: var(--step-2); line-height: 1.25; }

p, li {
  font-size: var(--step-0);
  line-height: 1.6;
}

small, .caption {
  font-size: var(--step--1);
  line-height: 1.4;
}
```

---

## 4. Line Height Guidelines

### Body Text (Paragraphs, Lists)
```css
line-height: 1.6; /* ~26px for 16px base */
```
- **Rationale**: Improves readability, especially for users with dyslexia or low vision
- **WCAG**: Recommendation is ≥ 1.5 for body text

### Headings
```css
h1, h2 { line-height: 1.1; }  /* Tight, modern */
h3, h4 { line-height: 1.2; }  /* Slightly more breathing room */
```
- **Rationale**: Large headings look better with tighter leading
- **Prevents**: Awkward spacing in multi-line headings

### UI Elements (Buttons, Badges)
```css
line-height: 1.0; /* Vertically centers text */
```
- **Rationale**: Precise vertical centering in fixed-height elements

---

## 5. Letter Spacing (Tracking)

### Default (No Adjustment)
```css
letter-spacing: normal; /* 0 */
```
- **Applies to**: Body text, most headings

### Tight (Large Headings)
```css
letter-spacing: -0.02em; /* H1, H2 */
```
- **Rationale**: Large type appears looser; negative tracking compensates

### Loose (Uppercase Labels)
```css
letter-spacing: 0.05em; /* .badge, .meta, .label */
```
- **Rationale**: Uppercase text benefits from increased tracking for legibility

### Wide (Emphasis)
```css
letter-spacing: 0.1em; /* Rare, stylistic use */
```
- **Use sparingly**: All-caps navigation, decorative headers

---

## 6. Line Length (Measure)

### Optimal Range
**45–75 characters per line** (CPL) for body text

**Implementation**:
```css
.measure {
  max-width: 66ch; /* ~66 characters at current font-size */
}
```

**Usage**:
- **Content areas**: Article text, documentation, descriptions
- **Not for UI chrome**: Headers, filters, cards can be wider

**Rationale**:
- **WCAG Success Criterion 1.4.8**: Width of text blocks ≤ 80 characters
- **Readability research**: 66 CPL is optimal for English

---

## 7. Font Weight Guidelines

### System Font Stack
```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Inter Variable (if adopted)
```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800; /* Optional for headings */
```

**Usage**:
- **Body**: 400 (normal)
- **Emphasis**: 600 (semibold)
- **Headings**: 700 (bold) or 800 (extrabold)
- **UI labels**: 600 (semibold)

---

## 8. Font Feature Settings (Inter Only)

If using Inter Variable, enable OpenType features:

```css
body {
  font-feature-settings:
    'cv05' 1,  /* Simplified 'a' */
    'cv08' 1,  /* Simplified 'g' */
    'cv11' 1,  /* Simplified '1' */
    'calt' 1;  /* Contextual alternates */
}

.tabular-nums {
  font-feature-settings: 'tnum' 1; /* Tabular numbers for metrics */
}
```

---

## 9. Implementation Strategy

### Phase 1: MVP (System Fonts)
```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Monaco, "Courier New", monospace;
}

body {
  font-family: var(--font-sans);
  font-size: var(--step-0);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Phase 2: Enhancement (Inter Variable, Future)
1. **Download** Inter Variable from [GitHub Releases](https://github.com/rsms/inter/releases)
2. **Self-host** in `/public/fonts/`
3. **Preload** in HTML:
   ```html
   <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
   ```
4. **Define** `@font-face`:
   ```css
   @font-face {
     font-family: 'Inter';
     src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
     font-weight: 100 900;
     font-display: swap;
   }
   ```
5. **Update** token:
   ```css
   --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
   ```

---

## 10. Accessibility Considerations

### Text Scaling
- ✅ **Use `rem` units** — Respects user's browser font-size preferences
- ✅ **Avoid `px` for font-size** — Fixed pixels ignore zoom settings
- ✅ **Test at 200% zoom** — WCAG 1.4.4 requires text to scale

### Readability
- ✅ **Line-height ≥ 1.5** for body (WCAG 1.4.12)
- ✅ **Paragraph spacing ≥ 2× font-size** (via margin-bottom)
- ✅ **Letter-spacing ≥ 0.12× font-size** for normal text

### Color Contrast (covered in Step 5)
- ✅ **Normal text**: 4.5:1 minimum
- ✅ **Large text** (≥18pt or ≥14pt bold): 3:1 minimum

---

## Summary & Recommendation

### ✅ **Adopt for Design System MVP**
1. **Font Stack**: System fonts (`-apple-system, BlinkMacSystemFont, ...`)
2. **Monospace**: `ui-monospace` stack
3. **Type Scale**: 1.2 ratio (minor third)
4. **Fluid Sizing**: `clamp()` for responsive typography
5. **Line Heights**: 1.6 (body), 1.1–1.2 (headings)
6. **Letter Spacing**: -0.02em (large headings), 0.05em (uppercase labels)
7. **Measure**: `max-width: 66ch` for content

### 🔄 **Future Enhancement** (Post-MVP)
1. **Upgrade to Inter Variable** (self-hosted) for brand distinction
2. **Enable OpenType features** (`cv05`, `cv08`, `cv11`, `tnum`)
3. **Performance budget**: Ensure <150ms additional FCP impact

---

**Next Step**: Proceed to **Step 4: Layout & Grid** to define spacing scale and breakpoints.
