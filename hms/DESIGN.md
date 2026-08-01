---
name: HMS UI Design System
description: A calm, structured, and precise clinical interface system for Hospital Management.
colors:
  primary: "#0ea5e9"
  primary-dark: "#0369a1"
  secondary: "#6366f1"
  neutral-bg: "#ffffff"
  neutral-surface: "#f8fafc"
  neutral-border: "#e2e8f0"
  neutral-ink: "#0f172a"
  neutral-muted: "#64748b"
  danger: "#ef4444"
  success: "#22c55e"
typography:
  display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "12px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  input-default:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: HMS UI Design System

## 1. Overview

**Creative North Star: "The Clinical Console"**

The HMS design system is a structured, utility-first UI focused on clarity, stability, and speed of interaction. Under busy clinical environments, doctors, nurses, and technicians need high readability and unmistakable affordances. We reject the saturated "SaaS-cream" aesthetic, glassmorphism blurs, and over-rounded inputs. The interface uses flat surface layers, crisp borders, and a cool, calm palette.

**Key Characteristics:**
- Flat layouts at rest with sharp physical borders.
- Safe action verification (prominent disabled states and clear loaders).
- High-contrast typography optimized for clinic-lighting environments.

## 2. Colors

Calm clinical palette using professional slate neutrals, crisp white backings, and high-contrast blue/indigo primary accents.

### Primary
- **Clinical Blue** (#0ea5e9): Primary action indicators, accents, and high-frequency active states.
- **Deep Blue** (#0369a1): Primary hover and active button state backgrounds.

### Secondary
- **Operational Purple** (#6366f1): Secondary badge categories and specific status signals.

### Neutral
- **Ink** (#0f172a): Main body text and heavy title copy.
- **Slate Border** (#e2e8f0): Physical borders separating grid components and inputs.
- **Surface** (#f8fafc): Background color for cards, panels, and table headers.
- **Muted** (#64748b): Secondary labels and metadata text.

### Named Rules
**The Rarity Rule.** The primary accent colors (#0ea5e9, #6366f1) must occupy ≤10% of any given dashboard screen. Use them strictly to draw attention to focus paths.

## 3. Typography

**Display Font:** Instrument Sans (with fallback system-ui, sans-serif)
**Body Font:** Instrument Sans (with fallback system-ui, sans-serif)

### Hierarchy
- **Display** (700, clamp(2rem, 4vw, 3rem), 1.15): Major overview numbers, big stat screens.
- **Headline** (600, 24px, 1.25): Modal titles and main feature headings.
- **Title** (600, 16px, 1.35): Section and table sub-headings.
- **Body** (400, 14px, 1.5): Standard data values, form inputs, and clinical reports. Max line-length of 75ch.
- **Label** (600, 12px, 0.05em): Uppercase form headings and badge categories.

## 4. Elevation

The system is flat-by-default to ensure structure is created by physical borders, not soft shadows that can blur under harsh ambient room lights.

### Named Rules
**The Flat-By-Default Rule.** Surfaces must remain flat (no box-shadow) at rest. Subtle, tight shadows are allowed only on floating elements like Modals, Tooltips, or Toast messages.

## 5. Components

### Buttons
- **Shape:** Soft-square corners (12px radius).
- **Primary:** Background (#0ea5e9), text (#ffffff), padding (10px 16px).
- **Hover / Focus:** Transitions to (#0369a1) on hover; reveals a 2px offset sky-500 outline ring on keyboard focus.

### Cards / Containers
- **Corner Style:** Rounded-md (12px).
- **Background:** White (#ffffff) or Surface (#f8fafc).
- **Border:** Slate Border (#e2e8f0) 1px solid.
- **Internal Padding:** Spacing-lg (24px) for cards, Spacing-md (16px) for headers.

### Inputs / Fields
- **Style:** Background (#ffffff), text (#0f172a), border 1px solid (#e2e8f0), rounded-md (12px).
- **Focus:** 2px ring glow of Clinical Blue (#0ea5e9).
- **Error:** 1px border (#ef4444) with red text helper messages.

## 6. Do's and Don'ts

### Do:
- **Do** maintain a strict 4.5:1 text-to-background contrast ratio for all data outputs and placeholder texts.
- **Do** disable buttons and show active loading spinners during form submissions or api calls.
- **Do** use horizontal layouts with clear 1px borders to separate table data instead of nested card blocks.

### Don't:
- **Don't** use border-radius larger than 12px for cards or inputs.
- **Don't** use decorative gradient text or glassmorphism backing blurs.
- **Don't** add colored side-stripe borders (e.g. `border-left-4`) as accents on alert states.
