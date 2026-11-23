---
name: Obsidian Orbit
colors:
  surface: '#10131c'
  surface-dim: '#10131c'
  surface-bright: '#363943'
  surface-container-lowest: '#0b0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#272a33'
  surface-container-highest: '#32343f'
  on-surface: '#e0e2ef'
  on-surface-variant: '#c8c4d6'
  inverse-surface: '#e0e2ef'
  inverse-on-surface: '#2d303a'
  outline: '#928f9f'
  outline-variant: '#474554'
  surface-tint: '#c7bfff'
  primary: '#c7bfff'
  on-primary: '#2a039d'
  primary-container: '#8e7fff'
  on-primary-container: '#24008c'
  inverse-primary: '#5a49cb'
  secondary: '#47deae'
  on-secondary: '#003828'
  secondary-container: '#00bc8e'
  on-secondary-container: '#004432'
  tertiary: '#f8bc63'
  on-tertiary: '#452b00'
  tertiary-container: '#bc8734'
  on-tertiary-container: '#3c2500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c7bfff'
  on-primary-fixed: '#170065'
  on-primary-fixed-variant: '#422db2'
  secondary-fixed: '#6afbc9'
  secondary-fixed-dim: '#47deae'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513c'
  tertiary-fixed: '#ffddb2'
  tertiary-fixed-dim: '#f8bc63'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#10131c'
  on-background: '#e0e2ef'
  surface-variant: '#32343f'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-num:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system sets the standard for high-performance operations management in modern service enterprises. The aesthetic blends executive sophistication with tactical utility: a refined dark-canvas palette, pristine typographic hierarchies, and micro-calibrated controls that instill confidence during mission-critical tasks like scheduling, client invoicing, and workflow monitoring.

