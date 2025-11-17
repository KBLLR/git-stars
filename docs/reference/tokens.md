# Design Token Reference

Complete reference for all design tokens in the Git-Stars design system.

## Color Tokens

### Semantic Colors

| Token | Purpose | Light Theme | Dark Theme | HC Theme |
|-------|---------|-------------|------------|----------|
| `--color-bg` | Page background | oklch(98% 0.01 250) | oklch(14% 0.02 250) | oklch(0% 0 0) |
| `--color-surface` | Card/panel backgrounds | oklch(100% 0 0) | oklch(20% 0.02 250) | oklch(0% 0 0) |
| `--color-surface-border` | Subtle borders | oklch(90% 0 0 / 0.24) | oklch(30% 0 0 / 0.32) | oklch(100% 0 0) |
| `--color-surface-hover` | Hover state | oklch(96% 0 0) | oklch(24% 0.02 250) | oklch(10% 0 0) |
| `--color-text-primary` | Primary text | oklch(20% 0.02 250) | oklch(96% 0 0) | oklch(100% 0 0) |
| `--color-text-secondary` | Secondary text | oklch(40% 0.01 250) | oklch(80% 0 0) | oklch(100% 0 0) |
| `--color-text-tertiary` | Tertiary/disabled | oklch(32% 0.01 250) | oklch(68% 0 0) | oklch(100% 0 0) |
| `--color-accent` | Interactive elements | oklch(65% 0.16 230) | oklch(65% 0.16 230) | oklch(90% 0.20 110) |
| `--color-accent-hover` | Accent hover | oklch(60% 0.18 230) | oklch(70% 0.18 230) | oklch(95% 0.22 110) |
| `--color-focus-ring` | Focus indicator | oklch(65% 0.16 230) | oklch(65% 0.16 230) | oklch(90% 0.20 110) |
| `--color-success` | Success states | oklch(70% 0.15 155) | oklch(70% 0.15 155) | oklch(85% 0.25 145) |
| `--color-warning` | Warning states | oklch(80% 0.15 85) | oklch(80% 0.15 85) | oklch(90% 0.28 95) |
| `--color-danger` | Error/danger | oklch(60% 0.20 25) | oklch(65% 0.20 25) | oklch(75% 0.28 30) |
| `--color-info` | Informational | oklch(70% 0.13 240) | oklch(70% 0.13 240) | oklch(85% 0.20 240) |

## Spacing Scale

| Token | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `--space-0` | 0 | 0px | Reset spacing |
| `--space-1` | 0.25rem | 4px | Tiny gaps, icon padding |
| `--space-2` | 0.5rem | 8px | Small gaps, compact spacing |
| `--space-3` | 0.75rem | 12px | Default gaps |
| `--space-4` | 1rem | 16px | Standard spacing |
| `--space-5` | 1.5rem | 24px | Section spacing |
| `--space-6` | 2rem | 32px | Large spacing |
| `--space-7` | 2.5rem | 40px | Extra large |
| `--space-8` | 3.5rem | 56px | Hero sections |
| `--space-9` | 4.5rem | 72px | Maximum spacing |

## Border Radius

| Token | Value | Use Case |
|-------|-------|----------|
| `--radius-0` | 0px | Sharp corners |
| `--radius-1` | 0.25rem (4px) | Subtle rounding |
| `--radius-2` | 0.5rem (8px) | Standard buttons |
| `--radius-3` | 0.75rem (12px) | Cards |
| `--radius-4` | 1rem (16px) | Large panels |
| `--radius-full` | 9999px | Pills, badges, circular |

## Shadows

| Token | Value | Use Case |
|-------|-------|----------|
| `--shadow-0` | none | Flat elements |
| `--shadow-1` | 0 1px 2px oklch(0% 0 0 / 0.08) | Subtle lift |
| `--shadow-2` | 0 2px 8px oklch(0% 0 0 / 0.12) | Cards |
| `--shadow-3` | 0 4px 16px oklch(0% 0 0 / 0.16) | Floating elements |
| `--shadow-4` | 0 8px 32px oklch(0% 0 0 / 0.24) | Modals, popovers |
| `--shadow-inset` | inset 0 1px 3px oklch(0% 0 0 / 0.1) | Recessed look |

## Typography Scale

Fluid type scale using `clamp()` for responsive sizing:

| Token | Min Size | Max Size | Use Case |
|-------|----------|----------|----------|
| `--step--2` | 0.69rem | 0.79rem | Fine print, captions |
| `--step--1` | 0.83rem | 0.96rem | Small text |
| `--step-0` | 1.00rem | 1.12rem | Body text |
| `--step-1` | 1.20rem | 1.34rem | h4, subheadings |
| `--step-2` | 1.44rem | 1.60rem | h3 |
| `--step-3` | 1.73rem | 1.92rem | h2 |
| `--step-4` | 2.07rem | 2.30rem | h1 |
| `--step-5` | 2.49rem | 2.76rem | Display text |
| `--step-6` | 2.99rem | 3.31rem | Hero text |

## Font Families

| Token | Value |
|-------|-------|
| `--font-sans` | System UI font stack |
| `--font-mono` | Monospace code stack |

## Z-Index Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `--z-base` | 0 | Default layer |
| `--z-dropdown` | 100 | Dropdown menus |
| `--z-sticky` | 200 | Sticky headers |
| `--z-fixed` | 300 | Fixed position |
| `--z-modal-backdrop` | 400 | Modal backdrop |
| `--z-modal` | 500 | Modal content |
| `--z-popover` | 600 | Popovers |
| `--z-tooltip` | 700 | Tooltips |

## Container Widths

| Token | Value | Use Case |
|-------|-------|----------|
| `--container-max` | 1200px | Standard content width |
| `--container-narrow` | 800px | Text-heavy content |
| `--container-wide` | 1600px | Wide layouts |
