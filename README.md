# Full-Stack Expense Tracker 💰

A production-quality expense tracker built with Node.js, Express, SQLite, and React. Designed to handle real-world scenarios gracefully with strong data consistency and a premium user interface.

## 🌟 Key Features & Design Decisions

### 1. Robust Money Handling (Stored as Cents)
Financial data should never be stored as floating-point numbers due to precision bugs (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- **Backend:** All amounts are processed and stored in the SQLite database as integers representing cents (e.g., `₹123.45` → `12345`).
- **Frontend:** Values are converted back to formatted currency strings strictly for display purposes.

### 2. Idempotency (`client_request_id`)
To prevent duplicate expenses resulting from double-clicks, network retries, or page refreshes:
- The React frontend generates a unique UUID (`client_request_id`) for every new form submission.
- The Node backend enforces a `UNIQUE` constraint on this ID.
- If the backend receives an identical ID, it acts idempotently—bypassing creation and responding `200 OK` with the already created record.

### 3. Glassmorphism UI
- Fully custom UI utilizing vanilla CSS to create a lightweight, responsive, and vibrant glassmorphism design.
- Uses dynamic backgrounds, smooth micro-animations on hover, and structural grid layouts.

## 🚀 Tech Stack
- **Frontend:** React + Vite, Vanilla CSS.
- **Backend:** Node.js, Express.js.
- **Database:** SQLite (`better-sqlite3`).
- **Testing:** Jest + Supertest (Backend).

---

## 🛠️ Getting Started

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
*(The backend runs on `http://localhost:3001`)*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*(The frontend runs on `http://localhost:5173`)*

## 🧪 Testing

The backend includes a comprehensive Jest test suite ensuring the core business logic (cents conversion and idempotency) functions flawlessly.
```bash
cd backend
npm test
```

## 📁 Architecture
```
expense-tracker/
├── backend/
│   ├── db.js             # SQLite setup & schema migration
│   ├── index.js          # Express app entry
│   ├── middleware/
│   │   └── validate.js   # Input validation
│   ├── routes/
│   │   └── expenses.js   # API logic
│   └── tests/            # Jest test suite
└── frontend/
    └── src/
        ├── App.jsx       # Main state controller
        ├── api.js        # Fetch API wrapper
        ├── components/   # React components
        └── index.css     # Premium UI styling
```
