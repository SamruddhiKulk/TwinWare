# TwinWare — Digital Twin-Based Warehouse Monitoring and Asset Visualization System

**TwinWare** is a full-stack warehouse management and asset monitoring web application designed as an MCA mini-project. It introduces an interactive 2D Digital Twin representation of physical warehouse shelf racks, equipment machinery, and inventory distribution, connecting real-time database state with visual top-down warehouse floor telemetry.

---

## 🌟 Key Highlights & Engineering Features

* **Interactive 2D Digital Twin Floor:** Real-time top-down 2D warehouse layout arranged in rows and columns across multiple zones. Clicking any shelf node opens an interactive inspection drawer displaying live inventory, capacity utilization, and instant Stock-In/Stock-Out triggers.
* **Strict Negative Stock Protection:** Server-side transactional guards ensure no shelf or product stock can ever drop below zero.
* **Automated Exception & Alert Engine:** Dynamically tracks reorder levels, shelf overcapacity, and machine status (Operational / Maintenance / Offline), preserving alert history and preventing duplicate unresolved alerts for the same condition.
* **Role-Based Access Control:** Admin manages warehouse records, Managers perform operations, and Auditors / Viewers have read-only access. The API checks roles against the authenticated database user.
* **Movement Audit History:** Automatically records every `STOCK_IN`, `STOCK_OUT`, and `TRANSFER` transaction with user timestamps, reference/PO numbers, and audit notes.
* **Analytical Dashboards & Reports:** Multi-zone capacity utilization, category breakdown, inventory valuation ($), and machinery reliability reports powered by Recharts.
* **One-Click Demo Authentication:** Pre-seeded demo user accounts with fast-fill buttons for seamless live demonstrations and evaluations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19 (Vite), Tailwind CSS v4, Lucide React, Recharts, React Router v7, Axios |
| **Backend** | Node.js, Express.js (Modular Controllers, Routes, Middleware, Services) |
| **Database** | MongoDB (Atlas or Local) using Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT) & bcrypt.js password hashing |
| **Testing** | REST API testing via Postman / PowerShell, Browser functional testing |

---

## 📁 Project Directory Structure

```
TwinWare_Mini_Project/
├── backend/
│   ├── config/             # MongoDB connection setup
│   ├── controllers/        # Modular API route controllers
│   ├── middleware/         # JWT Bearer token protection middleware
│   ├── models/             # Mongoose Schemas (User, Shelf, Product, InventoryItem, etc.)
│   ├── routes/             # REST API endpoint definitions
│   ├── services/           # Alert engine (low-stock, equipment status, capacity sync)
│   ├── .env.example        # Environment variables template
│   ├── package.json        # Backend scripts and dependencies
│   ├── seed.js             # Automated database seeding script
│   └── server.js           # Express application entry point
└── frontend/
    ├── src/
    │   ├── components/     # Navbar, ShelfModal (twin inspector), StockModal
    │   ├── context/        # AuthContext (JWT session management)
    │   ├── pages/          # Login, Register, Dashboard, DigitalTwin, Inventory, Shelves, Equipment, Alerts, Reports
    │   ├── services/       # Axios API client with token interceptor
    │   ├── App.jsx         # Router & Protected Route wrapper
    │   └── main.jsx        # React root
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js** (v18 or higher)
2. **MongoDB** (Local MongoDB Server or free MongoDB Atlas cloud cluster)

---

### Step 1: Configure the Backend

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create or verify the `.env` file (copied from `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/TanwinWare
   JWT_SECRET=your_secure_jwt_secret_key_here
   ```
   *(Replace `MONGO_URI` with your MongoDB Atlas connection string if using cloud database).*

3. Install backend dependencies (if not already installed):
   ```bash
   npm install
   ```

4. **Seed Realistic Demo Data:**
   Run the seed script to reset and populate the database with realistic products, shelves, equipment, and alerts:
   ```bash
   npm run seed
   ```

5. **Start the Backend Server:**
   ```bash
   npm run dev
   ```
   The backend will start on **`http://localhost:5000`**.

---

### Step 2: Configure & Start Frontend

1. In a separate terminal, navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the displayed URL (typically **`http://localhost:5173`**).

---

