# DataScope Technical Documentation

> **DataScope — Enterprise Data Discovery & Intelligence Platform**  
> Explore. Search. Analyze. Discover.

This documentation package describes the current known implementation, architecture, engineering decisions, validation plan, and submission checklist for DataScope.

- **Live application:** https://project-datascope.vercel.app/
- **Stack:** Next.js App Router, TypeScript, Redux Toolkit, RTK Query, PostgreSQL (Neon), Drizzle ORM, Zod, Recharts, Vercel
- **Sample data:** 100,000 generated customer transaction records

## Documentation index

| Document | Purpose |
|---|---|
| [01 — Frontend Architecture](01-frontend-architecture.md) | Application layers, modules, state boundaries |
| [02 — Data Fetching Flow](02-data-fetching-flow.md) | RTK Query lifecycle, caching, errors, invalidation |
| [03 — Search Architecture](03-search-architecture.md) | Search pipeline, filters, indexing, alternatives |
| [04 — Database & ER Diagram](04-database-er.md) | PostgreSQL schema and relationships |
| [05 — REST API Reference](05-api-reference.md) | Known API routes and verification notes |
| [06 — Technical Decision Records](06-technical-decision-records.md) | Eight key decisions and trade-offs |
| [07 — Performance & Testing Report](07-performance-testing.md) | Benchmark methodology and results template |
| [08 — Deployment & Operations](08-deployment-operations.md) | Environment, deployment and operational checks |

## Important accuracy note

This package is based on the implementation details available at documentation time. Items marked **Verify**, **Planned**, or **Not yet measured** must be checked against the current repository and deployed environment before final submission. No benchmark numbers, automated test results, Docker configuration, or CI/CD implementation are invented here.

## Current implementation snapshot

Known implemented elements include:
- Next.js App Router with TypeScript.
- Redux Toolkit store with authentication, datasets, explorer, saved views, and UI preferences slices.
- RTK Query records API integration.
- PostgreSQL on Neon with Drizzle ORM.
- 100,000 generated transaction records.
- B-tree, GIN JSONB, and trigram search indexes.
- Custom JWT cookie authentication using `jose`; password hashing with `bcryptjs`.
- Role model: `ADMIN`, `ANALYST`, `VIEWER`.
- Dataset-level read permissions.
- Server-side record search, filtering, sorting, and pagination.
- Saved views, search history, analytics, user management, and Vercel deployment.

## Final submission checklist

- [ ] Confirm all documentation statements against current source code.
- [ ] Add actual public GitHub repository URL.
- [ ] Run and record automated tests.
- [ ] Run repeatable performance benchmarks and fill in measured values.
- [ ] Confirm database migrations can build a fresh database.
- [ ] Confirm `.env.example` contains placeholders only.
- [ ] Confirm Docker configuration and CI/CD status; do not claim them unless present.
- [ ] Record the mandatory technical presentation showing the actual application.
