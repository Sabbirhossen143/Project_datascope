# DataScope — Enterprise Data Discovery & Intelligence Platform

\<p align="center">
&#x20; \<strong>Explore. Search. Analyze. Discover.\</strong>
\</p>

\<p align="center">
&#x20; A modern, full-stack data intelligence platform designed to explore, search, filter, analyze, and manage large volumes of structured business data efficiently.
\</p>

\<p align="center">
&#x20; \<a href="[https://project-datascope.vercel.app/](https://project-datascope.vercel.app/)">\<strong>🌐 Live Demo\</strong>\</a> ·
&#x20; \<a href="#-features">\<strong>Features\</strong>\</a> ·
&#x20; \<a href="#-getting-started">\<strong>Installation\</strong>\</a> ·
&#x20; \<a href="#-architecture">\<strong>Architecture\</strong>\</a>
\</p>

\<p align="center">
&#x20; \<img src="[https://img.shields.io/badge/Next.js-16-black?logo=next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)" alt="Next.js" />
&#x20; \<img src="[https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)" alt="TypeScript" />
&#x20; \<img src="[https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)" alt="PostgreSQL" />
&#x20; \<img src="[https://img.shields.io/badge/Redux_Toolkit-State_Management-764ABC?logo=redux](https://img.shields.io/badge/Redux_Toolkit-State_Management-764ABC?logo=redux)" alt="Redux Toolkit" />
&#x20; \<img src="[https://img.shields.io/badge/Drizzle_ORM-ORM-C5F74F](https://img.shields.io/badge/Drizzle_ORM-ORM-C5F74F)" alt="Drizzle ORM" />
&#x20; \<img src="[https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)" alt="Vercel" />
\</p>

---

## 🌐 Live Application