## 🔑 Demo Credentials

For quick evaluation, use a demo button on the Login page:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@twinware.com` | `adminpassword123` | Full access to all modules, inventory, shelves, and fleet |
| **Warehouse Manager** | `manager@twinware.com` | `managerpassword123` | Operational access to stock movement, digital twin, and alerts |
| **Auditor / Viewer** | `viewer@twinware.com` | `viewerpassword123` | Read-only access to monitoring, reports, alerts, and movement history |

Public registration creates a Warehouse Manager account. Assigning administrator or viewer roles is not exposed through public registration.

---

## 📡 API Endpoint Reference

All protected endpoints require the HTTP header:  
`Authorization: Bearer <your_jwt_token>`

### 1. Authentication
* `POST /api/auth/register` — Register a new user
* `POST /api/auth/login` — Sign in and receive JWT token
* `GET  /api/auth/me` — Get current authenticated user profile

### 2. Digital Twin & Shelves
* `GET    /api/shelves` — Get all shelves with live occupancy %, products, and 2D grid coordinates
* `GET    /api/shelves/:id` — Inspect a single shelf and its stored products
* `POST   /api/shelves` — Create a new warehouse shelf rack (Admin)
* `PUT    /api/shelves/:id` — Update shelf capacity or status (Admin)
* `DELETE /api/shelves/:id` — Remove shelf (Admin; guarded against occupied shelves)

### 3. Inventory & Movements
* `GET  /api/inventory` — Query active inventory items
* `POST /api/inventory/stock-in` — Receive stock into a shelf (Admin / Manager; logs `STOCK_IN` movement)
* `POST /api/inventory/stock-out` — Dispatch stock (Admin / Manager; guards against negative quantities, logs `STOCK_OUT`)
* `POST /api/inventory/transfer` — Relocate inventory between shelves (Admin / Manager; logs `TRANSFER`)
* `GET  /api/inventory/movements` — Complete audit trail of stock movements

### 4. Products Catalog
* `GET    /api/products` — List catalog products with calculated total stock across shelves
* `POST   /api/products` — Create new product (Admin)
* `PUT    /api/products/:id` — Edit product details and reorder threshold (Admin)
* `DELETE /api/products/:id` — Delete product (Admin; guarded if units are currently stored)

### 5. Equipment Fleet
* `GET    /api/equipment` — List warehouse machines with health and status
* `POST   /api/equipment` — Add machinery to fleet (Admin)
* `PUT    /api/equipment/:id` — Admin edits equipment; Admin / Manager can update status (`Operational`, `Maintenance`, `Offline`) — *auto-generates/resolves alerts*
* `DELETE /api/equipment/:id` — Remove machine (Admin)

### 6. Alerts & Exceptions
* `GET /api/alerts` — Get active and historical system alerts
* `PUT /api/alerts/:id/acknowledge` — Acknowledge an active alert (Admin / Manager)
* `PUT /api/alerts/:id/resolve` — Mark an active or acknowledged alert resolved (Admin / Manager)

### 7. Dashboard & Reports
* `GET /api/dashboard/summary` — Database-derived KPI totals, category charts, and zone usage
* `GET /api/reports/inventory` — Comprehensive stock valuation and product status report
* `GET /api/reports/shelves` — Space utilization analytics matrix
* `GET /api/reports/equipment` — Machinery health and scheduled maintenance report

---

## 🎓 Academic Viva & Presentation Notes

When presenting **TwinWare** to faculty or evaluators:
1. **Explain the Digital Twin concept:** Clarify that TwinWare creates a database-synchronized software twin where physical warehouse shelves and equipment status are visually mirrored on a 2D floor map.
2. **Demonstrate Data Integrity:** Show that trying to stock out more items than available on a shelf produces an immediate descriptive server-side error, preventing negative stock.
3. **Show Automated Alerting:** Change a piece of equipment (e.g., Forklift `FL-01`) to `Offline` or `Maintenance` and show how the system immediately generates an active alert in the notification center and dashboard without manual entry.
4. **Demonstrate Audit Traceability:** Perform a Stock-In or Stock-Out and navigate to the **Movement History** tab to show the permanent chronological audit log with timestamp and user attribution.
