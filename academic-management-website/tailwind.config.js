/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // Legacy tokens (pre-DESIGN_SYSTEM.md) — deprecated, scheduled for removal in
        // REFACTOR_PLAN.md Phase 37 once no component references them anymore.
        'legacy-primary': {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1E3A8A',
        },
        'legacy-cta': {
          DEFAULT: '#F97316',
          dark: '#EA580C',
        },
        'legacy-success': {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        'legacy-danger': {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        'legacy-warning': {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        'legacy-surface': '#F8FAFC',
        'legacy-ink': '#1E293B',

        // Semantic tokens — DESIGN_SYSTEM.md §3.2 (Surface & Background, Action, Nav,
        // Progress, Status). Text/Border/Focus tokens live in textColor/borderColor/
        // ringColor below to avoid double-prefixed utility classes (e.g. border-border-*).
        background: '#F8FAFC',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1F5F9',
          sunken: '#F1F5F9',
          inverse: '#0F172A',
          'brand-muted': '#F0FDFA',
        },
        action: {
          'primary-bg': '#0D9488',
          'primary-bg-hover': '#0F766E',
          'primary-bg-active': '#115E59',
          'secondary-border': '#CBD5E1',
          'secondary-text': '#334155',
          'secondary-bg-hover': '#F1F5F9',
          'tertiary-text': '#0F766E',
          'tertiary-bg-hover': '#F0FDFA',
          'disabled-bg': '#F1F5F9',
          'disabled-text': '#94A3B8',
        },
        nav: {
          'selected-bg': '#F0FDFA',
          'selected-text': '#0F766E',
          'selected-indicator': '#0D9488',
        },
        progress: {
          fill: '#14B8A6',
          track: '#F1F5F9',
        },
        status: {
          'success-text': '#15803D',
          'success-icon': '#16A34A',
          'success-bg': '#DCFCE7',
          'warning-text': '#92400E',
          'warning-icon': '#D97706',
          'warning-bg': '#FEF3C7',
          'danger-text': '#DC2626',
          'danger-icon': '#DC2626',
          'danger-bg': '#FEE2E2',
          'info-text': '#1D4ED8',
          'info-icon': '#2563EB',
          'info-bg': '#DBEAFE',
        },
      },
      // Text tokens — DESIGN_SYSTEM.md §3.2 (Text). Kept in textColor (not colors) so
      // `text-primary` doesn't double-prefix into `text-text-primary`.
      textColor: {
        primary: '#0F172A',
        secondary: '#475569',
        tertiary: '#64748B',
        placeholder: '#94A3B8',
        disabled: '#CBD5E1',
        inverse: '#FFFFFF',
        link: '#0F766E',
        brand: '#0F766E',
      },
      // Border tokens — DESIGN_SYSTEM.md §3.2 (Border). Kept in borderColor (not colors)
      // so `border-default` doesn't double-prefix into `border-border-default`.
      borderColor: {
        default: '#E2E8F0',
        muted: '#F1F5F9',
        strong: '#CBD5E1',
        brand: '#14B8A6',
        danger: '#DC2626',
      },
      // Focus ring — DESIGN_SYSTEM.md §3.2 (`focus-ring`, 2px offset 2px). Width/offset
      // are applied per-component (ring-2 ring-offset-2 ring-focus), starting Phase 11.
      ringColor: {
        focus: '#14B8A6',
      },
      // action-cta-bg / action-cta-bg-hover (DESIGN_SYSTEM.md §3.2) are gradients, not
      // flat colors — encoded as backgroundImage, used via `bg-cta-gradient`. Direction
      // (`to right`) is not specified in DESIGN_SYSTEM.md; picked as a reasonable default,
      // to be confirmed against the Button `cta` variant mockup in Phase 11.
      backgroundImage: {
        'cta-gradient': 'linear-gradient(to right, #0D9488, #14B8A6)',
        'cta-gradient-hover': 'linear-gradient(to right, #0F766E, #0D9488)',
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
      },
      // Typography scale — DESIGN_SYSTEM.md §4. Phase 10 deliberately left §4 out of
      // scope; added here in Phase 12 because FormField (§11) needs text-body-sm/
      // text-caption as real tokens, and reuse across Stage C phases 13-16 is expected.
      // `text-display` (Public Hero, has a separate mobile breakpoint value) is excluded
      // — no consumer needs it yet; add it when a Public Hero phase requires it.
      fontSize: {
        h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h4: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      // Z-index scale — DESIGN_SYSTEM.md §6. Same rationale as fontSize above: Phase 10
      // left §6 out of scope; added here because DateRangeInput's popover (Component
      // System §3.2) needs z-dropdown. Full scale added together (not just z-dropdown)
      // since z-index values are only meaningful relative to each other — picking them
      // piecemeal across later phases (Modal, Toast, Sidebar) risks stacking conflicts.
      zIndex: {
        sticky: '10',
        dropdown: '20',
        'overlay-nav': '30',
        modal: '40',
        toast: '50',
      },
      // Sidebar width — single source of truth for SidebarNav/AppShellLayout (Phase 15),
      // shared via Tailwind's default spacing scale so both `w-sidebar` and `ml-sidebar`
      // resolve to the same value.
      spacing: {
        sidebar: '260px',
      },
      borderRadius: {
        card: '20px',
        'radius-sm': '6px',
        'radius-md': '8px',
        'radius-lg': '12px',
        'radius-full': '9999px',
      },
      boxShadow: {
        soft: '0 4px 16px rgba(15,23,42,0.06)',
        elevated: '0 12px 32px rgba(15,23,42,0.12)',
        modal: '0 20px 48px rgba(15,23,42,0.18)',
      },
    },
  },
  plugins: [],
}
