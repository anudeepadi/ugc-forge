# UGC Forge AI Content Factory — Editorial Redesign

**Date:** 2026-05-01  
**Status:** Design Phase  
**Design Direction:** Editorial/Magazine aesthetic with high-contrast monochrome palette and racing red accent

---

## Executive Summary

Complete rebuild of UGC Forge from a production bundle into a distinctive, editorial-style content factory interface. The redesign transforms a utilitarian dark-theme dashboard into a bold, magazine-inspired experience where content generation feels like art direction rather than form-filling.

**Core Goals:**
1. **Visual repolish** — Premium editorial aesthetic with refined typography, dramatic layouts, sophisticated animations
2. **UX flow rethinking** — Guide users through the content factory pipeline with clear workflow progression
3. **Scope expansion** — Add missing views (Exports, Scores) and complete the product vision
4. **Production-grade craft** — Hand-crafted feel with meticulous attention to typographic detail, spacing, and motion

---

## Design Philosophy

### Editorial Content Factory

The interface should feel like you're **art-directing campaigns**, not just generating them. Every interaction should have the weight and intentionality of laying out a magazine spread.

**Aesthetic Pillars:**

1. **Bold Typography** — Large, confident headlines. Refined serif display faces paired with crisp sans-serif body copy. Generous letterspacing. Clear hierarchy.

2. **High Contrast** — Pure black backgrounds, stark white content areas, racing red accents. No gradients, no timid grays. Dramatic contrast ratios.

3. **Asymmetric Layouts** — Break the grid intentionally. Overlap elements. Use diagonal flow. Balance tension with whitespace.

4. **Purposeful Motion** — Orchestrated page transitions. Staggered reveals. Scroll-triggered animations that feel editorial (fade-up, slide-in, scale) rather than gimmicky (bounce, spin, wiggle).

5. **Editorial Components** — Stat cards that look like magazine callouts. Form fields that feel like editorial interviews. Progress indicators that mimic print design elements.

---

## Architecture

### Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite (fast HMR, optimized builds)
- **Routing:** React Router v6 (client-side, nested routes)
- **Styling:** Tailwind CSS + CSS custom properties for design tokens
- **Animation:** Framer Motion (page transitions, scroll animations, micro-interactions)
- **Icons:** Lucide React (consistent, minimal icon set)
- **State:** React Context API for global state, local hooks for UI state
- **Data:** Mock data layer (deterministic, swappable with real APIs later)

### Project Structure