The design movement combines **Modern Dark SaaS** with **Quiet Luxury**:
- Deep, obsidian slate tones provide an eye-strain-free background for long-duration dashboard work.
- Luminous primary accents (#8B7CFF) guide focus without inducing visual fatigue.
- Restrained tactile styling employs 1px crisp borders, subtle background differentiation, and refined iconography (Lucide style, 1.5px stroke weight).
- Interfaces feel composed, ultra-responsive, and unencumbered by gratuitous motion or heavy dropshadows.

## Colors

The palette is engineered for precision, legibility, and visual calmness across dense operations views.

### Surface Architecture
- **Base Canvas (`#10131C`):** The foundational viewport background.
- **Sidebar & Inset Canvas (`#131824`):** Anchored structural zones, providing clear navigational grouping.
- **Card / Surface (`#191E2B`):** Standard interactive surfaces, containers, and data tables.
- **Elevated Surfaces (`#22293A`):** Modals, dropdown flyouts, active popovers, and elevated pill badges.
- **Subtle Borders & Dividers (`#2B3243`):** Single-pixel perimeter framing that maintains structural definition across dark surfaces without high contrast distraction.

### Accent & Feedback
- **Primary Violet (`#8B7CFF`):** Call-to-actions, active navigation highlights, progress indicators, and interactive links.
- **Success Mint (`#27C99A`):** Completed bookings, paid invoices, operational health indicators.
- **Warning Amber (`#F4B860`):** Pending approvals, overdue tasks, payment retries.
- **Danger Coral (`#F16F79`):** Destructive actions, system errors, critical status warnings.

### Typography & Content
- **Main Text (`#F4F5FA`):** High-readability off-white for headers, values, and essential inputs.
- **Secondary Text (`#A5AABB`):** Muted slate for metadata, column headers, timestamps, and input placeholders.

## Typography

The type hierarchy is powered exclusively by **Inter**, leveraging precise optical tracking and negative tracking on headings to provide an authoritative editorial finish.

- **Numerics:** Enable tabular lining figures (`font-feature-settings: 'tnum' on, 'cv05' on`) across all data tables, metric tiles, and financial summaries to maintain vertical column alignment.
- **Headlines:** Use semi-bold weights (`600`) with tight letter-spacing to emphasize authority and maximize space efficiency in high-density dashboards.
- **Labels:** Uppercase styling paired with `label-sm` is reserved exclusively for table column headers, status tags, and metadata captions.

## Layout & Spacing

This design system uses a 12-column fluid grid system anchored inside responsive constraints to ensure dense operational data remains digestible.

### Layout Specs
- **Desktop (1280px+):** Fixed collapsible sidebar (width: 260px expanded, 72px icon-only), persistent header (height: 64px), 12-column canvas with 1.25rem (20px) gutters and 2rem (32px) screen margins.
- **Tablet (768px - 1279px):** Off-canvas drawer navigation, 8-column layout, 1rem (16px) gutters, 1.5rem (24px) canvas margins.
- **Mobile (<768px):** Bottom utility sheet / hamburger drawer, single-column reflow, 0.75rem (12px) gutters, 1rem (16px) canvas margins.

### Vertical Rhythm
- Maintain a strict 4px/8px modular scale for all intra-component paddings.
- Use `space-md` (12px) for default table cell padding and input interior gaps to ensure compact visual density.

## Elevation & Depth

Visual hierarchy does not rely on heavy drop-shadows, which can muddy dark UI surfaces. Instead, depth is communicated through **tonal stratification** coupled with **luminescent micro-borders**.

1. **Level 0 (Canvas Base):** `#10131C` — flat, non-interactive foundation.
2. **Level 1 (Structural Cards & Tables):** `#191E2B` surface enclosed by a 1px solid `#2B3243` border. Subtle top edge reflection is applied via an inner shadow (`inset 0 1px 0 0 rgba(255, 255, 255, 0.04)`).
3. **Level 2 (Dropdowns, Popovers, & Active State Cards):** `#22293A` background, 1px solid `#374158` border, supported by an ambient directional shadow: `0 12px 28px -6px rgba(0, 0, 0, 0.45)`.
4. **Level 3 (Modals & Critical Sheets):** `#22293A` with a delicate frosted backdrop mask (`rgba(16, 19, 28, 0.8)` with `backdrop-filter: blur(8px)`), framed with a 1px border (`#3B445B`) and shadow `0 24px 48px -12px rgba(0, 0, 0, 0.6)`.

## Shapes

The interface balances sharp productivity with refined modernity by employing distinct corner rounding across different interface tiers.

- **Primary Cards & Containers:** Standardized on `rounded-xl` (1.5rem / 24px) and `rounded-lg` (1rem / 16px) for inner modules to deliver a sleek, contemporary frame.
- **Interactive Controls (Inputs, Buttons, Dropdowns):** Configured with standard rounded corners (0.5rem / 8px) for crisp tactile interaction.
- **Badges, Status Chips, & Avatars:** Fully rounded pill shapes (`rounded-full`) to contrast against rectilinear card layouts.

## Components

### Buttons
- **Primary:** Background `#8B7CFF`, text `#FFFFFF`, font-weight 500, radius 8px. Hover: `#7867F6`, transition 150ms ease. Active: scale 0.98. Focus: 2px ring offset 2px `#8B7CFF`.
- **Secondary:** Background `#191E2B`, border 1px solid `#2B3243`, text `#F4F5FA`. Hover: background `#22293A`, border-color `#3B445B`.
- **Ghost / Tertiary:** Transparent background, text `#A5AABB`. Hover: text `#F4F5FA`, background `#191E2B`.
- **Destructive:** Background `rgba(241, 111, 121, 0.1)`, border 1px solid `rgba(241, 111, 121, 0.25)`, text `#F16F79`. Hover: background `#F16F79`, text `#FFFFFF`.

### Input Fields & Selects
- Height: 40px standard (32px compact in data grids).
- Base: Background `#131824`, border 1px solid `#2B3243`, color `#F4F5FA`, radius 8px, padding `0 12px`.
- Placeholder: `#A5AABB` at 70% opacity.
- Focus: Border `#8B7CFF`, box-shadow `0 0 0 1px #8B7CFF`.
- Prepend/Append Icons: Lucide icons in `#A5AABB` with 16px sizing.

### Cards & Metric Panels
- Base: `#191E2B`, border 1px solid `#2B3243`, border-radius 16px, padding 20px.
- Metric Widget: Includes primary metric (`display` or `headline-lg` in tabular figures), category label (`label-md` in `#A5AABB`), and trend badge showing percentage change with semantic pill treatment.

### Chips & Badges
- Status Pills: 4px vertical, 10px horizontal padding, border-radius 9999px, font size 12px, font weight 500.
  - Active / Success: Background `rgba(39, 201, 154, 0.12)`, border 1px solid `rgba(39, 201, 154, 0.25)`, text `#27C99A`.
  - Pending / Warning: Background `rgba(244, 184, 96, 0.12)`, border 1px solid `rgba(244, 184, 96, 0.25)`, text `#F4B860`.
  - Overdue / Error: Background `rgba(241, 111, 121, 0.12)`, border 1px solid `rgba(241, 111, 121, 0.25)`, text `#F16F79`.
  - Neutral / Draft: Background `rgba(165, 170, 187, 0.1)`, border 1px solid `#2B3243`, text `#A5AABB`.

### Checkboxes & Radio Buttons
- Checkbox: 18x18px, radius 4px, border 1.5px solid `#2B3243`, background `#131824`. Checked: background `#8B7CFF`, border-color `#8B7CFF`, checkmark icon in `#FFFFFF`.
- Radio: 18x18px, fully rounded, identical border states. Selected: solid `#8B7CFF` ring with centered `#FFFFFF` dot.

### Data Tables & Lists
- Container: Surface `#191E2B`, border 1px solid `#2B3243`, radius 16px, overflow hidden.
- Header Row: Background `#131824`, border-bottom 1px solid `#2B3243`, typography `label-sm` uppercase, text `#A5AABB`, height 44px.
- Row: Height 52px, border-bottom 1px solid `#2B3243`, transition background 100ms. Hover: `#1C2232`.
- Cells: Text `#F4F5FA`, typography `body-md` (or `code-num` for financials and dates).