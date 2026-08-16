# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server on :5173
npm run build    # tsc -b && vite build
npm test         # vitest run (src/demo.test.ts, src/render.test.tsx)
npm run lint     # oxlint
npx vitest run -t "shipping an order"   # single test by name
```

## What this is

A **client-facing sales demo** of **Zimmer (زیمر)**, a modular ERP, configured for a garment manufacturer. Not a working ERP: frontend only, mock data, local state.

Two requirements documents, and they do not fully agree:

- `ZIMMER~1.DOC` (Word, read it with `unzip -p … word/document.xml`) is the current brief: module list, personas, the full build checklist, phasing.
- `textile_erp_demo_coding_agent_spec(1).md` is the earlier textile-ERP spec. It still holds the exact Persian labels, per-page column lists and the hard constraints (§68: no backend, no database, no real auth, no real LLM, no SSR), which all still apply.

Where they conflict, the Zimmer doc wins on **scope** (which modules exist, which personas, accounting modes) and the older spec wins on **craft** (labels, column lists, RTL rules).

Success is measured by whether a client believes purchasing → inventory → manufacturing → sales → distribution → CRM → accounting → reporting are one connected system.

## Architecture

Six interlocking systems carry the demo. Understanding them matters more than the file tree.

**1. Connected mock state.** `src/store/useDemo.ts` holds orders, products, customers, movements, work orders, SKU stock, shipments, conversations, notifications, audit log, users. The point of the demo is that one action fans out, so mutations are deliberately wide:

- `createOrder` appends the order, reserves stock, bumps the customer's count/sales/debt/timeline, pushes a notification and an audit entry, and raises `salesDelta`.
- `advanceOrder` to `shipped` releases the reservation, drains the warehouses and writes a stock movement.
- `advanceWorkOrder` is production's version of the same idea: leaving `cutting` consumes `plannedFabric` metres of the right fabric and writes an outbound movement; reaching `packing` adds the size curve into `skuStock`.
- `confirmDelivery` writes the proof of delivery **and** closes the sales order behind it.

Never add a mutation that touches only its own slice.

Derived values are functions, not stored fields: `totalStock`, `available`, `isLow`, `inventoryValue`, `monthlySales`, `wipUnits`, `wipByStage`, `wastePct`, `isBehind`, `finishedUnits`. Recomputing keeps every screen consistent after a mutation for free.

**2. Module selection.** `src/store/useAuth.ts` also holds `modules` and `accountingMode`. The entry screen is a two-step setup: pick modules (all pre-checked as the guided default), then pick a persona. Unselected modules simply do not appear — no greyed-out upsell rows. `Nav.tsx` filters on permission **and** module; `<Guard>` in `App.tsx` checks both. Messaging, the activity log and the AI layer are deliberately not modules: they wrap any selection.

**3. Two first-class accounting modes.** Neither is a fallback and nothing is pre-selected. `AccountingPage.tsx` renders `NativeMode` (AP/AR, invoice lists, journal, aging — Zimmer is the system of record) or `IntegrationMode` (connected state, last-synced, read-only summary — the client's existing software is the system of record). Both must stay built; do not let one decay into a description of the other.

**4. Frontend RBAC.** `rolePermissions` is **mutable state**, seeded from `src/data/rbac.ts`. The admin permission matrix edits it live, and switching into that role must immediately reflect the edit, so the role→permission map cannot be a frozen constant. Three enforcement points, all reading the same list: `<Can permission="…">`, `<Guard>`, `Nav.tsx`.

**5. AI layer — summaries and alerts, active not previewed.** `src/lib/insights.ts` derives both from live state: `summaryFor(dept, ctx)` writes the plain-language dashboard card, `alertsFor(dept, ctx)` derives threshold alerts (low stock, work order behind schedule, fabric waste over BOM, overdue receivable/payable, delayed PO, dormant buyer). Alerts are department-scoped, dismissible, and carry `ownerId` + `prefill` so **any** alert can hand off into a pre-filled internal message — the demo's signature moment. `management` is the one scope that is never filtered.

The single deliberate future-phase callout is `AiNextCard` (forecasting, autonomous reordering, agentic margin analysis). Everything else is built, not previewed.

**6. Deterministic assistant.** `src/lib/ai.ts` pattern-matches the question and reads live store state, so it reflects orders and work orders advanced earlier in the same demo. Every numeric answer carries source / period / last-updated. Questions it cannot ground return the fixed refusal string. **Never let it compose a figure the rest of the app cannot show you** — a wrong number in front of a client is the one unrecoverable bug here. Watch substring matching in Persian: `'بار'` is inside `انبار` and `اعتبار`, so match on `'بارها'`.

## RTL is a layout decision, not a stylesheet flag

Navigation is the **first** grid column (right edge in RTL), main content second, insight panel last (left). Drawers enter from the left. Use logical properties throughout (`ms-`/`me-`, `border-s`/`border-e`, `start-`/`end-`) — a physical `left`/`right` will be wrong on one side of the app.

Persian digits, Jalali dates and Toman all come from `src/lib/format.ts`, built on `Intl.NumberFormat('fa-IR')`. Dates are **stored** as Jalali strings (`'1405-05-22'`), so there is no calendar conversion anywhere and a plain string compare sorts them. Cards use `money()` (rounded, `۱۲۸ میلیون تومان`), detail views use `toman()` (full, `۱۲۸٬۰۴۰٬۰۰۰ تومان`).

## Visual rules

Tokens live in `@theme` in `src/index.css`; no hard-coded colours in components.

Brand comes from the client's brand kit and must not drift: `--color-brand #7f5af0`, `--color-brand-light #a379ff` (lighter variant), `--color-brand-dark #7e4ee6` (hover/pressed), `--color-brand-ink #5b2cc0` (body-size brand text on white), `--brand-rgb 127 90 240`. `--color-brand-tint` is the 10% wash used for selected rows and active nav — `brand-light` is a mid purple, not a background, so text on it would fail contrast. Purple is brand/CTA/selection only; status uses the separate ok/warn/crit/info tokens.

