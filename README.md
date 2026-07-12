# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform that digitizes vehicle, driver,
dispatch, maintenance, and expense management while enforcing business rules and
providing operational insights.

> Odoo Hackathon '26 — Virtual Round.

## Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Backend   | FastAPI · SQLAlchemy · SQLite · JWT auth (PyJWT) · bcrypt          |
| Frontend  | React + Vite + TypeScript · Tailwind CSS · TanStack Query · Recharts |
| Auth      | Email/password login with JWT and Role-Based Access Control (RBAC) |

## Roles

- **Fleet Manager** — fleet assets, maintenance, vehicle lifecycle.
- **Driver** — creates trips, assigns vehicles/drivers, monitors deliveries.
- **Safety Officer** — driver compliance, license validity, safety scores.
- **Financial Analyst** — operational expenses, fuel, maintenance cost, ROI.

## Features

| Module | Status | Notes |
| ------ | ------ | ----- |
| Authentication & RBAC | ✅ | JWT login, 4 roles, route + API guards |
| Vehicle Registry | ✅ | CRUD, unique registration, filter by type/status/region, search |
| Drivers & Safety Profiles | ✅ | CRUD, license-expiry flags, safety score, compliance |
| Trip Dispatcher | ✅ | Lifecycle board + full business-rule validation engine |
| Maintenance | ✅ | Auto In-Shop / restore workflow |
| Fuel & Expenses | 🔜 | Operational cost aggregation |
| Dashboard & Analytics | 🔜 | KPIs, charts, ROI, CSV export |

**Access control** — mutations are role-scoped (e.g. only a Fleet Manager may
add, edit or delete vehicles); all authenticated users can read. Registration
numbers are unique, and Retired / In Shop vehicles are excluded from dispatch.

## Getting Started

### 1. Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed          # creates transitops.db with demo data
python -m uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

### 2. Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` → `http://127.0.0.1:8000`.

## Demo Accounts

All accounts use password **`password123`**.

| Role              | Email                   |
| ----------------- | ----------------------- |
| Fleet Manager     | fleet@transitops.com    |
| Driver            | driver@transitops.com   |
| Safety Officer    | safety@transitops.com   |
| Financial Analyst | finance@transitops.com  |

## Project Structure

```
TransitOps/
├── backend/    FastAPI app (models, routers, services, auth, seed)
└── frontend/   React + Vite SPA (pages, components, context, api client)
```
