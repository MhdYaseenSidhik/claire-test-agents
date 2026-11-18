# Design System — HZL Inventory Dashboard

## Direction
Linear/Vercel-calm — enterprise-grade, calm and legible, one accent colour, generous whitespace.

## Tokens

### Typography
- Font: Inter (Google Fonts)
- Scale: 12px (2xs) / 14px (xs/sm) / 16px (base) / 20px (lg) / 24px (xl) / 32px (2xl)
- Body line-height: 1.5 | Heading line-height: 1.25

### Spacing (4px base)
4 / 8 / 12 / 16 / 24 / 32 / 48px

### Colours
| Token | Light | Dark |
|-------|-------|------|
| Surface | #F8FAFC | #0F172A |
| Card | #FFFFFF | #1E293B |
| Border | #E2E8F0 | #334155 |
| Accent | #2563EB | #2563EB |
| Accent hover | #1D4ED8 | #1D4ED8 |
| Success | #16A34A | #16A34A |
| Warning | #D97706 | #D97706 |
| Danger | #DC2626 | #DC2626 |
| Info | #0891B2 | #0891B2 |

### Radii
- sm: 6px (controls, badges)
- lg: 12px (cards, modals)

### Elevation
- shadow-sm: cards at rest
- shadow-md: dropdowns, tooltips
- shadow-lg: modals

### Motion
- Duration: 150ms ease-out (hover), 200ms ease-out (open/close)
- prefers-reduced-motion: respected via Tailwind

## Components
- **Sidebar**: 240px fixed, collapsible on mobile (hamburger)
- **Top bar**: sticky, global filters + dark mode toggle
- **Cards**: white/dark-card, 1px border, shadow-sm, 12px radius
- **Buttons**: 36px height, 6px radius, accent primary / ghost secondary
- **Selects**: 36px height, 6px radius, styled (no browser default)
- **Badges**: 20px height, 6px radius, semantic colours
- **Tables**: sticky header, alternating rows, 40px row height, numeric columns right-aligned
- **Charts**: Recharts, accent blue primary, semantic colours for categories

## Responsive
- 1440px: sidebar + main content, 3-column KPI grid
- 390px: hamburger sidebar, 2-column KPI grid, horizontal scroll on tables

## Dark Mode
- Implemented via `class` strategy (Tailwind)
- Toggle in header
- All tokens carry dark values; depth from lighter surfaces (card-dark > surface-dark)
