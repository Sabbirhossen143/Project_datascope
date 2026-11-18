# 07 — Performance & Testing Report

## 1. Purpose

This report defines how to measure DataScope with its 100,000-record sample dataset. **No measured performance values are available in this documentation package.** Fill the tables using repeatable tests before submission.

## 2. Test environment

| Item | Value to record |
|---|---|
| Test date/time | Not yet recorded |
| Application commit | Not yet recorded |
| Environment | Local / Vercel Preview / Production |
| Node.js version | Record exact version |
| Database region/compute | Record Neon region and compute tier |
| Dataset size | 100,000 records (known seed dataset) |
| Browser/device | Record browser and hardware |
| Network | Record connection conditions |

## 3. Benchmark scenarios

Run each scenario multiple times. Separate cold-cache and warm-cache runs. Report median and p95, not only the fastest request.

| Scenario | Measurement | Result |
|---|---|---|
| Initial records page | API latency, p50/p95 | Not yet measured |
| Global partial search | API latency, p50/p95 | Not yet measured |
| Single filter | API latency, p50/p95 | Not yet measured |
| Combined filters | API latency, p50/p95 | Not yet measured |
| Numeric range | API latency, p50/p95 | Not yet measured |
| Sort by amount | API latency, p50/p95 | Not yet measured |
| Deep page navigation | API latency, p50/p95 | Not yet measured |
| Cached repeat request | API latency / cache behavior | Not yet measured |
| Table rendering | Render time / responsiveness | Not yet measured |
| Export | Duration, memory, output size | Not yet measured |

## 4. Suggested test protocol

1. Confirm the seed dataset contains exactly the expected record count.
2. Use the same query inputs for each run.
3. Execute at least 10–20 repetitions per scenario.
4. Record cold and warm cache separately.
5. Capture database query plans using `EXPLAIN (ANALYZE, BUFFERS)`.
6. Record API timing and browser rendering separately.
7. Record hardware, region, database tier, and commit hash.
8. Do not extrapolate a 100K benchmark as proof of 10M performance.

## 5. Testing strategy

| Test layer | Required coverage | Status |
|---|---|---|
| Unit | Filter validation, query construction, helpers, reducers | Not verified |
| Integration | Database queries, permissions, saved views | Not verified |
| API | Auth, records, filters, sorting, pagination, errors | Not verified |
| UI | Loading, empty, error, responsive states | Not verified |
| Performance | Search, pagination, rendering, cache, export | Not measured |

## 6. Minimum functional test cases

- Valid login and invalid credentials.
- Inactive user cannot access protected APIs.
- Viewer cannot access a dataset without read permission.
- Admin access behavior.
- Invalid dataset UUID is rejected.
- Page size below/above allowed bounds is rejected or normalized as designed.
- Unsupported filter field/operator is rejected.
- Exact, partial, numeric, and range filters.
- Combined filters return expected records.
- Sorting returns correct order.
- Pagination returns correct page and total count.
- Saved view create/update/delete/restore.
- API/network failure displays an understandable error.
- Cache updates after relevant mutations.

## 7. Results summary

**Current conclusion:** The project has a known 100,000-record generated dataset and server-side record query path. Performance characteristics have not been measured in this report. Do not claim a latency target or production scalability until measurements are recorded.
