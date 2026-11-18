# 08 — Deployment & Operations

## 1. Production deployment

- **Hosting:** Vercel
- **Live URL:** https://project-datascope.vercel.app/
- **Database:** Neon PostgreSQL

## 2. Environment variables

Create `.env.local` locally and configure equivalent values in Vercel project settings.

```env
DATABASE_URL="YOUR_NEON_POOLED_CONNECTION_STRING"
DATABASE_URL_UNPOOLED="YOUR_NEON_UNPOOLED_CONNECTION_STRING"
AUTH_SECRET="YOUR_LONG_RANDOM_SECRET"
```

Never commit real credentials. Commit only an `.env.example` containing placeholder values.

## 3. Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Database migration and seed commands must match the scripts and configuration in the actual repository. Confirm `drizzle.config.ts`, `package.json`, and migration files before using commands against a production database.

Known seed script path:
`src/db/seed/generate.ts`

The seed script creates the 100K sample dataset in batches and may replace the existing generated dataset. Review its behavior before running it against a non-disposable database.

## 4. Deployment checklist

- [ ] Public GitHub repository is connected to Vercel.
- [ ] Production environment variables are configured.
- [ ] Production build succeeds.
- [ ] Database connectivity is verified.
- [ ] Migration state is verified.
- [ ] Authentication cookie works on deployed domain.
- [ ] Viewer/Analyst/Admin permissions are tested.
- [ ] Main pages work on desktop and mobile.
- [ ] No secrets appear in logs or client bundles.
- [ ] Error monitoring/logging approach is documented.

## 5. Security operations

- Enforce authorization in server route handlers.
- Validate user input and query configuration.
- Use secure, HTTP-only, same-site cookie settings appropriate to deployment.
- Verify the current database user role and active status where immediate revocation is required.
- Keep database credentials and `AUTH_SECRET` private.
- Avoid exposing stack traces or sensitive database errors to clients.

## 6. CI/CD and Docker

Docker configuration and GitHub Actions are **not confirmed** in the known project state. Add them only after implementing and testing them. Do not state that automated deployment checks exist unless the repository proves it.

## 7. Recovery and maintenance

- Keep database migrations under version control.
- Back up production data according to the database provider's capabilities and project needs.
- Test migrations on a non-production branch before production.
- Monitor slow API routes and database query latency.
- Review indexes when query patterns change.
