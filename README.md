# MOVA — Autonomous Smart Mobility & Fleet Operations Platform

> **Enterprise Smart Mobility SaaS Architecture**  
> An AI-powered mobility operations and fleet intelligence platform engineered for real logistics organizations. MOVA connects real operational data, continuously monitors fleet telematics, calculates deterministic routes & ETAs, detects disruption risks, simulates operational what-if scenarios, provides explainable AI recommendations, and enforces strict human-in-the-loop decision approval before committing changes.

---

## 🔄 Complete Product Loop

```
  ┌─────────────────┐
  │  CONNECT DATA   │  (CSV, Telematics REST, OSRM Routing, Open-Meteo Weather)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │     OBSERVE     │  (Live Geospatial Map, Vehicle Locations, SLA Deadlines)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │  DETECT & PREDICT  (Deterministic Risk Engine, Delay & Hazard Scoring)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │     EXPLAIN     │  (Factor Breakdown, Root Cause Diagnostics, Gemini Reasoning)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │    SIMULATE     │  (Digital Twin Non-Destructive What-If Scenarios)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │    OPTIMIZE     │  (Multi-Objective Alternatives: Speed, Cost, Distance, Risk)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │ HUMAN APPROVAL  │  (Approve / Modify / Reject with Role-Based Access Control)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │  APPLY & AUDIT  │  (Transactional DB Updates, Permanent Activity Logs)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │ MONITOR & MEASURE  (Mobility Health, On-Time Rates, CO₂ Reductions)
  └─────────────────┘
```

---

## 🏷 Data Origin & Transparency Standard

MOVA explicitly tags and classifies all operational data to ensure production integrity:
- **`REAL`**: Received from live GPS hardware pings, vehicle telematics, and authenticated external APIs.
- **`PUBLIC`**: Live road, weather, and geospatial network data from open providers (OSRM OpenStreetMap, Open-Meteo WMO).
- **`USER-PROVIDED`**: Manifests, vehicles, and consignments imported through validated CSV uploads by human dispatchers.
- **`SYNTHETIC/FALLBACK`**: Clearly designated fallback simulation data used only when external hardware or organizations have not yet connected their own live feeds.

---

## 🏢 Multi-Tenant & RBAC Foundation

MOVA isolates all operational resources by tenant organization:
- **Organizations**: Independent tenant boundaries (`organizations` table with unique slugs and domains).
- **Role-Based Access Control (RBAC)**:
  - `admin`: Full platform configuration, user provisioning, integration management, and plan execution.
  - `operations_manager`: Scenario simulation, optimization approvals, fleet adjustments, and alert broadcasts.
  - `dispatcher`: Day-to-day route dispatch, live telematics tracking, and driver communication.
  - `analyst`: Read-only reporting, performance analytics, and risk assessments.
  - `viewer`: Read-only dashboard telemetry.

---

## 🚀 Quick Start Guide

### 1. Backend Server Setup (Node.js & Express)
```bash
cd backend
npm install
npm test      # Runs automated 10/10 test suite
npm start     # Starts API on http://localhost:3001
```

*Note: The backend features an automatic dual-mode database adapter. If `DATABASE_URL` is set, it connects to PostgreSQL with schema migrations. If unconfigured, it transparently operates in high-fidelity In-Memory Mode pre-seeded with complete enterprise operational data for zero-dependency execution.*

### 2. Frontend Command Center (React 19 & Vite)
```bash
cd frontend
npm install
npm run dev   # Opens web app on http://localhost:5173
```

### 🔑 Default Credentials
- **Email:** `demo@mova.ai`
- **Password:** `MovaDemo123!`
- **Role:** Administrator (Apex Mobility Logistics)

---

## 🧪 Automated Test Suite

MOVA includes a built-in test suite and end-to-end simulation runner verifying all critical SaaS subsystems:
```bash
cd backend
npm test                 # Automated 10-unit test suite (routing, weather, risk, tenant, etc.)
node test/e2e-simulation.js  # 12-step full REST API user journey simulation
```
**Test Coverage:**
1. Multi-Tenant Database & Organization Isolation
2. Real Geospatial Turn-by-Turn Routing via TomTom & OSRM OpenStreetMap
3. Real Environmental Telematics via OpenWeatherMap & Open-Meteo (WMO)
4. Deterministic Explainable Risk Engine & Score Reproducibility
5. CSV Ingestion Engine — Schema Validation & Error Rejection
6. Batch CSV Ingestion — Persistent Commit with `USER-PROVIDED` Tag
7. Live GPS Telematics Ping Ingestion & Dynamic Trip Recalculation
8. Digital Twin Scenario Simulation — Non-Destructive What-If Evaluation
9. Human-in-the-Loop Recommendation Approval & Database Auditability
10. Operational Alert System — Lifecycle & Resolution
11. Live Gemini AI Assistant Operational Briefings
12. Multi-Provider Cascade (Google Maps, TomTom, OpenWeatherMap, Open-Meteo)

---

## 🌐 Production Deployment Guide

### Database (PostgreSQL / Supabase / Neon / Railway)
1. Provision a PostgreSQL 15+ database instance.
2. Run database migrations:
   ```bash
   cd backend
   DATABASE_URL="postgres://user:password@host:5432/mova" node src/db/migrate.js
   DATABASE_URL="postgres://user:password@host:5432/mova" node src/db/seed.js
   ```

### Backend (Render / Railway / Fly.io)
1. Deploy the `backend/` directory as a Node.js web service.
2. Set Environment Variables:
   - `PORT=3001`
   - `NODE_ENV=production`
   - `DATABASE_URL=postgres://...`
   - `JWT_SECRET=your-secure-random-256-bit-key`
   - `GEMINI_API_KEY=your-gemini-api-key` (Optional: AI reasoning; fallback enabled if omitted)
   - `FRONTEND_URL=https://your-mova-frontend.vercel.app`

### Frontend (Vercel / Netlify)
1. Deploy the `frontend/` directory.
2. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Set Environment Variable:
   - `VITE_API_URL=https://your-mova-backend.onrender.com` (or configure API reverse proxy)
