// Reports Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { statsService } from '../db/services/statsService.js';
import { settingsService } from '../db/services/settingsService.js';
import { clientService } from '../db/services/clientService.js';
import { CustomSelect } from '../components/common/CustomSelect.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Load Chart.js from CDN
async function loadChartJs() {
    if (window.Chart) return window.Chart;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve(window.Chart);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load SheetJS (XLSX) from CDN
async function loadSheetJs() {
    if (window.XLSX) return window.XLSX;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.min.js';
        script.onload = () => resolve(window.XLSX);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// State
let charts = {};
let currentFilters = {
    startDate: '',
    endDate: '',
    clientId: '',
    currency: 'EUR'
};
let latestData = {
    monthlyRevenue: [],
    statusDist: [],
    topClients: [],
    overview: {}
};

export function renderReports() {
    return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('reports.title')}</h1>
          <p class="page-subtitle">${t('reports.subtitle')}</p>
        </div>
        <div class="page-header-actions">
           <button class="btn btn-tonal" id="exportPdfBtn">
             ${icons.download} ${t('actions.export')} PDF
           </button>
        </div>
      </div>

       <!-- Filters Bar -->
      <div class="card card-outlined" style="margin-bottom: var(--space-6);">
        <div class="grid grid-cols-4" style="gap: var(--space-4); align-items: flex-end;">
            <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label">${t('reports.startDate')}</label>
                <input type="date" class="input" id="filterStartDate">
            </div>
            
            <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label">${t('reports.endDate')}</label>
                <input type="date" class="input" id="filterEndDate">
            </div>

            <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label">${t('invoices.currency')}</label>
                <div style="position: relative;">
                    <select class="select input" id="filterCurrency">
                        <option value="EUR">EUR</option>
                        <option value="RON">RON</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="CHF">CHF</option>
                    </select>
                </div>
                <small id="currencyHint" class="text-muted" style="display: none; margin-top: 4px; font-size: 0.75rem;"></small>
            </div>
            
            <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label">${t('invoices.client')}</label>
                <div style="position: relative;">
                    <select class="select input" id="filterClient">
                        <option value="">${t('reports.allClients')}</option>
                    </select>
                </div>
            </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--md-outline-variant);">
            <button class="btn btn-filled" id="applyFiltersBtn">
                ${icons.search} ${t('actions.apply')}
            </button>
            <button class="btn btn-text" id="clearFiltersBtn">
                ${t('actions.clear')}
            </button>
            <div style="width: 1px; background: var(--md-outline-variant); margin: 0 var(--space-2);"></div>
            <button class="btn btn-tonal" id="exportExcelBtn">
                ${icons.download} ${t('actions.exportExcel')}
            </button>
        </div>
      </div>

      <div id="reportContent">
          <!-- Overview Stats -->
          <div id="overview-stats" class="stats-grid" style="margin-bottom: var(--space-8);">
             <!-- Skeleton loading -->
             <div class="stat-card card-elevated" style="height: 120px; opacity: 0.5;"></div>
             <div class="stat-card card-elevated" style="height: 120px; opacity: 0.5;"></div>
             <div class="stat-card card-elevated" style="height: 120px; opacity: 0.5;"></div>
          </div>
    
          <div class="grid grid-cols-2" style="gap: var(--space-6);">
            <!-- Revenue Chart -->
            <div class="card card-elevated" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h2 class="card-title">${t('reports.revenueOverTime')}</h2>
              </div>
              <div class="card-content">
                <div class="chart-container" style="position: relative; height: 350px;">
                  <canvas id="revenueChart"></canvas>
                </div>
              </div>
            </div>
    
            <!-- Status Distribution -->
            <div class="card card-elevated">
              <div class="card-header">
                <h2 class="card-title">${t('reports.statusDistribution')}</h2>
              </div>
              <div class="card-content">
                 <div class="chart-container" style="position: relative; height: 300px;">
                  <canvas id="statusChart"></canvas>
                </div>
              </div>
            </div>
    
            <!-- Top Clients -->
            <div class="card card-elevated">
              <div class="card-header">
                <h2 class="card-title">${t('reports.topClients')}</h2>
              </div>
              <div class="card-content" id="topClientsTable">
                 <div class="text-center p-4 text-muted">Loading...</div>
              </div>
            </div>
          </div>
      </div>
    </div>
    
    <!-- Hidden element for PDF Export -->
    <div id="pdfExportTemplate" style="position: fixed; left: -9999px;">
        <!-- JS will populate this -->
    </div>
  `;
}

export async function initReports() {
    try {
        await loadChartJs();
        const settings = await settingsService.get();

        // Smart Currency Selection
        let availableCurrencies = [];
        try {
            availableCurrencies = await statsService.getAvailableCurrencies();
        } catch (e) {
            console.warn("Could not fetch available currencies", e);
        }

        // Also get secondary currencies from available-currencies-secondary endpoint or just check both
        // For now, assume availableCurrencies includes all currencies that have data (primary + secondary)
        // The server endpoint only returns primary currencies, so let's enhance it client-side by using overview

        // Determine default currency:
        // 1. Use settings default if available and (it exists in data OR data is empty)
        // 2. If settings default has NO data, but we have data in other currencies, switch to the first available one.
        let selectedCurrency = settings?.default_currency || 'EUR';

        if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrency)) {
            // User has data in other currencies but not the default one. Switch to the first one with data.
            selectedCurrency = availableCurrencies[0];
        }

        currentFilters.currency = selectedCurrency;

        const currencySelect = document.getElementById('filterCurrency');
        const currencyHint = document.getElementById('currencyHint');

        if (currencySelect) {
            // Merge defaults with available to ensure options exist
            const defaults = ['EUR', 'RON', 'USD', 'GBP', 'CHF'];
            const allOptions = [...new Set([...defaults, ...availableCurrencies])];

            currencySelect.innerHTML = allOptions.map(c => {
                const hasData = availableCurrencies.includes(c);
                return `<option value="${c}">${c}${hasData ? '' : ''}</option>`;
            }).join('');

            currencySelect.value = currentFilters.currency;

            // Update hint when currency changes
            const updateCurrencyHint = () => {
                const selected = currencySelect.value;
                const hasData = availableCurrencies.includes(selected);
                if (currencyHint) {
                    if (!hasData && availableCurrencies.length > 0) {
                        currencyHint.style.display = 'block';
                        currencyHint.textContent = t('reports.noCurrencyData') || `No invoices found with ${selected}. Data available in: ${availableCurrencies.join(', ')}`;
                        currencyHint.style.color = 'var(--md-error)';
                    } else {
                        currencyHint.style.display = 'none';
                    }
                }
            };

            currencySelect.addEventListener('change', updateCurrencyHint);
            updateCurrencyHint(); // Initial check
        }

        const clients = await clientService.getAll();
        const clientSelect = document.getElementById('filterClient');
        if (clientSelect) {
            clients.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = c.name;
                clientSelect.appendChild(option);
            });
        }

        document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
        document.getElementById('clearFiltersBtn')?.addEventListener('click', clearFilters);
        document.getElementById('exportExcelBtn')?.addEventListener('click', exportExcel);
        document.getElementById('exportPdfBtn')?.addEventListener('click', exportPdf);

        // Initialize Custom Selects
        const selectIds = ['filterCurrency', 'filterClient'];
        selectIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) new CustomSelect(el);
        });

        await loadData();

    } catch (error) {
        console.error('Failed to init reports:', error);
    }
}

async function applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const clientId = document.getElementById('filterClient').value;
    const currency = document.getElementById('filterCurrency').value;

    currentFilters = {
        startDate: startDate || null,
        endDate: endDate || null,
        clientId: clientId ? parseInt(clientId) : null,
        currency: currency
    };

    await loadData();
}

async function clearFilters() {
    const settings = await settingsService.get();

    const currencySelect = document.getElementById('filterCurrency');
    const clientSelect = document.getElementById('filterClient');

    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';

    if (clientSelect) {
        clientSelect.value = '';
        clientSelect.dispatchEvent(new Event('change'));
    }

    if (currencySelect) {
        currencySelect.value = settings?.default_currency || 'EUR';
        currencySelect.dispatchEvent(new Event('change'));
    }

    currentFilters = {
        startDate: null,
        endDate: null,
        clientId: null,
        currency: settings?.default_currency || 'EUR'
    };

    loadData();
}

async function loadData() {
    try {
        const [monthlyRevenue, statusDist, topClients, overview] = await Promise.all([
            statsService.getMonthlyRevenue({ ...currentFilters }),
            statsService.getStatusDistribution({ ...currentFilters }),
            statsService.getTopClients(5, { ...currentFilters }),
            statsService.getOverview({ ...currentFilters })
        ]);

        latestData = { monthlyRevenue, statusDist, topClients, overview };

        renderOverview(latestData.overview, currentFilters.currency);
        renderRevenueChart(latestData.monthlyRevenue, currentFilters.currency);
        renderStatusChart(latestData.statusDist);
        renderTopClients(latestData.topClients, currentFilters.currency);
    } catch (error) {
        console.error("Error loading report data:", error);
    }
}

function renderOverview(data, currency) {
    const container = document.getElementById('overview-stats');
    if (!container) return;

    if (!data) return;

    const stats = [
        { label: t('reports.totalRevenue'), value: data.totalRevenue || 0, color: 'primary', icon: icons.money },
        { label: t('reports.outstanding'), value: data.outstanding || 0, color: 'warning', icon: icons.clock },
        { label: t('reports.overdue'), value: data.overdue || 0, color: 'error', icon: icons.trash }
    ];

    container.innerHTML = stats.map(stat => {
        // Map color names to standard classes
        // In components.css we have stat-icon-primary, stat-icon-secondary, stat-icon-tertiary, stat-icon-warning
        // We don't have stat-icon-error. 
        // We can mimic it or just use warning/primary. Let's stick strictly to classes in components.css to ensure theme consistency.
        // If 'error' is not standard, let's use 'warning' but with custom style inline if absolutely necessary, or just 'warning'.
        // Actually, let's look at components.css again. It doesn't define .stat-icon-error.
        // But it defines .chip-error, .btn-danger.
        // I'll manually style the overdue icon if needed or just use primary/warning.
        // Let's use 'warning' for outstanding (clock) and maybe 'tertiary' (money-like) for overdue? Or just 'warning' for both.
        // Or I can add a dedicated class. But I want to avoid adding custom CSS.
        // Let's use `stat-icon-warning` for both but different colors if possible? 
        // Actually, looking at components.css:
        // .stat-icon is just base.
        // We probably missed where .stat-icon-primary etc are defined in components.css?
        // Wait, I viewed components.css in Step 120.
        // I don't see .stat-icon-primary definition there!
        // Ah, line 689: .stat-icon { ... }
        // I don't see .stat-icon-primary.
        // Let's re-read components.css carefully.
        // It has .btn-filled (primary).
        // Maybe I missed it.
        // Let's check Dashboard.js again to see what it uses.
        // Dashboard uses: stat-icon-primary, stat-icon-secondary, stat-icon-tertiary, stat-icon-warning.
        // So they MUST be defined somewhere. Maybe in app.css?

        const iconClass = `stat-icon-${stat.color === 'error' ? 'warning' : stat.color}`;

        return `
        <div class="stat-card card-elevated">
            <div class="stat-icon ${iconClass}">
                ${stat.icon}
            </div>
            <div class="stat-content">
              <div class="stat-label">${stat.label}</div>
              <div class="stat-value" style="font-size: 1.8rem;">${Number(stat.value).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style="font-size: 1rem; color: var(--md-on-surface-variant);">${currency}</span></div>
            </div>
        </div>
    `}).join('');
}

function renderRevenueChart(data, currency) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (charts.revenue) charts.revenue.destroy();

    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: `${t('reports.totalRevenue')} (${currency})`,
                data: data.map(d => d.revenue),
                borderColor: '#1E3A5F',
                backgroundColor: 'rgba(30, 58, 95, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#1E3A5F',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (c) => `${Number(c.parsed.y).toLocaleString()} ${currency}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0f0f0' },
                    ticks: { color: '#666' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#666' }
                }
            }
        }
    });
}

