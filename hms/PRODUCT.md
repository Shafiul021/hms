# Product

## Register

product

## Platform

web

## Users
Clinical staff (doctors, nurses), laboratory technicians, pharmacists, billing admins, and hospital administrators. They use the app in busy, high-stress, clinical environments under varied lighting, requiring high accuracy, quick navigation, and low cognitive load.

## Product Purpose
The HMS aims to streamline hospital workflows by managing patient records, appointments, diagnoses, lab requests & results, IPD/OPD admissions, billing, and pharmacy stock control. Success looks like error-free data entry, faster patient check-ins/discharges, and clear visibility of bed occupancy and billing statuses.

## Brand Personality
Professional, clean-clinical, precise, and trustworthy. The interface must feel exceptionally stable, calm, and clear, avoiding loud colors, over-rounded corners, and excessive animations.

## Anti-references
- Cluttered SaaS dashboards with nested card-in-card designs.
- Low-contrast text (e.g., light gray `#888` on off-white `#fafafa`).
- Saturated "warm neutral" or cream/beige background scales that feel like consumer blog templates.
- Over-rounded card borders (>16px) or bounce/elastic animations that distract from clinical work.
- Arbitrary display typography with cramped spacing.

## Design Principles
- **Clinical Clarity first:** Visual structure must emphasize readability; data density should balance information access and visual breathing room.
- **Extreme Contrast:** Text contrast must hit WCAG 2.1 AA defaults (at least 4.5:1 for body and placeholders) to prevent readability issues under clinic lighting.
- **Deterministic Spacing & Rhythm:** Layouts use strict, proportional spacing grids (no arbitrary values). Flexbox and Grid are chosen purposely to prevent unexpected viewport overflows.
- **Accidental Safety:** Actions (especially deletions, status changes, or submissions) must have distinct confirmation steps and clear states (disabled when processing, visible loaders).

## Accessibility & Inclusion
Full WCAG 2.1 AA compliance: accessible color contrast, clear focus rings, screen reader compatibility, and respect for `prefers-reduced-motion`.
