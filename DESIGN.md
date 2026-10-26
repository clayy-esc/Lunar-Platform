---
name: Lunar
description: Fast, open, and conversational survey creation with visual logic routing and rich analytics, guided by the Lunar surveyor mascot.
colors:
  primary: "#2563eb"
  primary-dark: "#60a5fa"
  accent-amber: "#f59e0b"
  accent-amber-dark: "#fbbf24"
  neutral-bg: "#f8fafc"
  neutral-bg-dark: "#0b0f19"
  card: "#ffffff"
  card-dark: "#111827"
  foreground: "#0f172a"
  foreground-dark: "#f8fafc"
  border: "#e2e8f0"
  border-dark: "#1e293b"
  muted: "#f1f5f9"
  muted-dark: "#1e293b"
  muted-foreground: "#5a6b85"
  muted-foreground-dark: "#94a3b8"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.foreground}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
---

# Design System: Lunar

## Overview

**Creative North Star: "Nocturnal Surveyor"**

Lunar takes its design DNA directly from the Lunar owl mascot: intelligent nocturnal slate plumage (`#0f172a`), active surveyor cobalt (`#2563eb`), warm golden amber gaze (`#f59e0b`), and clean warm ivory/slate surfaces (`#f8fafc`). Instead of generic SaaS styling, Lunar balances sharp precision with warm, approachable clarity. Interactions feel purposeful and grounded, allowing survey creators to wire complex conditional pathways with ease and respondents to answer questions with effortless focus.

The system relies on high-contrast semantic typography, calm tinted neutrals, and selective bright focal accents. Every surface feels alive through deliberate micro-interactions, responsive hover lifts, and frosted glass overlays.

**Key Characteristics:**
- **Mascot Palette Alignment:** Nocturnal slate structure accented by surveyor cobalt and warm golden amber signals.
- **Deep Void Canvas:** 24px dot-matrix background that anchors node logic flows.
- **Tinted Slate Neutrals:** Rejection of cold dead grays in favor of slate-tinted tones derived from owl plumage.
- **State-Driven Elevation:** Subtle frosted glass panels (`backdrop-filter: blur(16px)`) with crisp 1px borders and diffuse drop-shadows.

## Colors

The Lunar palette balances deep nocturnal plumage with decisive, high-legibility action tones.

### Primary
- **Surveyor Cobalt** (`#2563eb`): Clean, vibrant blue inspired by the mascot's pen and survey clipboard. Used for active focus, interactive controls, and links.
- **Nocturnal Slate** (`#0f172a`): Deep navy-slate feather tone used for flagship buttons, titles, and structural anchors.

### Accents
- **Mascot Golden Amber** (`#f59e0b`): High-energy golden yellow inspired by the owl's eyes and feet. Used for milestones, completion badges, and progress bar highlights.

### Neutral
- **Clean Ivory Slate** (`#f8fafc` light background): Soft, low-fatigue background reminiscent of the owl's warm chest feathers.
- **Deep Void** (`#0b0914` dark background): Very dark space-tinted slate for rich contrast without OLED harshness.
- **Starlight Card** (`#ffffff` light card): Crisp foreground surface for forms, cards, and inspector panels.
- **Midnight Nebula** (`#131022` dark card): Subtle indigo-tinted container background.
- **Deep Space Indigo** (`#181124` light foreground): High-contrast text ink with a rich violet undertone.
- **Starlight White** (`#f1ecf8` dark foreground): Soft, readable text color for dark mode.
- **Pale Nebula Stroke** (`#e6e0f8` light border): Delicate boundary delimiter for cards, tables, and inputs.
- **Deep Nebula Stroke** (`#272144` dark border): Boundary line for dark mode elements.
- **Soft Indigo Muted** (`#f0ebfa` light muted): Secondary button and pill background.
- **Dust Lane Muted** (`#6d5f8a` light muted foreground): Secondary metadata, timestamps, and input placeholders.

