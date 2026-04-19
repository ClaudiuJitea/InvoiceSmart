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
*   **AI Document Extraction** – Import scanned PDFs or images and extract company or client data directly into forms using OpenRouter.
*   **Bilingual Intelligence** – Generate invoices in English, Romanian, or both side-by-side.
*   **Pro Exchange Rates** – Integration with the National Bank of Romania (BNR) for real-time currency conversions.
*   **Advanced Analytics** – Dashboard with revenue charts, client statistics, performance tracking, and themed report cards.
*   **Premium Templates** – Multiple high-end invoice designs (Modern, Classic, Blue, Creative).
*   **Operational Documents** – Invoices, delivery notes, receipts, client management, and reusable document numbering templates.
*   **Flexible Storage** – SQLite by default, with PostgreSQL, MySQL, MariaDB, and Supabase configuration support.
*   **Robust Architecture** – Express.js backend with authenticated API routes and persistent local or external storage.
*   **Responsive Design** – Optimized for desktop, tablet, and mobile browsers.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Vanilla JS (ES6+), Vite, Material Design 3 |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | SQLite3, PostgreSQL, MySQL, MariaDB, Supabase |
| **PDF Engine** | jsPDF, html2canvas |
| **Integrations** | BNR Exchange Rate API, OpenRouter |

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

### 5. Optional MySQL Container Helper
Use the included script to deploy/manage a local MySQL container:

```bash
./manage-mysql.sh deploy
```

Supported commands:

```bash
./manage-mysql.sh {deploy|start|stop|restart|delete|status}
```

You can override defaults with env vars, for example:

```bash
MYSQL_ROOT_PASSWORD=strong_root_pass \
MYSQL_USER=invoicesmart_user \
MYSQL_PASSWORD=strong_user_pass \
MYSQL_DATABASE=invoicesmart \
MYSQL_PORT=3306 \
./manage-mysql.sh deploy
```

At the end of `deploy`, the script prints:
- MySQL connection credentials
- InvoiceSmart admin login info
- Default user login info (if `DEFAULT_USER_USERNAME` and `DEFAULT_USER_PASSWORD` are set)

### 6. AI Document Extraction Setup
AI extraction is configured from the application UI and runs through authenticated backend routes.

1. Log in to InvoiceSmart.
2. Open `Settings`.
3. In `AI Document Extraction`, enable extraction.
4. Enter your OpenRouter API key.
5. Keep the default model `google/gemma-4-26b-a4b-it` or choose another model from the refreshed list.
6. Use `Save AI Settings`, then `Test Connection`.

Current extraction entry points:
- `Settings` → `Extract Company Details`
- `Clients` → `New Client` / `Edit Client` → `Extract Client Details`

Supported upload types:
- PDF
- PNG
- JPEG
- WebP

Notes:
- AI endpoints require authentication, so `401 Unauthorized` responses indicate the user is not logged in or the token is missing/expired.
- The API key is stored server-side and is intentionally not shown again after save.

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
2.  **Setup**: Configure your business profile in Settings, including bank details, document series, database provider, and optional AI extraction.
3.  **Clients**: Register clients manually or import their details from scanned documents.
4.  **Billing**: Create invoices, delivery notes, and receipts using the dynamic forms with BNR integration.
5.  **Reports**: Review dashboard and reports data for revenue, status distribution, and top clients.
6.  **Templates**: Choose and preview templates before downloading PDFs.

---

## Default Login Credentials

- Admin username: `admin`
- Admin password: `admin123`
- Admin values come from server env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- Standard user: no default seeded user; create one from `#/register` (or provide `DEFAULT_USER_USERNAME` + `DEFAULT_USER_PASSWORD` when using `manage-mysql.sh`)

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