```
ugc-forge/
├── public/
│   └── fonts/              # Self-hosted web fonts
├── src/
│   ├── components/
│   │   ├── editorial/      # Editorial layout modules
│   │   │   ├── Hero.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ContentGrid.tsx
│   │   │   ├── FeatureBlock.tsx
│   │   │   ├── Marquee.tsx
│   │   │   └── SectionHeader.tsx
│   │   ├── ui/             # Base UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Select.tsx
│   │   └── layout/         # Layout components
│   │       ├── Navigation.tsx
│   │       ├── Sidebar.tsx
│   │       └── PageShell.tsx
│   ├── pages/
│   │   ├── Command.tsx     # Dashboard/overview
│   │   ├── Factory.tsx     # Campaign creation
│   │   ├── Scripts.tsx     # Script library
│   │   ├── Renders.tsx     # Render queue
│   │   ├── Exports.tsx     # Export/batch manager (NEW)
│   │   └── Scores.tsx      # Scoring dashboard (NEW)
│   ├── lib/
│   │   ├── mock-data.ts    # Deterministic mock data
│   │   ├── animations.ts   # Shared Framer Motion configs
│   │   └── utils.ts        # Helper functions
│   ├── styles/
│   │   ├── tokens.css      # Design system variables
│   │   ├── editorial.css   # Editorial-specific utilities
│   │   └── index.css       # Global styles
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Routing Structure

```
/                   → Command (Dashboard/Overview)
/factory            → Campaign Factory (creation form)
/scripts            → Script Room (generated scripts)
/renders            → Render Bay (video queue)
/exports            → Export Manager (batch downloads) [NEW]
/scores             → Scoring Dashboard (analytics) [NEW]
```

---

## Typography System

### Font Pairing: Classic Editorial

**Display/Headline Font:** A refined serif with strong character  
**Recommendation:** Use a high-quality serif like:
- **Freight Display** (elegant, high contrast, editorial classic)
- **Tiempos Headline** (contemporary, sophisticated)
- **Chronicle Display** (modern take on Century, very readable)
- **Fallback:** Georgia (web-safe, decent serif alternative)

**Body/UI Font:** A crisp, neutral sans-serif  
**Recommendation:** Use a refined grotesque like:
- **Suisse Int'l** (Swiss precision, very clean)
- **Neue Haas Grotesk** (Helvetica refinement)
- **Inter** with tight tracking (web-optimized, free)
- **Fallback:** -apple-system, system-ui

**Monospace Font (for code/data):**  
- **JetBrains Mono** or **Fira Code** (modern, ligatures)
- **Fallback:** Menlo, Monaco, monospace

### Type Scale (Tailwind Extension)

```css
/* Design Tokens */
:root {
  /* Display (Headlines) */
  --font-display: 'Freight Display', Georgia, serif;
  --font-body: 'Suisse Int\'l', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Scale (1.250 Major Third) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.25rem;      /* 20px */
  --text-xl: 1.563rem;     /* 25px */
  --text-2xl: 1.953rem;    /* 31px */
  --text-3xl: 2.441rem;    /* 39px */
  --text-4xl: 3.052rem;    /* 49px */
  --text-5xl: 3.815rem;    /* 61px */
  --text-6xl: 4.768rem;    /* 76px */
  --text-7xl: 5.96rem;     /* 95px */
  
  /* Line Heights */
  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
  
  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
}
```

### Typography Usage Guidelines

**Display Headlines (h1, feature titles):**
- Font: Display serif
- Size: 4xl–7xl
- Weight: 600–700
- Line height: tight (1.1)
- Letter spacing: tight (-0.02em)
- Color: White on black, black on white

**Section Headers (h2, page titles):**
- Font: Display serif
- Size: 3xl–4xl
- Weight: 600
- Line height: snug (1.3)
- Letter spacing: normal
- Color: White or Racing Red accent

**Body Text:**
- Font: Sans-serif
- Size: base–lg
- Weight: 400–500
- Line height: normal–relaxed (1.5–1.7)
- Letter spacing: normal
- Color: White (90% opacity) for readability on black

**Labels/Metadata:**
- Font: Sans-serif
- Size: xs–sm
- Weight: 500–600
- Line height: tight
- Letter spacing: wide (0.05em, uppercase)
- Color: White (60% opacity)

**Data/Monospace:**
- Font: Monospace
- Size: sm–base
- Weight: 400
- For code blocks, terminal output, IDs

---

## Color System

### Palette: High-Contrast Monochrome + Racing Red

**Core Colors:**

```css
:root {
  /* Monochrome */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-gray-dark: #1A1A1A;    /* Slightly off-black for layering */
  --color-gray-mid: #808080;      /* 50% gray for borders/dividers */
  --color-gray-light: #E5E5E5;    /* Subtle contrast on white */
  
  /* Racing Red Accent */
  --color-red: #DC0000;           /* Pure racing red */
  --color-red-dark: #A50000;      /* Darker for hover states */
  --color-red-light: #FF4444;     /* Lighter for highlights */
  
  /* Opacity Variants (for text on black) */
  --white-90: rgba(255, 255, 255, 0.9);
  --white-70: rgba(255, 255, 255, 0.7);
  --white-50: rgba(255, 255, 255, 0.5);
  --white-30: rgba(255, 255, 255, 0.3);
  --white-10: rgba(255, 255, 255, 0.1);
  
  /* Semantic Colors */
  --color-success: #00C853;       /* Green for positive states */
  --color-warning: #FFB300;       /* Amber for caution */
  --color-error: var(--color-red);
}
```

### Color Usage Rules

1. **Backgrounds:**
   - Primary: Pure black (#000)
   - Cards/Panels: White (#FFF) with subtle shadow
   - Hover states: Gray-dark (#1A1A1A)

2. **Text:**
   - Primary headings: White on black, Black on white
   - Body text: White-90 on black for readability
   - Metadata/labels: White-70 on black
   - Disabled: White-30

3. **Accents (Racing Red):**
   - Primary CTAs (Generate, Export, etc.)
   - Active states in navigation
   - Key data points / highlights
   - Progress indicators
   - Links and interactive elements
   - Error states

4. **Borders/Dividers:**
   - Subtle: White-10 on black
   - Medium: White-30 on black
   - Strong: Gray-mid (#808080)

5. **Success/Warning States:**
   - Success: Green (#00C853) — used sparingly
   - Warning: Amber (#FFB300) — used sparingly
   - Keep these minimal to preserve monochrome dominance

**Design Principle:** 95% of the interface is black/white. Racing red appears only on high-importance elements. Green/amber used only for status indicators.

---

## Layout System

### Grid Structure

**Base Grid:** 12-column responsive grid with asymmetric tendencies

```css
/* Grid System */
:root {
  --grid-cols: 12;
  --gutter: 2rem;         /* 32px */
  --margin: 4rem;         /* 64px on desktop */
  --margin-mobile: 1.5rem; /* 24px on mobile */
}

/* Breakpoints (Tailwind defaults) */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Layout Patterns

