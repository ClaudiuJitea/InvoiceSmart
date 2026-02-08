<p align="center">
  <img src="public/favicon.svg" width="128" height="128" alt="InvoiceSmart Logo">
</p>

<h1 align="center">InvoiceSmart</h1>

<p align="center">
  A premium, full-stack invoice management system designed with modern Material You aesthetics.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-black.svg" alt="License">
  <img src="https://img.shields.io/badge/Node.js-18+-black.svg" alt="Node Version">
  <img src="https://img.shields.io/badge/Built%20with-Vite-black.svg" alt="Vite">
  <img src="https://img.shields.io/badge/Design-Material--You-black.svg" alt="Design">
</p>

---

## Key Features

*   **Material You UI** – A minimalist, responsive interface with smooth transitions and premium typography.
*   **Secure Authentication** – User authentication system with JWT-protected routes and BCrypt password encryption.
*   **Bilingual Intelligence** – Generate invoices in English, Romanian, or both side-by-side.
*   **Pro Exchange Rates** – Integration with the National Bank of Romania (BNR) for real-time currency conversions.
*   **Advanced Analytics** – Dashboard with revenue charts, client statistics, and performance tracking.
*   **Premium Templates** – Multiple high-end invoice designs (Modern, Classic, Blue, Creative).
*   **Robust Architecture** – Express.js backend with persistent SQLite storage.
*   **Responsive Design** – Optimized for desktop, tablet, and mobile browsers.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Vanilla JS (ES6+), Vite, Material Design 3 |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | SQLite3 (Persistent storage) |
| **PDF Engine** | jsPDF, html2canvas |
| **Integrations** | BNR Exchange Rate API |

---

## Getting Started

### Prerequisites

*   Node.js 18.x or higher
*   NPM 9.x or higher

### 1. Repository Setup
```bash
git clone https://github.com/ClaudiuJitea/InvoiceSmart.git
cd InvoiceSmart
```

### 2. Backend Initialization
```bash
cd server
npm install
npm run dev
```
*The API runs on `http://localhost:3000`*

### 3. Frontend Initialization
```bash
# In a new terminal
npm install
npm run dev
```
*The application is available at `http://localhost:5173`*

### 4. One-Command Local Development (Optional)
```bash
# From project root (after both installs above)
npm run dev:full
```
*Starts both backend (`:3000`) and frontend (`:5173`) together.*

---

## Project Structure

```text
InvoiceSmart/
├── src/                # Frontend Application
│   ├── components/     # UI Components
│   ├── db/             # API Clients & Service Layer
│   ├── pages/          # View Definitions
│   ├── styles/         # CSS System
│   └── templates/      # Invoice PDF Templates
├── server/             # Express.js Backend
│   ├── routes/         # API Endpoints
│   ├── middleware/     # Security Layer
│   └── database.js     # Persistence Layer
├── public/             # Static Assets
└── index.html          # Entry Point
```

---

## Usage Guide

1.  **Onboarding**: Create an account to access your personal dashboard.
2.  **Setup**: Configure your business profile in Settings.
3.  **Clients**: Register clients for quick invoice generation.
4.  **Billing**: Create invoices using the dynamic form with BNR integration.
5.  **Templates**: Choose and preview templates before downloading PDFs.

---

## Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

**Claudiu Jitea** – [GitHub](https://github.com/ClaudiuJitea)

Project Link: [https://github.com/ClaudiuJitea/InvoiceSmart](https://github.com/ClaudiuJitea/InvoiceSmart)