### Named Rules
**The Tinted Neutral Rule.** Pure un-tinted grays (`#808080`, `#999999`) and stark sterile blacks (`#000000`) are banned. Every neutral carries a deliberate trace of indigo/violet/blue to ground the workspace in the cosmic aesthetic and prevent clinical sterility.

**The 10% Accent Rule.** The primary accent is reserved strictly for focal interactions (primary CTA, active navigation item, logic connection edges, and selected choices). It must occupy ≤10% of any viewport to preserve maximum visual impact.

## Typography

**Display & Body Font:** Manrope (`ui-sans-serif, system-ui, sans-serif`)  
**Data & Logic Mono Font:** DM Mono (`monospace`)  
**Custom Survey Font Choices:** Inter, Merriweather, Roboto (configurable per-survey in Theme Studio)

**Character:** Clean, humanist geometry with tight negative tracking on headings for an authoritative, editorial cadence, contrasted with DM Mono for graph logic, tokens, and technical status chips.

### Hierarchy
- **Display** (Bold 700, `clamp(2rem, 5vw, 3rem)`, line-height: 1.15, letter-spacing: -0.02em): Public survey titles and hero banners.
- **Headline** (SemiBold 600, `1.5rem`, line-height: 1.25, letter-spacing: -0.02em): Page headers, modal titles, analytics section headings.
- **Title** (SemiBold 600, `1.125rem`, line-height: 1.4, letter-spacing: -0.01em): Card titles, question headers, drawer titles.
- **Body** (Regular 400, `0.875rem` / `14px`, line-height: 1.5, letter-spacing: normal): General interface copy, form labels, survey descriptions.
- **Label** (Medium 500, `0.75rem` / `12px`, DM Mono, letter-spacing: 0.05em): Node IDs, logic flow edge conditions, question counters, status badges.

### Named Rules
**The Editorial Mono Rule.** DM Mono is dedicated strictly to programmatic nodes, graph edge logic expressions, ID chips, and status counts—never for conversational survey questions or standard paragraph prose.

## Layout

- **Spatial Canvas:** Root surfaces display a subtle radial dot-matrix (`radial-gradient(circle at 1px 1px, color-mix(...) 7%, transparent 0)` on a `24px x 24px` grid).
- **Rhythm Scale:** 4px baseline. Spacing steps: 4px (`xs`), 8px (`sm`), 16px (`md`), 24px (`lg`), 32px (`xl`), 48px (`2xl`).
- **Dashboard Grid:** Responsive 12-column layout with 24px gap, animating into place via smooth `rise-in` keyframe (450ms ease-out).
- **Public Respondent Shell:** Centered, distraction-free container clamped to `max-w-2xl` on mobile and tablet, expanding to `max-w-3xl` on wide viewports.

## Elevation & Depth

SurveyNexus uses a hybrid model of soft glassmorphism (`backdrop-filter: blur(16px)`) and state-responsive elevation over a flat dot-matrix base. Rest states remain quiet, while interactive elements lift towards the user on engagement.

### Shadow Vocabulary
- **subtle-option** (`box-shadow: 0 4px 12px color-mix(in srgb, currentColor 4%, transparent)`): Option tiles and small cards at rest.
- **dashboard-card** (`box-shadow: 0 12px 30px color-mix(in srgb, var(--foreground) 6%, transparent)`): Dashboard cards and modules at rest.
- **dashboard-hover** (`box-shadow: 0 18px 38px color-mix(in srgb, var(--foreground) 11%, transparent)`): Lift state on dashboard cards (`transform: translateY(-3px)`).
- **workspace-panel** (`box-shadow: 0 18px 50px color-mix(in srgb, var(--foreground) 7%, transparent)`): Frosted workspace panels, builder drawers, and floating toolbars.
- **public-survey-card** (`box-shadow: 0 24px 70px color-mix(in srgb, currentColor 10%, transparent)`): Respondent question card floating on blurred backdrop (`backdrop-filter: blur(18px)`).