**Live Website:** [https://project-datascope.vercel.app/](https://project-datascope.vercel.app/)

DataScope is designed to help organizations work with large datasets through an organized workspace featuring server-side data processing, advanced search capabilities, analytics, and role-based access control.

## 📌 Project Overview

Organizations often struggle with searching large datasets, managing multiple filters, maintaining responsive interfaces, and optimizing expensive database queries.

DataScope addresses these challenges through a centralized data discovery and intelligence platform.

The application demonstrates full-stack development concepts, scalable data-fetching strategies, database optimization, frontend state management, and secure authorization.

### Key Highlights

- 100,000+ generated transaction records.
- Server-side search, filtering, sorting, and pagination.
- PostgreSQL database with indexing and optimized queries.
- Redux Toolkit and RTK Query for state and server-data management.
- Role-based access control with three user roles.
- Advanced search and reusable saved views.
- Interactive analytics and data visualization.

## ✨ Features

### 1. Authentication & Authorization

- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based session authentication.
- Role-based access control (RBAC).
- Dataset-level read permissions.
- Protected application routes and API endpoints.

### 2. Dataset Management

- Dataset library and dataset discovery.
- Dataset creation and metadata management for administrators.
- Dataset descriptions, categories, and sources.
- Dataset-level access permissions.
- Record count and dataset information.

### 3. Data Explorer

- Server-side data retrieval.
- Global record search.
- Sorting and pagination.
- Multiple filter conditions.
- Record inspection and details.
- Saved search configurations.
- CSV export functionality.

### 4. Advanced Search

- Global search.
- Field-based search.
- Multiple search conditions.
- Exact and partial matching.
- Numeric range filtering.
- Date-based filtering.
- Combined search conditions.
- Configurable sorting and pagination.

### 5. Saved Views & Search History

- Save frequently used search configurations.
- Update and delete saved views.
- Share views with authorized users.
- Restore previous search configurations.
- Maintain personal search history.

### 6. Analytics & Overview

- Transaction overview and key metrics.
- Revenue performance charts.
- Order status distribution.
- Category performance.
- Regional performance.
- Top-selling products.
- Recent transaction records.

### 7. User Management

- Administrator user management.
- Role assignment.
- User activation and deactivation.
- Role-based interface permissions.

## 👥 User Roles

| Role          | Capabilities                                                                  |
| ------------- | ----------------------------------------------------------------------------- |
| Administrator | Manage users, datasets, permissions, and platform resources                   |
| Data Analyst  | Explore datasets, perform advanced searches, analyze records, and export data |
| Viewer        | Browse authorized datasets, search records, and access shared views           |

## 🛠️ Technology Stack

| Category           | Technologies               |
| ------------------ | -------------------------- |
| Frontend           | Next.js, React, TypeScript |
| Styling            | Tailwind CSS               |
| State Management   | Redux Toolkit              |
| Server State       | RTK Query                  |
| Database           | PostgreSQL (Neon)          |
| ORM                | Drizzle ORM                |
| Authentication     | JWT, jose, bcryptjs        |
| Validation         | Zod                        |
| Data Visualization | Recharts                   |
| Data Tables        | TanStack Table             |
| Icons              | Lucide React               |
| Notifications      | Sonner                     |
| Deployment         | Vercel                     |

## 🏗️ Architecture

DataScope follows a modular full-stack architecture using Next.js App Router.

```text
DataScope
│
├── Public Pages
│   ├── Landing Page
│   ├── Login
│   └── Registration
│
├── Application Pages
│   ├── Overview
│   ├── Data Explorer
│   ├── Dataset Library
│   ├── Advanced Search
│   ├── Analytics
│   ├── Saved Views
│   ├── Record Details
│   ├── User Management
│   └── Profile
│
├── Components
│   ├── Authentication
│   ├── Layout
│   ├── Data Tables
│   └── Shared UI
│
├── API Routes
│   ├── Authentication
│   ├── Datasets
│   ├── Records
│   ├── Analytics
│   ├── Saved Views
│   ├── Search History
│   └── User Management
│
├── State Management
│   ├── Redux Store
│   ├── Auth Slice
│   ├── Dataset Slice
│   ├── Explorer Slice
│   ├── Saved Views Slice
│   └── UI Preferences Slice
│
└── Database
    ├── Users
    ├── Datasets
    ├── Dataset Records
    ├── Saved Views
    ├── Search History
    ├── User Preferences
    └── Access Permissions
```

## ⚡ Data Fetching & Performance Strategy

DataScope uses server-side processing to avoid downloading the entire dataset to the browser.

### Server-Side Pagination

Only the requested page of records is retrieved from PostgreSQL.

### Server-Side Filtering

Search and filtering conditions are processed by the backend and translated into database queries.

### Database Indexing

Indexes are used to improve lookup and filtering performance, including:

- B-tree indexes.
- Composite unique indexes.
- GIN indexes for JSONB data.
- Trigram indexes for text search.

### State Management

Redux Toolkit manages shared application state, while RTK Query manages record-fetching state and API caching.

### Query Validation

Zod validates incoming search and filter configurations before database queries are executed.

> Performance figures should be added after running repeatable benchmarks against the deployed or local 100K-record dataset.

## 🗄️ Database

DataScope uses PostgreSQL with Drizzle ORM.

The database includes:

| Table              | Purpose                     |
| ------------------ | --------------------------- |
| users              | User accounts and roles     |
| datasets           | Dataset metadata            |
| dataset_records    | Structured dataset records  |
| saved_views        | Saved search configurations |
| search_history     | User search history         |
| user_preferences   | User-specific settings      |
| access_permissions | Dataset-level permissions   |

### Sample Dataset

The initial generated dataset contains more than 100,000 customer transaction records.

Example fields:

- Transaction ID
- Customer Name
- Email
- Product
- Category
- Amount
- Quantity
- Status
- Region
- Payment Method
- Order Date

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js 20 or later.
- npm.
- PostgreSQL database or a Neon PostgreSQL account.
- Git.

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd datascope
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root.

```env
DATABASE_URL="YOUR_NEON_POOLED_CONNECTION_STRING"
DATABASE_URL_UNPOOLED="YOUR_NEON_UNPOOLED_CONNECTION_STRING"
AUTH_SECRET="YOUR_SECURE_RANDOM_SECRET"
```

**Important:** Never commit `.env.local` or expose database credentials and authentication secrets.

### 4. Run Database Migrations

Use the migration scripts configured in your repository.

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

If your database is already initialized, verify the existing migration state before applying migrations again.

### 5. Generate Sample Data

If the sample dataset has not already been generated:

```bash
npx tsx src/db/seed/generate.ts
```

Review the seed script before running it against an existing database.

### 6. Start the Development Server

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

| Variable              | Description                  |
| --------------------- | ---------------------------- |
| DATABASE_URL          | Pooled PostgreSQL connection |
| DATABASE_URL_UNPOOLED | Direct PostgreSQL connection |
| AUTH_SECRET           | JWT authentication secret    |

Use separate development and production environment variables.

## 📁 Project Structure

```text
src/
├── app/
│   ├── api/
│   ├── login/
│   ├── register/
│   ├── overview/
│   ├── explorer/
│   ├── datasets/
│   ├── advanced-search/
│   ├── analytics/
│   ├── saved-views/
│   ├── records/
│   ├── admin/
│   └── profile/
│
├── components/
│   ├── auth/
│   ├── layout/
│   └── providers.tsx
│
├── db/
│   ├── schema/
│   └── seed/
│
├── lib/
│
└── store/
    ├── api/
    ├── slices/
    ├── hooks.ts
    └── store.ts
```

## 🧪 Testing

Testing is an important part of the DataScope engineering process.

The following areas should be covered by automated tests:

- Authentication and authorization.
- Dataset-level permissions.
- Search and combined filters.
- Sorting and pagination.
- Saved views.
- API error handling.
- Data fetching and cache invalidation.

Add the actual test commands and benchmark results here after implementing and executing the test suite.

## 🚢 Deployment

DataScope is deployed on Vercel.

**Production URL:** [https://project-datascope.vercel.app/](https://project-datascope.vercel.app/)

To deploy your own instance:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Deploy the application.
5. Verify database connectivity and authentication.

## 🧠 Engineering Decisions

The following decisions are important areas of the implementation and should be documented with their alternatives, trade-offs, and limitations:

1. Redux Toolkit and RTK Query for application and server state.
2. PostgreSQL as the relational database.
3. Drizzle ORM for typed database operations.
4. Server-side pagination instead of loading all records.
5. PostgreSQL indexes for query optimization.
6. Trigram indexing for partial text search.
7. JWT-based authentication.
8. Dataset-level access control.
9. Zod validation for incoming API parameters.

Detailed Technical Decision Records (TDRs) should be maintained separately in the project documentation.

## 🔮 Future Improvements

- Dynamic schema-driven data tables.
- Multi-column sorting and column resizing.
- Virtualized large-table rendering.
- More comprehensive automated testing.
- Search performance monitoring.
- Query execution analytics.
- Advanced caching and invalidation strategies.
- Cursor-based pagination for larger datasets.
- Docker-based development environment.
- CI/CD automation.

## 🎯 Project Objective

DataScope was developed as a full-stack engineering project to demonstrate practical knowledge of:

- Large-scale data handling.
- Efficient database querying.
- Search architecture.
- State management.
- Secure API design.
- Role-based authorization.
- Scalable frontend architecture.
- Full-stack application deployment.

## 👨‍💻 Author

**SABBIR HOSSEN**

Full-Stack Developer

**Project:** DataScope — Enterprise Data Discovery & Intelligence Platform

**Live Application:** [https://project-datascope.vercel.app/](https://project-datascope.vercel.app/)

---

\<p align="center">   \<strong>DataScope\</strong>   \<br />   Data · Clarity · Confidence \</p>
