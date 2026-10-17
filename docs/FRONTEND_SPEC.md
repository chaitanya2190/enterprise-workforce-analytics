# Frontend Specification: Predictive Talent Retention System

A guide for building the three-tier analytics dashboard described in the project report. It covers what to build, how to structure it, and how it connects to the backend.

---

## 1. Purpose and Scope

**Goal:** give three groups of users a clear view of workforce attrition risk and what to do about it.

| Tier | Users | Main job |
|------|-------|----------|
| 1. Executive Overview | C-suite leaders | Check headcount, attrition, productivity and revenue per FTE at a glance |
| 2. Departmental Analysis | Mid-level managers | Find high performers who are working too much overtime |
| 3. Risk & Prescriptive Action | Talent Retention teams | Review at-risk employees and choose an intervention |

**In scope:** the web dashboard, its data contracts, and the design system.
**Out of scope:** model training (`train_model.py`), the data generator (`generate_data.py`), and the Tableau/TabPy integration.

---

## 2. Recommended Tech Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | React 18 + Vite + TypeScript | Fast dev loop, typed data contracts. The report already lists React/Next.js as the next step |
| Routing | React Router v6 | One route per tier |
| Server state | TanStack Query | Caching, loading and error states for API calls |
| Charts | Chart.js with `react-chartjs-2` (or Recharts) | Matches the report's Chart.js choice |
| Tables | TanStack Table | Sorting, filtering, pagination for the risk table |
| Styling | CSS Modules or Tailwind, plus CSS variables for theme tokens | Dark and light themes from one token set |
| Testing | Vitest, React Testing Library, Playwright | Unit, component and end-to-end coverage |
| Lint/format | ESLint, Prettier | Consistent code |

---

## 3. Project Structure

```
retention-dashboard/
├── public/
├── src/
│   ├── api/                 # fetch functions and TypeScript types
│   │   ├── client.ts
│   │   ├── kpis.ts
│   │   ├── attrition.ts
│   │   ├── employees.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, TopBar
│   │   ├── charts/          # LineTrendChart, OvertimeScatter
│   │   ├── kpi/             # KpiCard, KpiGrid
│   │   ├── risk/            # RiskTable, PlaybookBadge, RiskBar
│   │   └── common/          # Select, SearchInput, EmptyState, ErrorState, Skeleton
│   ├── pages/
│   │   ├── ExecutiveOverview.tsx
│   │   ├── DepartmentAnalysis.tsx
│   │   └── RiskActions.tsx
│   ├── hooks/               # useKpis, useAttritionTrend, useRiskEmployees, useTheme
│   ├── state/               # filter context (selected department, search term)
│   ├── styles/              # tokens.css, global.css
│   ├── utils/               # formatters (percent, currency), playbook rules
│   ├── App.tsx
│   └── main.tsx
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

## 4. Setup Steps

1. Create the project: `npm create vite@latest retention-dashboard -- --template react-ts`
2. Install dependencies: `npm i react-router-dom @tanstack/react-query @tanstack/react-table chart.js react-chartjs-2`
3. Add dev tools: `npm i -D vitest @testing-library/react eslint prettier @playwright/test`
4. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
5. Build in this order: design tokens, app shell and routing, API layer with mock data, Tier 1, Tier 2, Tier 3, then tests and polish.
6. Run locally with `npm run dev`. Build with `npm run build`.

---

## 5. Layout

- **Desktop:** fixed left sidebar (about 230px) with three tabs, and a scrollable main area.
- **Top bar:** page title, data-status line (record count, model name, last refresh) and a department filter.
- **Tablet and mobile (below 820px):** the sidebar becomes a horizontal tab bar above the content. Grids collapse to one column.
- **Routes:**
  - `/` Executive Overview
  - `/departments` Departmental Analysis
  - `/risk` Risk & Actions

The department filter is shared across all three pages and kept in the URL query string (for example `?dept=Engineering`) so views can be bookmarked and shared.

---

## 6. Design System

### Color tokens

| Token | Dark theme | Light theme | Use |
|-------|-----------|-------------|-----|
| `--bg` | `#0e1621` | `#f3f6fa` | Page background |
| `--panel` | `#152030` | `#ffffff` | Cards |
| `--line` | `#243449` | `#d5dee9` | Borders |
| `--ink` | `#e6edf5` | `#14202e` | Main text |
| `--mute` | `#8ea1b8` | `#5a6d84` | Secondary text |
| `--teal` | `#4fb3bf` | `#1c8a99` | Primary accent, positive |
| `--coral` | `#ef6f5e` | `#d4493a` | High risk, over target |
| `--amber` | `#e8b04a` | `#b7791f` | Target lines, warnings |

