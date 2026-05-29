# Meridian — Library Management System

A full-stack Library Management System built with **Next.js 16 (App Router)**, **MongoDB (Mongoose)**, and **Auth.js v5** with role-based access control for Administrators, Librarians, and Students.

The interface is designed around a warm "editorial modernism" aesthetic — a dark sidebar, cream content area, and gold accents — with Libre Baskerville serif headings paired with DM Sans for body text.

---

## Table of Contents

- [Features](#features)
- [Roles & Permissions](#roles--permissions)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Default Admin Account](#default-admin-account)
- [Deployment (Vercel)](#deployment-vercel)
- [Scripts](#scripts)
- [Design System](#design-system)

---

## Features

- **Authentication & authorization** with NextAuth.js / Auth.js v5 (JWT, credentials provider)
- **Role-based access control** — Admin, Librarian, Student — enforced both at the proxy (route) layer and on every API endpoint
- **Sign up with role selection** — users pick their role on account creation
- **Books CRUD** — Add, edit, delete books (Title, Author, Genre, ISBN, Total/Available Copies)
- **Issue / Return flow** — Issue a book to a student, return a book; available copies auto-adjust
- **Records** — Admins and Librarians see all issue records; Students see only their own
- **User management** — Admins can create, edit, delete users and assign roles
- **Role-aware dashboard** — Different stats and quick actions per role
- **Search & filters** — Across books (title/author/ISBN, genre), users (name/email, role), and issues (status)
- **Pagination** on books and issues
- **Auto-seeded admin** on first database connection
- **Responsive layout** with a collapsible mobile sidebar

---

## Roles & Permissions

| Capability | Admin | Librarian | Student |
|---|:---:|:---:|:---:|
| View book catalog | YES | YES | YES |
| Add / edit / delete books | YES | YES | — |
| Issue / return books | YES | YES | — |
| View all records | YES | YES | — |
| View own records | YES | YES | YES |
| Manage users | YES | — | — |

Routes are protected by `proxy.ts`. APIs do an additional in-handler role check so the rules cannot be bypassed by calling the API directly.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: TypeScript
- **UI**: Tailwind CSS v4 (CSS-first config via `@theme`)
- **Fonts**: Libre Baskerville (serif) + DM Sans (sans-serif), via `next/font/google`
- **Icons**: Inline SVG (no runtime dependency)
- **Database**: MongoDB (Atlas or local) via [Mongoose](https://mongoosejs.com)
- **Authentication**: [Auth.js v5](https://authjs.dev) (`next-auth@beta`) with Credentials provider
- **Password hashing**: bcryptjs
- **Deployment**: Vercel (Fluid Compute)

---

## Architecture

### Routing

Routes are organized using a **route group**:

```
app/
├── page.tsx                ← Redirect to /dashboard
├── login/                  ← Public login page
├── signup/                 ← Public signup page
├── (protected)/            ← Wrapped by an auth-gated layout that renders the sidebar
│   ├── layout.tsx
│   ├── dashboard/
│   ├── books/
│   ├── issue/
│   ├── records/
│   └── admin/users/
└── api/                    ← Server endpoints
```

### Route protection

`proxy.ts` (the Next.js 16 successor to `middleware.ts`) intercepts every non-API request:

1. Unauthenticated users are redirected to `/login` except for `/login` and `/signup`.
2. Authenticated users hitting `/login` or `/signup` are redirected home.
3. Non-admins hitting `/admin/*` are sent back to `/`.
4. Students hitting `/issue` are sent back to `/`.

API routes call `auth()` and enforce role in-handler, so authorization is enforced even if a user calls the API directly.

### Database connection

`lib/db.ts` caches the Mongoose connection across hot reloads and serverless invocations using `globalThis`. On the first connection, `seedAdmin()` runs and creates the default admin if one does not already exist.

---

## Project Structure

```
.
├── app/
│   ├── (protected)/
│   │   ├── admin/users/page.tsx       # User management (admin only)
│   │   ├── books/page.tsx             # Book catalog & CRUD
│   │   ├── dashboard/page.tsx         # Role-aware home
│   │   ├── issue/page.tsx             # Issue / return flow
│   │   ├── records/page.tsx           # Issue records (scoped by role)
│   │   └── layout.tsx                 # Auth-gated layout with sidebar
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts # NextAuth handler
│   │   │   └── signup/route.ts        # Public signup endpoint
│   │   ├── books/
│   │   │   ├── route.ts               # GET (list), POST (create)
│   │   │   └── [id]/route.ts          # GET, PUT, DELETE
│   │   ├── issues/
│   │   │   ├── route.ts               # GET (list), POST (issue)
│   │   │   └── [id]/route.ts          # GET, PUT (return)
│   │   ├── users/
│   │   │   ├── route.ts               # GET (list), POST (create) — admin
│   │   │   └── [id]/route.ts          # GET, PUT, DELETE — admin
│   │   └── stats/route.ts             # Role-aware dashboard stats
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── globals.css                    # Tailwind v4 theme tokens
│   ├── layout.tsx                     # Root layout (fonts, providers)
│   ├── page.tsx                       # Redirect to /dashboard
│   └── providers.tsx                  # SessionProvider client wrapper
├── components/
│   └── Sidebar.tsx
├── lib/
│   ├── auth.ts                        # NextAuth config
│   └── db.ts                          # Mongoose connection + admin seed
├── models/
│   ├── Book.ts
│   ├── Issue.ts
│   └── User.ts
├── types/
│   └── next-auth.d.ts                 # Module augmentation for session.user.role
├── proxy.ts                           # Route protection (Next.js 16)
├── .env.example                       # Required env vars (no secrets)
└── README.md
```

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique, lowercased |
| `password` | String | bcrypt-hashed (cost 12) |
| `role` | Enum | `admin` \| `librarian` \| `student` |
| `createdAt` / `updatedAt` | Date | Auto |

### Book
| Field | Type | Notes |
|---|---|---|
| `title` | String | Required |
| `author` | String | Required |
| `genre` | String | Required |
| `isbn` | String | Required, unique |
| `totalCopies` | Number | Min 0 |
| `availableCopies` | Number | Min 0, decremented on issue, incremented on return |
| `createdAt` / `updatedAt` | Date | Auto |

### Issue
| Field | Type | Notes |
|---|---|---|
| `book` | ObjectId → Book | |
| `student` | ObjectId → User | |
| `issuedBy` | ObjectId → User | The librarian/admin who issued it |
| `issuedAt` | Date | Defaults to now |
| `dueDate` | Date | Required |
| `returnedAt` | Date | Set on return |
| `status` | Enum | `active` \| `returned` |

---

## API Reference

All endpoints require authentication (a valid session cookie) unless noted otherwise. Failed auth returns `401`; failed authorization returns `403`.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | **Public.** Create a user with a chosen role. Body: `{ name, email, password, role }` |
| `*` | `/api/auth/[...nextauth]` | NextAuth handler (sign in, callbacks, CSRF) |

### Books

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/books?search=&genre=&page=&limit=` | All | List books (paginated) |
| `POST` | `/api/books` | Admin, Librarian | Create book. Body: `{ title, author, genre, isbn, totalCopies }` |
| `GET` | `/api/books/:id` | All | Get a single book |
| `PUT` | `/api/books/:id` | Admin, Librarian | Update book |
| `DELETE` | `/api/books/:id` | Admin, Librarian | Delete book |

### Issues

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/issues?status=&page=&limit=` | All | List issues. Students see only their own. |
| `POST` | `/api/issues` | Admin, Librarian | Issue a book. Body: `{ bookId, studentId, dueDate }`. Decrements `availableCopies`. |
| `GET` | `/api/issues/:id` | All | Get a single issue |
| `PUT` | `/api/issues/:id` | Admin, Librarian | Return a book. Body: `{ action: "return" }`. Increments `availableCopies`. |

### Users (Admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users?search=&role=` | List users |
| `POST` | `/api/users` | Create user. Body: `{ name, email, password, role }` |
| `GET` | `/api/users/:id` | Get a single user |
| `PUT` | `/api/users/:id` | Update user (optionally including password) |
| `DELETE` | `/api/users/:id` | Delete user. Cannot delete yourself. |

### Stats

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stats` | Returns role-scoped stats. Student: `{ active, total, overdue }`. Librarian/Admin: book counts, issue counts, and (for admin) user counts by role. |

---

## Authentication Flow

1. The user signs up at `/signup` (chooses a role) or signs in at `/login`.
2. Sign in goes through the **Credentials** provider in `lib/auth.ts`, which:
   - Connects to Mongo
   - Looks up the user by email
   - Compares the provided password against the bcrypt hash
   - Returns `{ id, name, email, role }` on success
3. The JWT callback embeds `role` and `id` into the token.
4. The session callback exposes them on `session.user`.
5. `proxy.ts` reads the session via `auth()` and decides whether to allow the request.
6. API handlers re-check `session.user.role` before performing privileged operations.

Sessions are JWT-based (no DB lookup per request) and last 30 days by default.

---

## Local Setup

### Prerequisites

- Node.js 20 or later
- A MongoDB connection (local `mongod`, or a MongoDB Atlas cluster)
- npm (or pnpm/bun)

### 1. Clone & install

```bash
git clone git@github.com:JainamOswal18/Sameer-Library-Management.git
cd Sameer-Library-Management
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

- Set `MONGODB_URI` to your connection string
- Generate a strong `AUTH_SECRET` (`openssl rand -base64 32`)

### 3. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The first connection to Mongo will auto-seed the default admin.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `AUTH_SECRET` | Yes | Random secret used to sign JWTs (min 32 chars) |
| `AUTH_URL` | No | Canonical app URL. Vercel sets this automatically in production. |

A non-secret template is provided in [`.env.example`](.env.example). The actual `.env.local` is gitignored and must never be committed.

---

## Default Admin Account

On the **first ever database connection**, a default administrator is auto-created if no admin exists:

```
Email:    admin@library.com
Password: admin123
```

**Change this password immediately in any production deployment**, either through the `/admin/users` page (after first login) or by editing the user document directly.

---

## Deployment (Vercel)

This project is deployed on Vercel using Fluid Compute.

### Steps

1. Push to GitHub.
2. Import the repository on [Vercel](https://vercel.com/new).
3. In **Settings → Environment Variables**, add:
   - `MONGODB_URI`
   - `AUTH_SECRET`
4. If using **MongoDB Atlas**, allow Vercel's outbound traffic by adding `0.0.0.0/0` to your Atlas **Network Access** list (Vercel functions do not have a fixed egress IP on the Hobby plan).
5. Deploy.

The `app/page.tsx` redirect and `proxy.ts` rules require no extra Vercel config.

### Re-deploying via CLI

```bash
npm i -g vercel
vercel link
vercel --prod
```

---

## Scripts

```bash
npm run dev      # Start the dev server (Turbopack)
npm run build    # Production build
npm run start    # Run the production build
npm run lint     # ESLint
```

---

## Design System

The visual language ("Meridian") is intentional — warm, editorial, institutional.

**Color tokens** (defined as Tailwind v4 `@theme` variables in `app/globals.css`):

| Token | Hex | Use |
|---|---|---|
| `--color-bg-main` | `#F7F2E8` | Page background |
| `--color-bg-card` | `#FDFBF6` | Card / surface |
| `--color-sidebar` | `#0D1117` | Dark sidebar |
| `--color-accent` | `#C8922A` | Primary gold accent |
| `--color-accent-light` | `#E8B86D` | Hover / muted gold |
| `--color-border` | `#E3D9C8` | Hairline borders |
| `--color-text-primary` | `#1A1208` | Body text |
| `--color-text-secondary` | `#6B5D4E` | Secondary text |
| `--color-text-muted` | `#9B8B7A` | Tertiary text |
| `--color-success` | `#3D7A58` | Positive states |
| `--color-danger` | `#9B4040` | Destructive states |

**Typography**

- Display / headings: **Libre Baskerville**
- UI / body: **DM Sans**

**Motion**

Lightweight CSS animations for page entry: `animate-fade-in`, `animate-slide-in`, `animate-scale-in`, with `.stagger-1` through `.stagger-6` utilities for sequenced reveals.

---

## License

Personal / educational use. No license granted for commercial redistribution.