**No capsules.** Status, stage and approval indicators are never filled pills. `Badge` is a hairline chip: 6px radius, `bg-surface`, a border in the status colour at 30%, the label in the status colour, and a small square dot (`dot={false}` when the chip labels a thing rather than a state). Progress bars use 3px radius, not `rounded-full`. Circles are reserved for avatars, step markers and status dots.

One radius system: surfaces 12px, controls 8px, chips 6px, checkboxes 5px, bars 3px.

No remote assets. The entry panel is drawn in CSS/SVG because a demo machine cannot be assumed to reach an image host; anything visual must be bundled or drawn. Light-only by intent (internal ERP on a projector). Motion is deliberately low: CSS transitions, a `useCountUp` hook for KPIs, `dialog[open]` slide. No animation library. `prefers-reduced-motion` is honoured globally.

Dropdowns are `Select` in `src/components/ui.tsx`, not `<select>` — a native dropdown paints OS chrome that cannot be styled and reads as foreign next to everything else. It reimplements what the native element was paying for: `role="combobox"`/`listbox`, arrow/Home/End/Enter/Escape keys, click-outside, and flipping upward near a viewport or modal edge. Never reintroduce a bare `<select>`.

Overlays use the native `<dialog>` element (`Drawer`, `Modal` in `src/components/ui.tsx`) so focus trapping, Escape and the top layer come from the platform.

## Mock data

Two files, one company: **پوشاک مهرآذین**, a vertically integrated garment maker that knits and dyes its own fabric and cuts-and-sews three styles for پاییز ۱۴۰۵.

- `src/data/mock.ts` — buyers نساجی پارس / پوشاک آریا / …, fabric F-201…F-401, yarn and dye Y-101…D-102, trims T-101…T-103, purchase orders, invoices, movements, audit log, users, the 12-month series.
- `src/data/garment.ts` — styles ST-204 / ST-311 / ST-408 with their BOMs and size runs, work orders WO-051…WO-055, SKU stock, price list, shipments SH-203…SH-207, payables, ledger, the external accounting connection, manager contacts and seeded conversations.

Reuse those exact IDs across modules; cross-module ID consistency is what sells the integration story. Traceable chain to keep intact: PO-312 → fabric → WO-055 → ST-204 → SO-1048 → پوشاک آریا → shipment → receivable → dashboard.

Figures are internally consistent by construction (invoice amounts sum to the aging buckets, order totals equal qty × price × discount, size curves sum to the order quantity, `plannedFabric` equals qty × `fabricPerUnit`). The only company-scale numbers not derived from the tables live in `COMPANY` in `useDemo.ts` — keep that boundary sharp.

Where the older spec contradicted itself, the data was rebuilt to reconcile: SO-1042 totals ۱۲۸٬۰۴۰٬۰۰۰ (2,400 × 55,000 less 3%), low stock is derived and reads 3 items, receivables reconcile at 890M total / 284M overdue.

## Deviations from the spec's suggested stack

- **shadcn/ui not used.** RTL-native design would restyle every default anyway, and the demo needs about six primitives, not forty. They are hand-built in `src/components/ui.tsx` on native `<dialog>`.
- **No animation library.** The spec names Framer Motion; the motion budget here is fades, a slide and a count-up, which CSS covers.
- **Lucide kept** (spec names it explicitly), single family, `strokeWidth={1.5}` throughout.
