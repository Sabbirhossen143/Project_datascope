# 06 — Technical Decision Records (TDR)

These records document the known choices and the reasoning that should be defended in the technical presentation. Confirm the implementation and add measured evidence before final submission.

## TDR-001 — Next.js App Router

**Problem:** Build a modular full-stack application with route-based pages and server API endpoints.  
**Alternatives:** Separate React SPA + API server; Next.js Pages Router.  
**Decision:** Next.js App Router with TypeScript.  
**Rationale:** Route organization, layouts, server capabilities, and one deployment surface.  
**Advantages:** Integrated routing and API routes; shared TypeScript types.  
**Disadvantages:** Server/client component boundaries require care; framework-specific behavior.  
**Performance impact:** Supports server-side work, but actual performance depends on implementation.  
**Future limits:** A separately scaled API may be preferable as backend workload and team boundaries grow.

## TDR-002 — PostgreSQL + Neon

**Problem:** Store relational users, datasets, permissions, saved views, and large record collections.  
**Alternatives:** MongoDB; self-managed PostgreSQL; other managed relational databases.  
**Decision:** PostgreSQL hosted on Neon.  
**Rationale:** Relational integrity, JSONB support, indexing, SQL aggregation, and managed hosting.  
**Advantages:** Strong query capabilities and relational constraints.  
**Disadvantages:** Connection management and query/index tuning remain necessary.  
**Performance impact:** Indexes and server-side queries reduce unnecessary data transfer; benchmarks are still required.  
**Future limits:** Reassess connection pooling, partitioning, read replicas, and workload separation at higher scale.

## TDR-003 — Drizzle ORM

**Problem:** Maintain typed database schema and queries.  
**Alternatives:** Raw SQL; Prisma; other query builders.  
**Decision:** Drizzle ORM.  
**Rationale:** TypeScript-oriented schema and relatively direct SQL mapping.  
**Advantages:** Typed query construction and explicit schema definitions.  
**Disadvantages:** Complex queries may still require SQL expertise; migrations need disciplined management.  
**Performance impact:** ORM choice alone does not guarantee faster queries; inspect generated SQL and query plans.  
**Future limits:** Keep critical query plans observable and use SQL where appropriate.

## TDR-004 — Redux Toolkit + RTK Query

**Problem:** Coordinate global UI state and server response state.  
**Alternatives:** React Context; manual Redux thunks; TanStack Query; local component state only.  
**Decision:** Redux Toolkit slices plus RTK Query for record API state.  
**Rationale:** A consistent Redux-based global store and endpoint-argument-based server cache.  
**Advantages:** Typed store, centralized state, request lifecycle and cache facilities.  
**Disadvantages:** Requires clear state boundaries and cache invalidation discipline.  
**Performance impact:** Can reuse cached responses and avoid duplicated fetch logic; verify actual cache configuration.  
**Future limits:** Avoid moving large datasets into ordinary Redux slices.

## TDR-005 — Server-side pagination

**Problem:** The dataset contains at least 100,000 records; downloading all records is inefficient.  
**Alternatives:** Client-side pagination after full download; offset pagination; cursor pagination.  
**Decision:** Server-side pagination is implemented; current strategy uses page/pageSize (offset-style behavior).  
**Rationale:** Transfer only the requested page and keep filtering/sorting in the database.  
**Advantages:** Lower browser memory and network transfer.  
**Disadvantages:** Deep offsets can become expensive; concurrent inserts can shift page boundaries.  
**Performance impact:** Measure representative page depths and query plans.  
**Future limits:** Consider cursor pagination for deep traversal or rapidly changing datasets.

## TDR-006 — PostgreSQL trigram search

**Problem:** Support partial text search over record content.  
**Alternatives:** PostgreSQL full-text search; `pg_trgm`; Elasticsearch/OpenSearch.  
**Decision:** PostgreSQL `pg_trgm` GIN index on `searchable_text` is known to be implemented.  
**Rationale:** Partial matching without adding a separate search service.  
**Advantages:** Keeps search close to transactional data; useful for substring similarity.  
**Disadvantages:** Index overhead; relevance/language features differ from dedicated search engines.  
**Performance impact:** Must be measured using representative queries and `EXPLAIN ANALYZE`.  
**Future limits:** Adopt a dedicated search service only if measured needs justify synchronization and operational complexity.

## TDR-007 — Custom JWT cookie authentication

**Problem:** Authenticate users and protect application APIs.  
**Alternatives:** NextAuth/Auth.js; managed identity provider; server sessions.  
**Decision:** Custom signed JWT session cookie using `jose`, with `bcryptjs` password hashing.  
**Rationale:** Direct control over a small role-based authentication flow.  
**Advantages:** Lightweight integration with the existing application.  
**Disadvantages:** Token revocation and role changes require care; secure cookie settings and server-side user status checks are essential.  
**Performance impact:** Token verification is lightweight; database checks may be required for current role/active status.  
**Future limits:** Consider managed identity or server-side session storage if requirements expand.

## TDR-008 — Flexible JSONB record payload

**Problem:** Store transaction fields while keeping the record model adaptable.  
**Alternatives:** One fixed relational table per dataset; fully normalized typed field tables; JSONB payload.  
**Decision:** Store record attributes in JSONB alongside dataset ID, external ID, and searchable text.  
**Rationale:** Flexible payloads for the initial generated dataset.  
**Advantages:** Easier to accommodate changing record attributes.  
**Disadvantages:** Dynamic type validation, field metadata, and indexing require additional design.  
**Performance impact:** GIN indexes can help supported JSONB queries but do not replace targeted indexes.  
**Future limits:** Add dataset field metadata, schema versioning, and targeted indexes for frequently queried fields.

## Additional decisions to document if time permits

- AND-only filters versus nested AND/OR query groups.
- Offset versus cursor pagination.
- Debounce duration and user experience.
- Cache lifetime and invalidation tags.
- Export streaming versus background export jobs.
- URL state versus Redux-only search configuration.
