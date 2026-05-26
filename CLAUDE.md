# InsideBank Tools

Owner Dashboard web app for WinWin Wealth Creation's InsideBank/IBF customers.
SME owners enter 9 numbers + 1 note monthly, see a 10-box financial health dashboard.

## Architecture

```
web/          Next.js 16 + Tailwind 4 + Auth.js v5   → tools.winwinwealth.co (CF Pages)
server/       NestJS 11 + Prisma                      → tools-api.winwinwealth.co (VPS :3002)
```

- **DB:** `insidebank_tools` on existing VPS Postgres (isolated DB, own user `insidebank_tools_user`)
- **Auth:** LINE Login (primary) + email magic link (fallback) via Auth.js v5
- **Formulas:** Server-side only. Never expose computation logic to the client.

## Design References

- Design Doc: `~/Documents/Claude/Projects/winwin dev skill/InsideBank_OwnerDashboard_DesignDoc.md`
- Design Brief: `~/Desktop/Projects/BusinessAnalysis/prototype/uploads/InsideBank_OwnerDashboard_DesignBrief.md`
- UI Prototype: `~/Desktop/Projects/BusinessAnalysis/prototype/`

## Conventions (inherited from WinWin)

- Thai labels throughout product UI. English only for technical finance terms (Gross Margin, Cashflow, Runway)
- Apple theme: CSS variables, never hardcode colors. Light/dark via `[data-theme]` + localStorage
- Mobile-first: `px-4` mobile, `px-6` desktop
- TanStack Query for data fetching, `notify.promise` (Sonner) for mutations
- SweetAlert2 for destructive confirms, Sonner toast for success/error
- Conventional commits: `feat:`, `fix:`, `refactor:`

## Landmines

- **Do NOT run `prisma migrate deploy` on winwin or lms_platform DBs.** This project has its own DB.
- **Do NOT share Postgres credentials** with winwin_user or lms_user. Use `insidebank_tools_user` only.
- **Formulas are IP.** Never return formula expressions in API responses. Only return computed values.
- **`monthlyDebtService` lives on Business model**, not MonthlyEntry. Set once per business.
- **1 user = 1 business in MVP.** Enforced by `@@unique([userId])` on Business.

## Key Commands

```bash
# Frontend
cd web && pnpm dev          # local dev
cd web && pnpm build        # production build
cd web && pnpm deploy       # CF Pages deploy

# Backend
cd server && pnpm dev       # local dev
cd server && pnpm build     # production build
cd server && ./deploy.sh    # rsync + docker rebuild on VPS

# Database
cd server && pnpm prisma db push      # push schema to DB
cd server && pnpm prisma generate     # regenerate client
cd server && pnpm prisma studio       # visual DB browser
```