### Named Rules
**The State-Responsive Elevation Rule.** Surfaces rest with low, diffuse shadows and clean borders. High elevation and vertical lift (`translateY(-2px)` or `-3px`) are earned exclusively through user interaction (hover, active focus, or modal presentation).

## Shapes

- **Corner Radii:**
  - Micro (`rounded-md` / 8px): Buttons, text inputs, select dropdowns, search bars.
  - Standard Card (`rounded-xl` / 12px–16px): Content containers, builder blocks, dialog windows.
  - Public Survey Card (`rounded-2xl` / 20px–22px): Respondent question card container.
  - Pill (`rounded-full` / 9999px): Status badges, progress chips, toggle switches.
- **Borders:** Crisp `1px solid var(--border)` on cards, inputs, and dividers. Avoids borderless floating blocks in dense creator screens.

## Components

### Buttons
- **Shape:** Rounded rectangle (`rounded-md`, 8px).
- **Primary:** `bg-primary text-primary-foreground hover:bg-primary/90`. Focused with `ring-2 ring-primary ring-offset-2`.
- **Secondary:** `bg-muted text-foreground hover:bg-muted/80`.
- **Outline:** `border border-border bg-background hover:bg-muted text-foreground`.
- **Ghost:** `hover:bg-muted hover:text-foreground text-foreground`.
- **Danger:** `bg-red-500 text-white hover:bg-red-600`.
- **Transitions:** `transition-colors duration-150 ease-in-out`.

### Cards & Panels
- **Dashboard Card:** `rounded-xl border border-border bg-card p-6`, transitions with `box-shadow` and `translateY(-3px)`.
- **Workspace Panel:** Glassmorphic container with `backdrop-blur-md bg-card/90 border border-border`.
- **Public Survey Card:** Ultra-smooth glass card with `backdrop-filter: blur(18px)` and deep ambient shadow.

### Inputs & Fields
- **Style:** Height 40px (`h-10`), `rounded-md`, `border border-border bg-background px-3 py-2 text-sm`.
- **Focus:** `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- **Error State:** `border-red-500 focus-visible:ring-red-500 text-red-500`.

### Badges & Status Chips
- **Style:** `rounded-full px-2.5 py-0.5 text-xs font-semibold`.
- **Variants:** Default (primary), Secondary (muted), Outline, Success (emerald tint), Warning (amber tint), Danger (rose tint).

### Logic Flow Canvas (`@xyflow/react`)
- **Canvas Backdrop:** Tinted card blend (`color-mix(in srgb, var(--card) 88%, var(--background))`).
- **Nodes:** Structured card blocks with status indicator borders and port anchors.
- **Controls Panel:** Floating pill container with `12px` radius and DM Mono attribution.
- **Edges:** Primary accent stroke with DM Mono condition label badges.

## Do's and Don'ts

### Do:
- **Do** always use tinted neutrals (`--background`, `--muted`, `--border`) instead of pure grayscale or `#000000`.
- **Do** reserve the primary accent color (`#0f766e` / `#f2b84b`) for focal interactive elements and active states.
- **Do** use `DM Mono` for question IDs, flow logic conditions, and analytics metrics to give a crisp architectural feel.
- **Do** support keyboard-first navigation and clear focus rings (`ring-2 ring-primary`) on all respondent inputs.
- **Do** maintain responsive touch target heights of at least 44px (`h-11`) for mobile respondent option tiles.

### Don't:
- **Don't** use generic un-tinted gray (`#808080`, `#9e9e9e`) for text, borders, or backgrounds.
- **Don't** nest cards inside cards. Use subtle dividing borders or background tonal shifts instead.
- **Don't** use harsh neon gradient headers or generic SaaS icon-in-a-box headers above every title.
- **Don't** hide respondent progress or make questionnaire inputs cramped on mobile viewports.
- **Don't** use bouncy or elastic easing curves; stick to smooth, snappy `180ms ease` transitions.
