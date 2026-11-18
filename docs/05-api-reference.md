# 05 — REST API Reference

> This reference lists routes known from the current project context. It is not a substitute for checking every route handler in the repository. Confirm exact request/response shapes before publishing as a formal API contract.

## 1. Authentication

| Method | Route | Purpose | Known behavior |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | Validates input, hashes password, creates VIEWER user |
| POST | `/api/auth/login` | Sign in | Checks password and active status; sets session cookie |
| POST | `/api/auth/logout` | Sign out | Clears session cookie |
| GET | `/api/auth/me` | Current user | Reads session and returns database user profile |

Authentication uses a custom JWT session cookie named `datascope_session`, signed with `jose`. Passwords are hashed using `bcryptjs`.

## 2. Records

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/records` | Search, filter, sort, and paginate dataset records |

Known query concepts:
- Dataset ID.
- Page and page size.
- Global search.
- Filter conditions.
- Sort field and direction.

The endpoint validates dataset ID, pagination bounds, filter field/operator allowlists, and sorting allowlists. It enforces authentication and dataset read permission; administrators bypass dataset-level read permission checks.

## 3. Other known API areas

The application context indicates API areas for datasets, analytics, saved views, search history, and user management. Exact paths, methods, schemas, and status codes must be extracted from the current `src/app/api` tree before treating them as complete documentation.

## 4. Authorization model

| Role | Intended capability |
|---|---|
| ADMIN | Platform/user/dataset administration; administrative access |
| ANALYST | Explore and analyze authorized datasets |
| VIEWER | Browse and search authorized datasets |

Dataset-level access is enforced on the server. Do not rely on hidden navigation links or frontend role state to protect data.

## 5. Error handling contract — recommended documentation

For each endpoint, record:
- Success status and response schema.
- Validation error status and error body.
- Unauthenticated response.
- Forbidden response.
- Not-found response.
- Conflict response, where applicable.
- Unexpected server error behavior.

## 6. How to complete this reference

Inspect every folder under `src/app/api/`. For each `route.ts`, document HTTP method, query/body schema, authorization, response fields, and representative success/error examples. Avoid documenting endpoints that do not exist.