Dark is the default. Follow the user's OS setting through `prefers-color-scheme`, and offer a manual toggle.

### Typography

- Body and data: IBM Plex Sans (400, 500, 600), with a system-ui fallback.
- Page titles: IBM Plex Serif (500), with a Georgia fallback.
- Scale: 26px page title, 16px card title, 15px body, 13px secondary text.
- Keep text lines under about 70 characters.

### Spacing and shape

- 8px spacing grid. Card padding 16 to 18px.
- 8px card radius, 6px control radius, 1px borders. No heavy shadows.

### Accessibility

- Tabs use `role="tablist"` and `aria-selected`.
- Visible focus outline on every control (2px teal).
- Color is never the only signal: risk rows also show a number and a labeled playbook.
- Contrast of at least 4.5:1 for text in both themes.
- Charts get a text summary or a data table alternative.
- Respect `prefers-reduced-motion`.

---

## 7. Page Specifications

### 7.1 Tier 1: Executive Overview

**KPI cards (four):**

| Card | Value | Supporting line |
|------|-------|-----------------|
| Total headcount | Integer | Period covered |
| Annualized attrition | Percent | "Within cap" or "Above cap" against the target |
| Productivity index | 0 to 100 | Weighted composite |
| Revenue per FTE | Currency | Annual estimate |

**Chart: Year-to-date attrition trend**
- Type: line chart, months on the X axis, annualized attrition percent on the Y axis.
- Series 1: actual attrition (teal, with points).
- Series 2: target cap (amber, dashed, no points).
- Months above the cap should be visibly marked (coral point).
- Tooltip shows month, actual, cap and the gap.

### 7.2 Tier 2: Departmental Intersectional Analysis

**Chart: Overtime hours vs. performance rating**
- Type: scatter. X is overtime hours per year, Y is performance rating (1 to 5).
- Two series: standard risk (teal, semi-transparent) and high risk with P above 0.70 (coral).
- Highlight the top-right zone (high overtime and high performance) as the "burnout zone".
- Limit to about 400 points for readability; sample on the server for large departments.
- Tooltip shows employee ID, department, overtime and rating.

**Table: Department comparison**
- Columns: Department, Headcount, Overtime ratio, Absenteeism rate, Compa-ratio, Attrition.
- Sortable by any column.

### 7.3 Tier 3: Risk & Prescriptive Action

**Summary cards (three):**
- High-risk employees (P above 0.70).
- Replacement exposure: sum of salary times a replacement factor between 1.5 and 2.0.
- Average compa-ratio of the high-risk group.

**Table: High-risk employees**
- Columns: Employee ID, Department, Risk probability (number plus bar), Overtime ratio, Compa-ratio, Recommended playbook.
- Default sort: risk probability, highest first. Paginate at 15 to 25 rows.
- Search by employee ID.
- Row click opens a side panel with the employee's drivers and the suggested action.

**Playbook rules:**

| Condition | Playbook | Action |
|-----------|----------|--------|
| Overtime ratio is high (for example 0.18 or more) | Workload Redistribution | Cap overtime and rebalance tasks |
| Compa-ratio is low and performance is high | Targeted Compensation Alignment | Adjust salary toward the pay-range midpoint |
| Both apply | Show both, with the largest driver first | |

Store these thresholds in one config file so HR can change them without code edits.

---

## 8. Data Contracts

Define these as TypeScript types in `src/api/types.ts`. All responses accept an optional `dept` query parameter.

### `GET /api/kpis`
```json
{
  "headcount": 8000,
  "attritionRate": 0.118,
  "attritionCap": 0.12,
  "productivityIndex": 71.4,
  "revenuePerFte": 235000,
  "asOf": "2026-09-29"
}
```

