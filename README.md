# DeskFlow - Support Ticket Triage Board

DeskFlow is a modern MERN stack application designed for support teams to manage and triage tickets with real-time SLA tracking and strict state-transition rules.

## 🚀 Live Demo
- **Frontend**: [https://bajaj-assesment-round-frontend.vercel.app/](https://bajaj-assesment-round-frontend.vercel.app/)
- **Backend API**: [https://deskflow-api-dhruv.vercel.app/](https://deskflow-api-dhruv.vercel.app/)

## ✨ Key Features
- **Kanban Board**: Drag-and-drop-like interface with 4 columns (Open, In Progress, Resolved, Closed).
- **SLA Tracking**: 
  - Urgent: 1 Hour
  - High: 4 Hours
  - Medium: 24 Hours
  - Low: 72 Hours
- **Visual Indicators**: Real-time "SLA BREACHED" badges for overdue tickets.
- **Strict Logic**: Tickets can only move between valid states (e.g., Open ↔ In Progress).
- **Interactive Dashboard**: Summary stats strip showing live ticket counts and breaches.
- **Glassmorphism UI**: Premium, modern design with smooth transitions.

## 🛠️ Tech Stack
- **Frontend**: React.js, Vite, Axios, Lucide-React, Vanilla CSS.
- **Backend**: Node.js, Express, MongoDB Atlas, Mongoose.
- **Deployment**: Vercel (Frontend & Backend).

## 🏗️ Project Structure
```text
deskflow/
├── frontend/             # React (Vite) frontend
│   ├── src/
│   │   ├── App.jsx       # Main Board Logic & UI
│   │   └── index.css     # Premium Styling
├── backend/              # Node.js/Express API
│   ├── models/           # Ticket Schema & Virtuals
│   ├── routes/           # CRUD & Stats Endpoints
│   └── server.js         # Entry point
```

## ⚙️ Setup & Deployment
1. **Clone the repo**:
   ```bash
   git clone https://github.com/Dhruv290405/bajaj-assesment-round.git
   ```
2. **Environment Variables**:
   Create a `.env` in the backend folder:
   ```env
   MONGO_URI=your_mongodb_atlas_uri
   PORT=5000
   ```
3. **Run Locally**:
   - Backend: `npm start` (in `/backend`)
   - Frontend: `npm run dev` (in `/frontend`)

## 📝 Rules Summary
- **Open** tickets can move to **In Progress**.
- **In Progress** can move back to **Open** or forward to **Resolved**.
- **Resolved** can move back to **In Progress** or forward to **Closed**.
- Tickets cannot skip steps or move incorrectly.
- SLA Breach is calculated dynamically based on Priority and Creation Time.

---
Created for the Bajaj Finserv Health Assessment Round.
