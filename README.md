# InvoiceSmart

> A modern, local-first invoice generator and management system built with Material You design principles.

![InvoiceSmart](public/icon.png)

## Features

- **Material You Design** - Beautiful, modern UI using Material Design 3
- **Local-First** - All data stored locally in SQLite (via SQL.js) - no server required
- **Bilingual Support** - Create invoices in English, Romanian, or both languages side-by-side
- **Multiple Templates** - Choose from Modern, Classic, Classic Blue, or Creative invoice designs
- **Multi-Currency** - Support for EUR, RON, USD with automatic BNR exchange rate fetching
- **Reports & Analytics** - Comprehensive reporting with visual charts and CSV/PDF export
- **Client Management** - Store client details including bank information and addresses
- **Per-Item VAT** - Variable tax rates for individual line items
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **i18n Ready** - Fully internationalized interface

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ClaudiuJitea/InvoiceSmart.git
cd InvoiceSmart
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve them with any static file server or open `index.html` directly in your browser.

## Architecture

InvoiceSmart is built as a **Single Page Application (SPA)** with no backend dependencies:

- **Frontend Framework**: Vanilla JavaScript (no framework dependencies)
- **Database**: SQLite via [SQL.js](https://github.com/sql-js/sql.js/) (client-side, in-browser database)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://github.com/niklasvh/html2canvas)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Custom CSS with Material You design tokens

### Project Structure

```
InvoiceSmart/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Common components (Toast, Modal, etc.)
│   │   ├── Sidebar.js     # Navigation sidebar
│   │   └── icons.js       # SVG icon definitions
│   ├── db/                # Database layer
│   │   ├── database.js    # SQLite setup and schema
│   │   └── services/      # Data access services
│   ├── i18n/              # Internationalization
│   │   ├── en.js          # English translations
│   │   ├── ro.js          # Romanian translations
│   │   └── index.js       # i18n utilities
│   ├── pages/             # Application pages
│   │   ├── Dashboard.js
│   │   ├── Invoices.js
│   │   ├── InvoiceForm.js
│   │   ├── InvoicePreview.js
│   │   ├── Clients.js
│   │   ├── ClientForm.js
│   │   ├── Reports.js
│   │   └── Settings.js
│   ├── services/          # External services
│   │   └── bnrService.js  # BNR exchange rate API
│   ├── styles/            # Global styles
│   │   ├── tokens.css     # Material You design tokens
│   │   ├── base.css       # Base styles
│   │   └── components.css # Component styles
│   ├── templates/         # Invoice templates
│   │   ├── modern.js
│   │   ├── classic.js
│   │   ├── classicBlue.js
│   │   └── creative.js
│   ├── router.js          # Hash-based router
│   └── main.js            # Application entry point
├── public/
│   └── icon.png           # App icon
├── index.html             # HTML entry point
├── package.json
├── vite.config.js
└── README.md
```

## Usage

### Creating Your First Invoice

1. **Configure Settings** - Go to Settings and fill in your company details
2. **Add a Client** - Navigate to Clients and create a new client record
3. **Create Invoice** - Go to Invoices → New Invoice
4. **Fill Details** - Select client, add line items, set dates and currency
5. **Preview & Export** - Preview and download as PDF

### Invoice Templates

InvoiceSmart includes 4 professionally designed templates:

- **Modern** - Clean, minimal design with subtle colors
- **Classic** - Traditional invoice layout
- **Classic Blue** - Professional blue-themed template
- **Creative** - Green-accented design with bilingual headers

### Bilingual Invoices

Enable dual-language mode in the invoice form to display labels in two languages side-by-side, perfect for international clients.

### Reports

Access comprehensive analytics including:
- Revenue by period
- Client statistics
- Invoice status breakdown
- Export to CSV or PDF

## Localization

Currently supported languages:
- English
- Romanian

To add a new language:
1. Create a new file in `src/i18n/` (e.g., `fr.js`)
2. Add translations following the existing structure
3. Register it in `src/i18n/index.js`

## Configuration

All settings are managed through the Settings page. No configuration files are needed.

### Exchange Rates

The app can fetch live EUR/RON and USD/RON exchange rates from the **National Bank of Romania (BNR)** API. Simply click the "BNR" button when creating an invoice.

## Data Storage

All data is stored locally in your browser using SQLite (SQL.js). The database includes:

- **Settings** - Company information and preferences
- **Clients** - Client records with full contact and bank details
- **Invoices** - Invoice metadata and line items

**Note**: Data is stored in browser IndexedDB/localStorage. Clear browser data will erase all invoices. Consider exporting reports regularly as backup.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material You design system by Google
- [SQL.js](https://github.com/sql-js/sql.js/) for client-side SQLite
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
- [Vite](https://vitejs.dev/) for blazing fast builds

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/ClaudiuJitea/InvoiceSmart/issues) on GitHub.

---

Made with love by [Claudiu Jitea](https://github.com/ClaudiuJitea)

