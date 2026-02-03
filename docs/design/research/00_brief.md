# Design System Brief — Git-Stars
**Date**: 2025-11-17
**Agent**: Design Engineering
**Session ID**: 01BigdaP2w18U153LRK438aD

---

## Mission
Create a research-driven, accessible, and production-ready design system for Git-Stars, a GitHub repository visualization and management tool that helps developers track, organize, and discover their starred repositories.

---

## Brand Brief (Synthesized)

### Product Mission
*"Empower developers to organize, visualize, and rediscover their GitHub stars with clarity and delight."*

### Brand Adjectives
- **Technical** — Appeals to developer audience with precision and competence
- **Confident** — Provides clear information hierarchy and trustworthy data presentation
- **Friendly** — Approachable UI that reduces cognitive load
- **Organized** — Systematic layout and filtering capabilities
- **Modern** — Contemporary web aesthetics without excessive decoration

### Tone Scale (0–5)
| Dimension   | Score | Rationale                                                      |
|-------------|-------|----------------------------------------------------------------|
| Playful     | 2/5   | Some visual interest but primarily functional                  |
| Serious     | 3/5   | Professional tool but not corporate                            |
| Luxury      | 1/5   | Accessible to all developers, not exclusive                    |
| Friendly    | 4/5   | Welcoming, reduces barrier to organization                     |
| Academic    | 2/5   | Technical but not research-oriented                            |

### Reference Benchmarks
- **GitHub.com** — Card-based layouts, clear information hierarchy
- **Linear.app** — Modern color palette, fluid animations, excellent accessibility
- **Raindrop.io** — Bookmark organization with visual cards and theming
- **Notion.com** — Clean typography, consistent spacing system
- **Vercel.com** — Contemporary design language, smooth interactions

---

## Audience

### Primary Users
1. **Individual Developers** — Organizing personal starred repositories (200–2000+ stars)
2. **Technical Researchers** — Discovering patterns across starred projects
3. **Team Leads** — Curating resources for team reference

### User Constraints & Considerations
- **Visual Diversity**: Support low-vision users with sufficient contrast and scalable text
- **Motor Constraints**: Ensure large hit targets (≥44px), keyboard navigation
- **Cognitive Load**: Clear visual hierarchy, scannable information density
- **Language Proficiency**: English primary, potential for i18n expansion
- **Screen Readers**: Semantic HTML, proper ARIA labeling

---

## Product Surface

### Routes/Screens (Current Implementation)
1. **Main View** (`index.html`) — Grid of repository cards with filters
2. **Logs View** (`logs.html`) — Activity history and action tracking
3. **Readme Panel** — Side panel overlay for repository details

### Primary User Flows
1. **Browse & Filter** — Search/filter repos by language, tag, license, date
2. **View Details** — Click card to open readme in side panel
3. **Theme Selection** — Switch between visual themes (retro, futuristic, professional, etc.)
4. **Activity Tracking** — Monitor recent interactions, export logs
5. **External Navigation** — Open repository on GitHub or Streamlit app

---

## Accessibility Targets

- **Standard**: WCAG 2.2 Level AA compliance
- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Special Modes**:
  - `prefers-reduced-motion` — Disable/reduce animations
  - `prefers-color-scheme` — Respect system dark mode
  - High-contrast theme variant for visual accessibility
- **Keyboard Navigation**: Full tab order, visible focus indicators
- **Screen Reader Support**: Semantic HTML, ARIA labels/roles

---

## Locales & Devices

### Locales (MVP)
- **English (en)** — Primary

### Device Targets
- **Desktop** — Primary use case (≥1024px)
- **Tablet** — Secondary support (768px–1023px)
- **Mobile** — Tertiary support (320px–767px)

---

## Technical Context

### Package Manager
`npm` (with `package-lock.json` present)

### Bundler
**Vite 5.x** — Modern, fast development with HMR

### Current Styling Approach
- **Vanilla CSS** with `@import` statements
- **Theme System** — Body class-based theme switching (`.retro`, `.futuristic`, etc.)
- **No CSS Modules or CSS-in-JS** currently in use

### Theming Requirements

#### Modes
1. **Light** (default)
2. **Dark** (respects `prefers-color-scheme`)
3. **High-Contrast** (accessibility variant)

