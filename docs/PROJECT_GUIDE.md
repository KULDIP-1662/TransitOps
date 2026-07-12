# TransitOps — Complete Project Guide

A deep, coding-level walkthrough of the whole application: what each feature does,
which files/endpoints implement it, the exact rules and formulas, and **how every
action ripples across roles, statuses and KPIs.** Read this before demoing.

---

## 1. What the app is (in one paragraph)

TransitOps is a **transport-operations platform**. It manages the full lifecycle of a
logistics fleet — vehicles, drivers, trips, maintenance, fuel/expenses — and, crucially,
**enforces the business rules automatically** so operators can't make the classic
spreadsheet mistakes (double-booking a vehicle, sending an expired-license driver,
dispatching a vehicle that's in the shop, losing track of costs). It then rolls all of
that up into **KPIs, charts and reports**.

---

## 2. Architecture & how a request flows

```
Browser (React SPA, :5173)
   │  fetch('/api/...')  with  Authorization: Bearer <JWT>
   ▼
Vite dev server proxy  ──►  FastAPI (:8000)
                               │  1. CORS
                               │  2. Route matches a router (e.g. trips.py)
                               │  3. Depends(require_role(...)) checks JWT + role  → 401/403
                               │  4. Handler calls a service (trip_rules / analytics)
                               │  5. SQLAlchemy reads/writes SQLite (transitops.db)
                               │  6. Pydantic schema serializes the response
                               ▼
                            JSON back to React → TanStack Query caches it → UI renders
```

**Backend** = FastAPI + SQLAlchemy + SQLite. **Frontend** = React + Vite + TypeScript +
Tailwind + TanStack Query + Recharts.

### Directory map (what lives where)

```
backend/app/
  main.py            # creates the app, registers every router, CORS, /api/health
  database.py        # SQLAlchemy engine + SessionLocal + get_db() dependency
  core/
    config.py        # settings (DB url, JWT secret, token expiry)
    security.py      # bcrypt hash/verify + JWT encode/decode
    deps.py          # get_current_user() and require_role() — the RBAC guards
  models/            # SQLAlchemy tables (one file per entity) + enums.py
  schemas/           # Pydantic request/response shapes (validation + serialization)
  routers/           # one file per resource: the HTTP endpoints
  services/          # business logic:
    trip_rules.py        # trip validation engine + status transitions
    maintenance_rules.py # vehicle In-Shop / restore automation
    analytics.py         # dashboard KPIs + reports/ROI/efficiency
  seed.py            # demo data (users, fleet, drivers, trips, maintenance, fuel)

frontend/src/
  lib/api.ts         # axios client; attaches the JWT to every request
  lib/format.ts      # ₹ INR + number + date formatters
  lib/status.ts      # status → colour maps (+ status lists)
  lib/chartTheme.ts  # colourblind-safe chart palette (light/dark)
  context/AuthContext.tsx    # who is logged in; login()/logout()
  context/ThemeContext.tsx   # light/dark toggle
  components/        # reusable UI: DataTable, Modal, ConfirmDialog, StatCard,
                     #   KanbanBoard, ChartCard, ErrorBoundary, Layout, ui.tsx
  api/               # typed API callers per resource (vehicles, drivers, trips, …)
  pages/             # one page per screen (Dashboard, Vehicles, Drivers, Trips,
                     #   Maintenance, Fuel, Reports, Settings, Login)
  App.tsx            # routes + which role may see which page
```

**Mental model:** a **router** is the door (HTTP + who's allowed), a **service** is the
brain (the rules), a **model** is the table, a **schema** is the contract with the
frontend. Frontend **api/** files call the doors; **pages/** render the data.

---

## 3. Data model (the entities)

| Entity | Key fields | Status values |
|---|---|---|
| **User** | name, email (unique), password_hash, **role** | — |
| **Vehicle** | registration_number (unique), name_model, type, max_load_capacity, odometer, acquisition_cost, region | **Available · On Trip · In Shop · Retired** |
| **Driver** | name, license_number (unique), license_category, license_expiry_date, contact_number, safety_score | **Available · On Trip · Off Duty · Suspended** |
| **Trip** | source, destination, vehicle_id→, driver_id→, cargo_weight, planned_distance, final_odometer, fuel_consumed, revenue | **Draft · Dispatched · Completed · Cancelled** |
| **MaintenanceLog** | vehicle_id→, description, cost, start_date, end_date | **Open · Closed** |
| **FuelLog** | vehicle_id→, trip_id→, liters, cost, odometer, date | — |
| **Expense** | vehicle_id→, trip_id→, category (Toll/Maintenance/Parking/Other), amount, description, date | — |

The statuses are the heart of the system — most rules are about **who is allowed to
change a status, and what else changes when it does** (see §6 and §11).

Defined in `backend/app/models/*.py`; the status strings live in `models/enums.py`.

---

## 4. Roles & RBAC (who can do what)

Every User has exactly one **role**. Roles decide **actions**, not just visibility.

| Module | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Vehicles (Fleet) | **Manage** | view | view | view |
| Drivers | **Manage** | view | **Manage** | view |
| Trips | view | **Manage** | view | view |
| Maintenance | **Manage** | — | — | — |
| Fuel & Expenses | **Manage** | view | view | **Manage** |
| Analytics / Reports | **view** | — | — | **view** |
| Settings | **Manage** | — | — | — |

**How it's enforced (two layers):**
1. **Server (authoritative)** — `core/deps.py` has `require_role(*roles)`. Each mutating
   endpoint depends on it, e.g. vehicles' create/update/delete use
   `require_role("FLEET_MANAGER")`. A wrong role → **HTTP 403**, even if someone bypasses
   the UI. Read endpoints mostly use `get_current_user` (any logged-in user).
2. **UI (convenience)** — `App.tsx` wraps role-restricted routes in `<ProtectedRoute
   roles={[...]}>`, and `Layout.tsx` hides nav items and Add/Edit/Delete buttons the role
   can't use. `Settings.tsx` renders the matrix above so it's self-documenting.

**JWT / login flow:** `POST /api/auth/login` → `security.verify_password` (bcrypt) →
`security.create_access_token` mints a JWT holding the user id + role, valid 12h. The
browser stores it (localStorage) and `lib/api.ts` attaches `Authorization: Bearer <token>`
to every call. `deps.get_current_user` decodes it and loads the User; expired/invalid →
401 and the frontend bounces to `/login`.

---

## 5. The status state machines (the core concept)

Almost every rule is one of these transitions. Nothing else may change a status.

**Vehicle:**
```
Available ──dispatch a trip──► On Trip ──complete/cancel──► Available
Available ──open maintenance──► In Shop ──close maintenance──► Available
(Retired is terminal; set manually; always excluded from dispatch)
```
**Driver:**
```
Available ──dispatch──► On Trip ──complete/cancel──► Available
(Off Duty / Suspended are set manually; both block assignment)
```
**Trip:**
```
Draft ──dispatch──► Dispatched ──complete──► Completed
  └──────────────── cancel ───────────────► Cancelled
```
**Maintenance:** `Open ⇄ Closed` (Open ⇒ vehicle In Shop; last Close ⇒ vehicle Available).

---

## 6. Feature-by-feature (coding level + cross-role effects)

### 6.1 Authentication
- **Endpoints:** `POST /api/auth/login`, `GET /api/auth/me`
- **Files:** `routers/auth.py`, `core/security.py`, `core/deps.py`; frontend
  `context/AuthContext.tsx`, `pages/Login.tsx`.
- **What happens:** login verifies the bcrypt hash and returns `{access_token, user}`.
  `/me` re-hydrates the session on refresh. Logout clears the token.
- **Affects everyone:** the role in the token is what every other endpoint checks.

### 6.2 Dashboard
- **Endpoint:** `GET /api/dashboard` (any logged-in user)
- **Files:** `services/analytics.py::compute_dashboard`, `routers/dashboard.py`;
  frontend `pages/Dashboard.tsx`.
- **What it returns / KPIs:**
  - **Active Vehicles** = vehicles not Retired
  - **Available / In Maintenance / On Trip** = counts by status
  - **Active Trips** = Dispatched count · **Pending Trips** = Draft count · **Completed Trips**
  - **Drivers On Duty** = Available + On Trip drivers
  - **Fleet Utilization %** = `round(on_trip_vehicles / active_vehicles × 100)`
  - **Vehicle Status** breakdown (donut) + **Recent Trips** (latest 6)
  - **License Alerts** = drivers whose license is expired or expires within 30 days
- **Cross-role:** it's a live mirror — dispatching a trip, opening maintenance, or a
  license lapsing all change these numbers immediately.

### 6.3 Vehicle Registry (Fleet)
- **Endpoints:** `GET /api/vehicles` (filters: type/status/region/search), `GET /{id}`,
  `POST`, `PATCH /{id}`, `DELETE /{id}` (mutations = Fleet Manager).
- **Files:** `routers/vehicles.py`, `schemas/vehicle.py`; frontend `pages/Vehicles.tsx`,
  `api/vehicles.ts`.
- **Rules in code:** registration is unique — `_find_by_registration` does a
  case-insensitive lookup; create/rename to a duplicate → **409**. On create the reg is
  normalized to UPPERCASE and status defaults to Available.
- **Cross-role effects:**
  - Setting a vehicle **Retired** or **In Shop** removes it from the Trip Dispatcher's
    vehicle dropdown (the dispatch-pool query filters to Available only).
  - `acquisition_cost` feeds **ROI**; `odometer` is rolled forward when a trip completes.

### 6.4 Drivers & Safety Profiles
- **Endpoints:** `GET /api/drivers` (status/search filters), `POST`, `PATCH`, `DELETE`
  (mutations = Fleet Manager **or** Safety Officer).
- **Files:** `routers/drivers.py`, `schemas/driver.py`; frontend `pages/Drivers.tsx`.
- **Computed fields (server):** `license_expired`, `expiring_soon` (≤30 days),
  `days_to_expiry`, and `trip_completions` (count of that driver's Completed trips).
  Unique license enforced (409 on duplicate).
- **Cross-role effects:**
  - A driver who is **Suspended**, **Off Duty**, or whose **license is expired** is
    excluded from the dispatch pool and rejected at trip creation.
  - Expiring/expired licenses surface in the **Dashboard compliance alerts** — the
    Safety Officer's job made visible to everyone.

### 6.5 Trip Dispatcher — the business-rule engine
- **Endpoints (all = Driver role):** `GET /api/trips`, `GET /api/trips/dispatch-options`,
  `POST /api/trips`, `POST /{id}/dispatch`, `POST /{id}/complete`, `POST /{id}/cancel`.
- **Files:** `services/trip_rules.py` (the engine), `routers/trips.py`,
  `schemas/trip.py`; frontend `pages/Trips.tsx`, `components/KanbanBoard.tsx`.
- **`dispatch-options`** returns only **Available vehicles** and **eligible drivers**
  (Available + not license-expired). This is why the create form's dropdowns are always
  safe.
- **The rules (`trip_rules.validate_assignment`)**, enforced on create *and* re-checked on
  dispatch:
  1. Vehicle must not be Retired / In Shop / On Trip.
  2. Driver must not be Suspended / On Trip / Off Duty, and license not expired.
  3. `cargo_weight ≤ vehicle.max_load_capacity` (UI also blocks live and shows
     "Capacity exceeded by X kg").
  Any failure → **HTTP 422** with a human message.
- **Status transitions (automatic):**
  - **dispatch** → vehicle **On Trip** + driver **On Trip**, trip → Dispatched.
  - **complete** (needs final odometer + fuel) → vehicle **Available** + driver
    **Available**, odometer rolled forward, revenue banked, trip → Completed.
  - **cancel** → if it was Dispatched, release vehicle + driver back to **Available**;
    trip → Cancelled.
- **Cross-role effects (huge):** dispatching pulls a vehicle and driver out of
  circulation everywhere at once — they vanish from the dispatch pool, the Fleet and
  Drivers pages show *On Trip*, and the Dashboard's Active Trips / Utilization climb.
  Completing feeds **fuel efficiency, operational cost and ROI** in Reports.

### 6.6 Maintenance
- **Endpoints:** `GET /api/maintenance`, `POST`, `PATCH /{id}`, `DELETE` (mutations =
  Fleet Manager).
- **Files:** `services/maintenance_rules.py`, `routers/maintenance.py`,
  `schemas/maintenance.py`; frontend `pages/Maintenance.tsx`.
- **Automation (`maintenance_rules`):**
  - `ensure_can_open` blocks opening a record on an **On Trip** vehicle (422).
  - `sync_vehicle_status` recomputes after every create/close/delete: if the vehicle has
    **any open record → In Shop**; if none and it was In Shop → **Available** (Retired is
    left alone). Closing auto-stamps `end_date`.
- **Cross-role effects:** opening a record **immediately removes the vehicle from the
  Driver's dispatch pool** and bumps the Dashboard's "In Maintenance" count; the record's
  `cost` counts toward **operational cost** and lowers that vehicle's **ROI**.

### 6.7 Fuel & Expenses
- **Endpoints:** `GET/POST/DELETE /api/fuel`, `GET/POST/DELETE /api/expenses`,
  `GET /api/costs/summary` (mutations = Financial Analyst or Fleet Manager).
- **Files:** `routers/fuel.py`, `routers/expenses.py`, `routers/costs.py`,
  `schemas/fuel.py|expense.py|cost.py`; frontend `pages/Fuel.tsx`.
- **KPI — Operational Cost:** `costs/summary` groups fuel cost and maintenance cost by
  vehicle and returns per-vehicle and total **Operational Cost = Fuel + Maintenance**
  (tolls/parking are tracked separately as "other expenses").
- **Cross-role effects:** every fuel log and maintenance record changes the operational
  cost tiles here **and** the ROI/efficiency figures in Reports.

### 6.8 Reports & Analytics
- **Endpoints:** `GET /api/reports`, `GET /api/reports/export.csv` (Fleet Manager or
  Financial Analyst).
- **Files:** `services/analytics.py::compute_reports`, `routers/reports.py`;
  frontend `pages/Reports.tsx`, `lib/chartTheme.ts`.
- **Formulas (per vehicle):**
  - **Fuel Efficiency** = completed-trip distance ÷ fuel-log liters (km/L)
  - **Operational Cost** = fuel cost + maintenance cost
  - **Revenue** = Σ revenue of that vehicle's **Completed** trips
  - **Vehicle ROI** = `(Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost × 100`
  - Fleet-level: total distance ÷ total liters, fleet utilization, total operational
    cost, monthly revenue.
- **Charts:** operational-cost bar (single hue), ROI bar (green for ≥0, red for <0),
  per-vehicle table. **Export CSV** streams from the server; **Export PDF** is built
  client-side (jsPDF) from the same data.

### 6.9 Settings & RBAC
- **Files:** frontend `pages/Settings.tsx` (frontend-only; general prefs persist in
  localStorage). The **RBAC matrix** table documents the exact permissions in §4.

---

## 7. Cross-module effect map (memorise this for the demo)

| Action (by role) | Immediate effects across the system |
|---|---|
| **Dispatch trip** (Driver) | vehicle+driver → On Trip · both leave dispatch pool · Fleet & Drivers pages show On Trip · Dashboard Active Trips↑, Utilization↑ |
| **Complete trip** (Driver) | vehicle+driver → Available · odometer rolled forward · revenue banked → Reports ROI/efficiency update · Completed Trips↑ |
| **Cancel dispatched trip** (Driver) | vehicle+driver → Available (released) |
| **Open maintenance** (Fleet Mgr) | vehicle → In Shop · leaves dispatch pool · Dashboard In-Maintenance↑ · cost → operational cost, ROI↓ |
| **Close maintenance** (Fleet Mgr) | vehicle → Available (if no other open record) · returns to dispatch pool |
| **Log fuel / expense** (Fin. Analyst) | operational cost↑ · fuel efficiency & ROI recompute |
| **Retire a vehicle** (Fleet Mgr) | excluded from dispatch pool and from "Active Vehicles" |
| **Driver license expires** | shows in Dashboard alerts · driver blocked from new trips |
| **Suspend a driver** (Safety Off.) | blocked from dispatch pool and trip creation |

---

## 8. Running it & demo credentials

```bash
# Backend
cd backend && python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
python -m app.seed                 # loads demo data
python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

All demo accounts use password **`password123`**:

| Role | Email |
|---|---|
| Fleet Manager | fleet@transitops.com |
| Driver | driver@transitops.com |
| Safety Officer | safety@transitops.com |
| Financial Analyst | finance@transitops.com |

Seed data intentionally includes the spec's example entities — **VAN-05** (500 kg) and
driver **Alex** — plus **John** (expired license + suspended) and **Meena** (license
expiring soon) so every rule and alert is demonstrable out of the box.

---

## 9. Bonus features (beyond the mandatory 7 modules)

Dark mode · global search bar · per-list filters/search/sorting · **compliance alerts**
for expiring licenses · **CSV + PDF** report export · responsive layout · graceful error
boundary · colourblind-safe chart palette.

---

## 10. Mandatory business rules → where each one lives

| Spec rule | Enforced in |
|---|---|
| Registration number unique | `routers/vehicles.py::_find_by_registration` |
| Retired/In-Shop vehicles never dispatchable | `trips.py::dispatch_options` + `trip_rules.validate_assignment` |
| Expired/Suspended drivers can't be assigned | `trip_rules.validate_assignment` |
| Vehicle/driver already On Trip can't be reused | `trip_rules.validate_assignment` |
| Cargo ≤ capacity | `trip_rules.validate_assignment` (+ live UI check) |
| Dispatch → both On Trip | `trip_rules.dispatch_trip` |
| Complete → both Available | `trip_rules.complete_trip` |
| Cancel dispatched → restore | `trip_rules.cancel_trip` |
| Active maintenance → In Shop | `maintenance_rules.sync_vehicle_status` |
| Close maintenance → Available (unless Retired) | `maintenance_rules.sync_vehicle_status` |
```