**1. Dashboard Hero (Command page)**
- Full-width hero block at top (headline + stats)
- Asymmetric 2-column grid below (8-col left, 4-col right)
- Left: Main content (campaigns, queue)
- Right: Sidebar (pipeline health, quick actions)

**2. Content Grid (Scripts, Renders)**
- Masonry-style card grid
- Cards can span 4, 6, or 8 columns
- Variable heights based on content
- Overlap elements intentionally for visual interest

**3. Form Layout (Factory)**
- Single-column, max-width 800px
- Section headers break rhythm
- Inputs with generous spacing
- Sticky sidebar for gatekeeper/output preview

**4. Data Dashboard (Scores, Exports)**
- Modular dashboard blocks
- Mix of chart cards, stat blocks, tables
- Filterable, sortable data views

### Editorial Layout Principles

1. **Generous Whitespace** — Don't cram. Let content breathe. 3-4rem vertical spacing between major sections.

2. **Intentional Asymmetry** — Avoid perfectly centered layouts. Offset headlines. Use 8-4 column splits instead of 6-6.

3. **Overlap & Layering** — Cards can overlap slightly. Use z-index to create depth. Shadows imply elevation.

4. **Alignment Variety** — Mix left-aligned, right-aligned, and centered elements across a page. But within a section, maintain consistency.

5. **Rhythm Breaks** — Interrupt predictable patterns. A full-width image. A pull quote. A horizontal rule. Keep it dynamic.

---

## Page Designs

### 1. Command (Dashboard)

**Purpose:** Overview of the entire content factory. Campaign status, pipeline health, quick actions.

**Layout:**
- Full-width hero with headline + dual CTAs
- 4 stat cards in a row
- Asymmetric 2-column grid: Active campaign (left) + Pipeline health sidebar (right)
- Render queue panel below

**Components:** Hero, StatCards, Pipeline status list, Campaign card, Render queue card

**Animations:** Staggered fade-in for stat cards, hero fade-up on load, card lift on hover

---

### 2. Factory (Campaign Creation)

**Purpose:** Single unified form to create a campaign. Product brief → Gatekeeper → Generate.

**Layout:**
- Single-column form (max-width 800px)
- Sticky sidebar on right (gatekeeper panel + generate button)
- Section headers break up form sections

**Components:** Form inputs (text, textarea, select), Gatekeeper panel, Generate button

**Interactions:** Form validation with red borders, loading state, success redirect

---

### 3. Scripts (Script Library)

**Purpose:** View all generated scripts. Filter, preview, edit, send to render.

**Layout:**
- Section header with filter/sort controls
- Masonry grid of script cards (3 columns desktop)
- Empty state when no scripts

**Components:** ScriptCards with hook/body/CTA, filter controls, preview modal

**Animations:** Staggered fade-in for cards, hover lift, filter transitions

---

### 4. Renders (Render Queue)

**Purpose:** View render jobs in progress and completed. Video preview, download, export.

**Layout:**
- Section header with status filter
- Grid of render cards (3-4 columns)
- Each card shows thumbnail, metadata, action button

**Components:** RenderCards with thumbnail/spinner, status indicators, action buttons

**Animations:** Progress spinner rotation, completion checkmark, thumbnail scale on hover

---

### 5. Exports (NEW: Export Manager)

**Purpose:** Batch download completed renders. Export to CSV with metadata.

**Layout:**
- Section header
- Form with batch selection, export format, metadata options
- Sticky export preview panel
- Export history table below

**Components:** Checkboxes, radio buttons, preview panel, history table

**Interactions:** Selection updates preview, export triggers download, history re-download

---

### 6. Scores (NEW: Scoring Dashboard)

**Purpose:** View viral score estimates for all variants. Sort by score, filter by campaign.

**Layout:**
- Section header with filters
- Leaderboard card (top 5 performers)
- Stats sidebar (avg, high, low, distribution chart)
- Grid of score cards

**Components:** Leaderboard, stat blocks, score cards with large numbers

**Animations:** Number count-up on load, leaderboard stagger, score pulse on hover

---

## Navigation & Sidebar

**Sidebar Design:**
- Fixed left sidebar (collapsible on mobile)
- Width: 240px desktop, 64px collapsed (icons only)
- Background: Black with subtle border
- Sections: Workspace, Analytics, Stack
- Footer: MVP badge + theme toggle

**Navigation Items:**
- Icon + label, active state with racing red accent
- Hover: Slight background change

**Mobile:** Hamburger menu with full-screen overlay

---

## Animation System

### Framer Motion Configuration

**Page Transitions:**
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1] // Ease-out quart
};
```

**Staggered Children:**
```tsx
const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

**Hover Effects:**
```tsx
const cardHover = {
  y: -4,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  transition: { duration: 0.2 }
};
```

### Animation Principles