### `GET /api/attrition/trend`
```json
{
  "months": [
    { "month": "2026-01", "actual": 0.109, "cap": 0.12 }
  ]
}
```

### `GET /api/employees/scatter`
```json
{
  "points": [
    { "id": "EMP-10001", "dept": "Engineering", "overtimeHours": 320, "performance": 4.2, "risk": 0.74 }
  ]
}
```

### `GET /api/departments/summary`
```json
{
  "departments": [
    { "name": "Engineering", "headcount": 1300, "overtimeRatio": 0.14, "absenteeismRate": 0.035, "compaRatio": 1.0, "attritionRate": 0.13 }
  ]
}
```

### `GET /api/employees/at-risk?minRisk=0.7&page=1&pageSize=25&q=`
```json
{
  "total": 214,
  "items": [
    {
      "id": "EMP-10412",
      "dept": "Sales",
      "risk": 0.86,
      "overtimeRatio": 0.21,
      "compaRatio": 0.88,
      "topDrivers": ["overtimeRatio", "compaRatio"],
      "playbook": "workload_redistribution"
    }
  ]
}
```

The backend (for example FastAPI or Flask) loads `retention_model.pkl` and returns these shapes. Until it is ready, build against mock JSON files so the frontend can be developed independently.

---

## 9. KPI Definitions

Use these exact definitions so the frontend matches the model pipeline.

| KPI | Formula | Meaning |
|-----|---------|---------|
| Overtime Ratio (OTR) | Overtime hours ÷ Standard hours | Burnout indicator |
| Compa-Ratio (CR) | Base salary ÷ Pay range midpoint | Pay equity against market |
| Absenteeism Rate (ABR) | Unplanned absences ÷ Available days | Lost time and disengagement |
| Productivity Index (PI) | Weighted composite of time fidelity, focus quality, tool friction and deliverables | Normalized score |
| Replacement cost | Annual salary × (1.5 to 2.0) | Cost of losing an employee |

The frontend should display these values, not recompute them. Calculation belongs to the data pipeline.

---

## 10. State and Data Handling

- **Server state:** TanStack Query with a 5-minute stale time and one query key per endpoint plus filters.
- **UI state:** selected department, search term, page and sort, kept in URL params.
- **Loading:** skeleton placeholders sized like the final content.
- **Empty:** for example, "No employees match. Clear the search or choose another department."
- **Error:** say what failed and offer a Retry button, for example "Couldn't load attrition data. Retry."
- **Formatting:** percent to one decimal place, currency in whole dollars with thousands separators, risk probability to two decimals.

---

## 11. Non-Functional Requirements

| Area | Target |
|------|--------|
| Performance | First contentful paint under 2 seconds on broadband; interactions under 100 ms |
| Table size | Server-side pagination; never render more than 100 rows at once |
| Browser support | Latest two versions of Chrome, Edge, Firefox and Safari |
| Responsive | Works from 360px to 1920px wide |
| Security | Role-based access (executive, manager, retention team); no personal data in URLs beyond employee ID |
| Privacy | Individual risk scores visible only to authorized Talent Retention users |

---

## 12. Testing Plan

- **Unit:** formatters, playbook rule function, risk threshold logic.
- **Component:** KPI card, risk table (sorting, search, empty state), filter bar.
- **End to end (Playwright):** switch tabs, change department, search an employee, open the detail panel.
- **Visual check:** review both themes at 360px, 820px and 1440px wide.
- **Accessibility:** run axe checks on each page and confirm keyboard-only navigation.

---

## 13. Delivery Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Project setup, design tokens, app shell, routing, mock API |
| 2 | Tier 1 page with KPI cards and trend chart |
| 3 | Tier 2 page with scatter and department table |
| 4 | Tier 3 page with risk table, search, detail panel and playbooks |
| 5 | Connect to the real API, add role-based access, run tests |
| 6 | Deployment (static hosting such as Vercel or Netlify, or containerized with Nginx), monitoring |

---

## 14. Future Enhancements

- Export the at-risk list to CSV or PDF.
- Track playbook outcomes (action taken, employee retained or not).
- Explain each score with feature contributions from the model coefficients.
- Scheduled email digests for department managers.
- Embed the Tableau view through TabPy for teams that already use it.