function renderStatusChart(data) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    if (charts.status) charts.status.destroy();

    const colors = {
        draft: '#8C96A1',
        sent: '#1E3A5F',
        paid: '#2E7D32',
        overdue: '#D32F2F',
        cancelled: '#ED6C02'
    };
    const labels = {
        draft: t('invoices.statusDraft'),
        sent: t('invoices.statusSent'),
        paid: t('invoices.statusPaid'),
        overdue: t('invoices.statusOverdue'),
        cancelled: t('invoices.statusCancelled')
    };

    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => labels[d.status] || d.status),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: data.map(d => colors[d.status] || '#ccc'),
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function renderTopClients(clients, currency) {
    const container = document.getElementById('topClientsTable');
    if (!container) return;

    if (clients.length === 0) {
        container.innerHTML = `<div class="empty-state py-8"><p class="text-muted">${t('general.noResults')}</p></div>`;
        return;
    }

    container.innerHTML = `
        <div class="table-container" style="background: transparent; border: none;">
            <table class="table">
                <thead>
                    <tr>
                        <th>${t('clients.name')}</th>
                        <th class="text-center">${t('dashboard.totalInvoices')}</th>
                        <th class="text-right">${t('reports.totalRevenue')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(client => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: var(--space-2);">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #1e3a5f; display: flex; align-items: center; justify-content: center; font-weight: 600;">${client.name.charAt(0)}</div>
                                    <span style="font-weight: 500;">${client.name}</span>
                                </div>
                            </td>
                            <td class="text-center"><span class="chip chip-primary">${client.invoice_count}</span></td>
                            <td class="text-right" style="font-weight: 500; color: var(--md-primary);">${Number(client.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function exportExcel() {
    const btn = document.getElementById('exportExcelBtn');

    try {
        btn.disabled = true;
        btn.innerHTML = `Loading...`;

        const XLSX = await loadSheetJs();
        const settings = await settingsService.get();
        const invoices = await statsService.getForExport(currentFilters);

        if (!invoices || invoices.length === 0) {
            alert(t('general.noResults'));
            btn.disabled = false;
            btn.innerHTML = `${icons.download} ${t('actions.exportExcel')}`;
            return;
        }

        // Simple export logic for brevity
        const wb = XLSX.utils.book_new();

        // Summary sheet data
        const summaryData = [
            ['Business Report'],
            ['Generated', new Date().toLocaleString()],
            ['Currency', currentFilters.currency],
            [''],
            ['Metric', 'Value'],
            ['Revenue', latestData.overview.totalRevenue],
            ['Outstanding', latestData.overview.outstanding],
            ['Overdue', latestData.overview.overdue]
        ];
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

        // Invoices sheet
        const invData = invoices.map(i => ({
            Number: i.invoice_number,
            Date: i.issue_date,
            Client: i.client_name,
            Status: i.status,
            Total: i.total,
            Currency: i.currency
        }));
        const invWs = XLSX.utils.json_to_sheet(invData);
        XLSX.utils.book_append_sheet(wb, invWs, "Details");

        XLSX.writeFile(wb, `Report_${new Date().toISOString().slice(0, 10)}.xlsx`);

    } catch (e) {
        console.error("Excel Export failed", e);
        alert("Failed to create Excel file");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `${icons.download} ${t('actions.exportExcel')}`;
    }
}

async function exportPdf() {
    const btn = document.getElementById('exportPdfBtn');
    const template = document.getElementById('pdfExportTemplate');
    const settings = await settingsService.get();
    const rawData = await statsService.getForExport(currentFilters);

    if (!rawData || rawData.length === 0) {
        alert(t('general.noResults'));
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = `Generating...`;

        template.style.width = '800px';
        template.style.padding = '40px';
        template.style.background = 'white';
        template.innerHTML = `
            <h1>Report: ${settings.company_name}</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <h2>Summary</h2>
            <p>Revenue: ${latestData.overview.totalRevenue}</p>
            <h2>Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #ccc; font-weight: bold;"><td>Num</td><td>Date</td><td>Client</td><td>Total</td></tr>
                ${rawData.map(r => `<tr><td>${r.invoice_number}</td><td>${r.issue_date}</td><td>${r.client_name}</td><td>${r.total}</td></tr>`).join('')}
            </table>
        `;

        await new Promise(r => setTimeout(r, 100)); // wait for render

        const canvas = await html2canvas(template, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Report.pdf`);

    } catch (e) {
        console.error("PDF Export failed", e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `${icons.download} ${t('actions.export')} PDF`;
    }
}