1. **Purposeful, not gratuitous** — Guide attention, reveal hierarchy, provide feedback
2. **Orchestrated reveals** — Stagger component entrance to create reading order
3. **Smooth state transitions** — No snapping, smooth loading/validation states
4. **Scroll-triggered effects** — Optional, use sparingly
5. **Performance-first** — Prefer CSS transforms over layout properties

---

## Responsive Design

### Breakpoint Strategy

- **Mobile (< 640px):** Single column, stacked layout, hamburger nav
- **Tablet (640px–1024px):** 2-column grids, collapsible sidebar
- **Desktop (1024px+):** Full layout with sidebar, 3-4 column grids
- **Large (1536px+):** Max-width container (1440px)

### Mobile-First Approach

Build mobile layout first, enhance for larger screens. Use Tailwind responsive prefixes.

### Touch Targets

- Minimum 44x44px for all interactive elements on mobile
- Increased padding on buttons/links

---

## Accessibility

### Standards

- **WCAG 2.1 AA compliance** minimum
- **Semantic HTML:** Proper heading hierarchy, landmarks
- **Keyboard navigation:** All interactions accessible via keyboard
- **Focus indicators:** Visible racing red focus rings
- **ARIA labels:** Descriptive labels for icon-only buttons

### Color Contrast

- Black/white: 21:1 (AAA)
- White-90 on black: ~17:1 (AAA)
- Racing red checked for minimum 4.5:1 contrast

### Screen Readers

- All images have alt text
- Form inputs have labels
- Loading states announced via `aria-live`
- Status updates announced

### Reduced Motion

Respect `prefers-reduced-motion` media query to disable animations.

---

## Performance

### Budget

- **Initial JS bundle:** <100kb gzipped
- **CSS:** <20kb gzipped
- **Fonts:** <200kb total (subset + WOFF2)
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s

### Optimization Strategies

1. **Code splitting:** Lazy-load routes
2. **Font optimization:** Subset fonts, preload critical
3. **Image optimization:** WebP, lazy-load
4. **Tree shaking:** Remove unused Tailwind classes
5. **Compression:** Brotli on server

### Lighthouse Targets

- Performance: 90+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

---

## Implementation Phases

### Phase 1: Foundation (MVP)
**Goal:** Core architecture + 3 main pages

- Vite + React + TypeScript + Tailwind setup
- Design system tokens
- Base UI components (Button, Input, Card)
- Layout components (Sidebar, Navigation)
- Pages: Command, Factory, Scripts
- Mock data layer
- Basic animations

**Deliverable:** Functional 3-page prototype

### Phase 2: Complete Feature Set
**Goal:** Add remaining pages + polish

- Pages: Renders, Exports, Scores
- Editorial modules (Hero, StatCard, etc.)
- Advanced animations
- Responsive refinements
- Accessibility audit

**Deliverable:** Full 6-page app

### Phase 3: Polish & Refinement
**Goal:** Production-ready quality

- Performance optimization
- Cross-browser testing
- Micro-interactions
- Error states
- Documentation

**Deliverable:** Production-grade app

---

## Testing Strategy

- **Unit Tests:** Component rendering, utility functions
- **Integration Tests:** User flows, navigation, forms
- **Visual Regression:** Screenshot comparisons (Chromatic)
- **Accessibility:** Automated (axe-core) + manual
- **Performance:** Lighthouse CI

---

## Future Considerations

### Backend Integration
- Swap mock data with API client
- Add loading states, error handling
- Optimistic updates

### Real AI Integration
- Websocket/SSE for real-time progress
- Queueing system for long jobs
- Retry logic, cost tracking

### Additional Features
- Campaign history
- Multi-user collaboration
- Template library
- A/B testing results
- Analytics dashboard
- Export to ad platforms

---

## Success Metrics

### Design Goals
1. **Memorable aesthetic** — Distinctive, not generic
2. **Clear workflow** — Factory → Scripts → Renders → Exports feels obvious
3. **Professional craft** — Hand-crafted typography, spacing, animations
4. **Fast and accessible** — Meets performance and a11y standards

### KPIs (if deployed)
- Time to create first campaign
- Completion rate for campaign flow
- Page engagement
- Export usage
- User feedback on design/UX

---

## Conclusion

This design transforms UGC Forge from a utilitarian prototype into a distinctive, magazine-inspired content factory with:

- **Strong visual identity** (editorial typography, high-contrast monochrome, racing red)
- **Modular architecture** (flexible components that compose into varied layouts)
- **Complete feature set** (6 pages covering full content pipeline)
- **Production-grade craft** (accessibility, performance, responsive, animations)

The result should feel like art-directing campaigns rather than filling forms — every interaction has weight, every screen has visual interest, and the overall experience is memorable and professional.

**Next step:** Implementation planning with detailed task breakdown.
