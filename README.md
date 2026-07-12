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