#### Brand Variants (Future)
- **Default** — Primary blue/green accent palette
- **Alt1** — Potential warm/cool variant for user preference

---

## Success Metrics

| Metric                          | Target                              |
|---------------------------------|-------------------------------------|
| **CSS Bundle Size (gzipped)**   | ≤60 KB                              |
| **Minimum Contrast Ratio**      | 4.5:1 (normal text)                 |
| **Keyboard Nav Success Rate**   | ≥95% on key flows (manual test)     |
| **Axe Violations**              | 0 critical/serious                  |
| **Lighthouse Accessibility**    | ≥95/100                             |
| **First Contentful Paint**      | Maintain or improve current         |

---

## Timeline & Scope

### Approach
**"Fast MVP → Harden"** — Deliver a functional, token-based system quickly, then iterate based on real-world usage.

### MVP Deliverables (This Session)
1. ✅ Research artifacts (audit, competitive, typography, layout, a11y)
2. ✅ Design token taxonomy (`tokens.design.json`)
3. ✅ Base CSS system (reset, tokens, typography, utilities)
4. ✅ Theme implementation (light/dark/high-contrast)
5. ✅ Core component primitives (buttons, forms, cards, navigation)
6. ✅ Application to existing UI (refactor current screens)
7. ✅ Documentation (Diátaxis structure)
8. ✅ ADR for architecture decisions

### Future Hardening (Post-MVP)
- Expanded component library (modals, tooltips, toasts, tables)
- Visual regression testing (Playwright + pixelmatch)
- Internationalization (i18n) support
- Design tool integration (Figma Tokens bridge)
- Animation/interaction polish

---

## Locked Assumptions

Given missing or ambiguous inputs, the following defaults are locked for this session:

1. **Color Philosophy**: Use modern **OKLCH color space** for perceptual uniformity and better dark mode
2. **Font Loading**: Prefer **self-hosted variable fonts** or system font stack to reduce external dependencies
3. **Grid System**: **12-column grid** with container queries for responsive layouts
4. **Spacing Scale**: **4px base unit** (0.25rem) for predictable, harmonious spacing
5. **Motion Strategy**: Subtle, functional animations; respect `prefers-reduced-motion`
6. **CSS Architecture**: **Cascade layers** (`@layer`) for explicit specificity management
7. **Component Strategy**: Utility-first with semantic component classes, no framework lock-in
8. **Documentation**: Follow **Diátaxis** framework (tutorial, how-to, reference, explanation)

---

## Definition of DONE (This Pass)

### Research Phase Complete
- [ ] UI audit with gap analysis
- [ ] Competitive research with pattern extraction
- [ ] Typography research with font/scale proposals
- [ ] Layout/grid system definition
- [ ] Accessibility assessment with remediation plan

### System Phase Complete
- [ ] `tokens.design.json` with role-semantic mapping
- [ ] Base CSS with layers, reset, and token variables
- [ ] Typography scale with fluid `clamp()` values
- [ ] Theme CSS for light/dark/high-contrast modes
- [ ] Utility classes for common patterns
- [ ] Component CSS for primitives (buttons, forms, nav, cards)
- [ ] ADR-0001 documenting architecture decisions

### Application Phase Complete
- [ ] `index.css` imported into app
- [ ] Sample screens refactored to use new tokens
- [ ] Theme switcher functional with new system
- [ ] Existing functionality preserved

### Quality Phase Complete
- [ ] Stylelint/lint checks pass
- [ ] Axe DevTools scan shows 0 critical/serious issues
- [ ] Keyboard navigation tested on key flows
- [ ] Lighthouse accessibility score ≥95

### Documentation Phase Complete
- [ ] README for design system package
- [ ] How-to guide for applying the system
- [ ] Token reference tables
- [ ] Explanation of design decisions
- [ ] Tutorial for getting started

### Handoff Phase Complete
- [ ] Atomic conventional commits
- [ ] Pull request with verification steps
- [ ] Screenshots/examples in PR
- [ ] HANDOFF.md with next steps and known limits
- [ ] CHANGELOG updated

---

## Next Steps
Proceed to **Step 1: UI Audit** to inventory existing styles and identify gaps.
