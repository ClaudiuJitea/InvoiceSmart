// Main Application Entry Point
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/custom-select.css';
import './styles/app.css';
import './styles/auth.css';

import { router } from './router.js';
import { i18n } from './i18n/index.js';
import { settingsService } from './db/services/settingsService.js';
import { authService } from './db/services/authService.js';

// Components
import { renderSidebar, initSidebar } from './components/Sidebar.js';

// Pages
import { renderDashboard, initDashboard } from './pages/Dashboard.js';
import { renderClients, initClients } from './pages/Clients.js';
import { renderClientForm, initClientForm } from './pages/ClientForm.js';
import { renderInvoices, initInvoices } from './pages/Invoices.js';
import { renderInvoiceForm, initInvoiceForm } from './pages/InvoiceForm.js';
import { renderInvoicePreview, initInvoicePreview } from './pages/InvoicePreview.js';
import { renderSettings, initSettings } from './pages/Settings.js';
import { renderReports, initReports } from './pages/Reports.js';
import { renderReceipts, initReceipts } from './pages/Receipts.js';
import { renderLogin, initLogin } from './pages/Login.js';
import { renderRegister, initRegister } from './pages/Register.js';
import { renderAdminDashboard, initAdminDashboard } from './pages/AdminDashboard.js';

// App state
let currentPage = null;
let currentParams = {};

// Auth pages (no sidebar)
const authPages = ['login', 'register'];

// Check if current page requires auth
function isAuthPage() {
  return authPages.includes(currentPage);
}

// Render the entire app
function renderApp() {
  const app = document.getElementById('app');

  // Auth pages have different layout (no sidebar)
  if (isAuthPage()) {
    app.innerHTML = `
            <div class="auth-layout">
                ${renderPage()}
            </div>
        `;
    initPage();
    return;
  }

  app.innerHTML = `
        <div class="app-sidebar" id="sidebar">
            ${renderSidebar()}
        </div>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <main class="app-main">
            <div class="app-content" id="content">
                ${renderPage()}
            </div>
        </main>
    `;

  // Initialize sidebar
  initSidebar();

  // Initialize current page
  initPage();

  // Mobile menu handling
  setupMobileMenu();
}

// Render current page based on route
function renderPage() {
  switch (currentPage) {
    case 'login':
      return renderLogin();
    case 'register':
      return renderRegister();
    case 'dashboard':
      return renderDashboard();
    case 'clients':
      return renderClients();
    case 'clientForm':
      return renderClientForm(currentParams);
    case 'invoices':
      return renderInvoices(currentParams);
    case 'invoiceForm':
      return renderInvoiceForm(currentParams);
    case 'invoicePreview':
      return renderInvoicePreview(currentParams);
    case 'settings':
      return renderSettings();
    case 'reports':
      return renderReports();
    case 'receipts':
      return renderReceipts();
    case 'admin':
      return renderAdminDashboard();
    default:
      return renderDashboard();
  }
}

// Initialize current page handlers
function initPage() {
  switch (currentPage) {
    case 'login':
      initLogin();
      break;
    case 'register':
      initRegister();
      break;
    case 'dashboard':
      initDashboard();
      break;
    case 'clients':
      initClients();
      break;
    case 'clientForm':
      initClientForm(currentParams);
      break;
    case 'invoices':
      initInvoices(currentParams);
      break;
    case 'invoiceForm':
      initInvoiceForm(currentParams);
      break;
    case 'invoicePreview':
      initInvoicePreview(currentParams);
      break;
    case 'settings':
      initSettings();
      break;
    case 'reports':
      initReports();
      break;
    case 'receipts':
      initReceipts();
      break;
    case 'admin':
      initAdminDashboard();
      break;
  }
}

// Setup mobile menu
function setupMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!sidebar || !overlay) return;

  // Create mobile menu button if not exists
  let menuBtn = document.querySelector('.mobile-menu-btn');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.className = 'btn btn-fab mobile-menu-btn';
    menuBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    document.body.appendChild(menuBtn);
  }

  menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // Close sidebar on navigation (mobile)
  sidebar.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  });
}

// Setup routes
function setupRoutes() {
  router
    .on('/', () => {
      // Check auth before showing dashboard
      if (!authService.isLoggedIn()) {
        router.navigate('/login');
        return;
      }
      currentPage = 'dashboard';
      currentParams = {};
      renderApp();
    })
    .on('/login', () => {
      // Redirect to dashboard if already logged in
      if (authService.isLoggedIn()) {
        router.navigate('/');
        return;
      }
      currentPage = 'login';
      currentParams = {};
      renderApp();
    })
    .on('/register', () => {
      // Redirect to dashboard if already logged in
      if (authService.isLoggedIn()) {
        router.navigate('/');
        return;
      }
      currentPage = 'register';
      currentParams = {};
      renderApp();
    })
    .on('/clients', () => {
      currentPage = 'clients';
      currentParams = {};
      renderApp();
    })
    .on('/clients/new', () => {
      currentPage = 'clientForm';
      currentParams = { id: 'new' };
      renderApp();
    })
    .on('/clients/:id', (params) => {
      currentPage = 'clientForm';
      currentParams = params;
      renderApp();
    })
    .on('/invoices', () => {
      currentPage = 'invoices';
      currentParams = { document_type: 'invoice' };
      renderApp();
    })
    .on('/invoices/new', () => {
      currentPage = 'invoiceForm';
      currentParams = { id: 'new', document_type: 'invoice' };
      renderApp();
    })
    .on('/invoices/new/from-delivery-notes/:deliveryNoteIds', (params) => {
      currentPage = 'invoiceForm';
      currentParams = {
        id: 'new',
        document_type: 'invoice',
        from_delivery_notes: params.deliveryNoteIds,
      };
      renderApp();
    })
    .on('/invoices/:id', (params) => {
      currentPage = 'invoiceForm';
      currentParams = { ...params, document_type: 'invoice' };
      renderApp();
    })
    .on('/invoices/:id/preview', (params) => {
      currentPage = 'invoicePreview';
      currentParams = { ...params, document_type: 'invoice' };
      renderApp();
    })
    .on('/delivery-notes', () => {
      currentPage = 'invoices';
      currentParams = { document_type: 'delivery_note' };
      renderApp();
    })
    .on('/delivery-notes/new', () => {
      currentPage = 'invoiceForm';
      currentParams = { id: 'new', document_type: 'delivery_note' };
      renderApp();
    })
    .on('/delivery-notes/:id', (params) => {
      currentPage = 'invoiceForm';
      currentParams = { ...params, document_type: 'delivery_note' };
      renderApp();
    })
    .on('/delivery-notes/:id/preview', (params) => {
      currentPage = 'invoicePreview';
      currentParams = { ...params, document_type: 'delivery_note' };
      renderApp();
    })
    .on('/settings', () => {
      currentPage = 'settings';
      currentParams = {};
      renderApp();
    })
    .on('/reports', () => {
      currentPage = 'reports';
      currentParams = {};
      renderApp();
    })
    .on('/receipts', () => {
      currentPage = 'receipts';
      currentParams = {};
      renderApp();
    })
    .on('/admin', () => {
      // Redirect to login if not logged in
      if (!authService.isLoggedIn()) {
        router.navigate('/login');
        return;
      }
      // Redirect to dashboard if not admin
      if (!authService.isAdmin()) {
        router.navigate('/');
        return;
      }
      currentPage = 'admin';
      currentParams = {};
      renderApp();
    });
}

// App refresh handler (for language changes, etc.)
window.addEventListener('app:refresh', () => {
  renderApp();
});

// Auth event handlers
window.addEventListener('auth:login', () => {
  renderApp();
});

window.addEventListener('auth:logout', () => {
  renderApp();
});

// Initialize app
async function init() {
  try {
    // Show loading state
    document.getElementById('app').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Inter, sans-serif;">
                <div style="text-align: center;">
                    <div style="width: 48px; height: 48px; border: 3px solid #E8ECF0; border-top-color: #1E3A5F; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                    <p style="color: #5A6169; font-weight: 500;">Loading...</p>
                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
        `;

    // Validate token if exists
    if (authService.isLoggedIn()) {
      try {
        await authService.validateToken();
      } catch (error) {
        console.log('Token validation failed, user logged out');
      }
    }

    // Load language from settings
    try {
      const settings = await settingsService.get();
      if (settings && settings.language) {
        i18n.locale = settings.language;
      }
    } catch (error) {
      console.log('Could not load settings, using default language');
    }

    // Initialize sidebar state
    const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    }

    // Setup routes
    setupRoutes();

    // Initial render based on current hash
    router.handleRoute();

  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('app').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Inter, sans-serif;">
                <div style="text-align: center; padding: 20px;">
                    <h2 style="color: #D32F2F; margin-bottom: 16px; font-family: Playfair Display, Georgia, serif;">Failed to load application</h2>
                    <p style="color: #5A6169; margin-bottom: 16px;">${error.message}</p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: linear-gradient(135deg, #1E3A5F 0%, #2A4F7C 100%); color: white; border: none; border-radius: 9999px; cursor: pointer; font-family: Inter, sans-serif; font-weight: 500; box-shadow: 0 2px 8px rgba(30, 58, 95, 0.2);">
                        Retry
                    </button>
                </div>
            </div>
        `;
  }
}

// Start the app
init();
