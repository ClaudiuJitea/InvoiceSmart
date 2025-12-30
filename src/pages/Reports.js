// Reports Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { statsService } from '../db/services/statsService.js';
import { settingsService } from '../db/services/settingsService.js';
import { clientService } from '../db/services/clientService.js';
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
           <button class="btn btn-tonal btn-sm" id="exportPdfBtn">
             ${icons.download} ${t('actions.export')} PDF
           </button>
        </div>
      </div>

       <!-- Filters Bar -->
      <div class="card card-outlined filters-bar-modern">
        <div class="filters-container">
            <div class="filter-item">
                <label class="filter-label-text">${t('reports.startDate')}</label>
                <div class="input-modern-wrapper">
                    <input type="date" class="input-modern" id="filterStartDate">
                </div>
            </div>
            
            <div class="filter-item">
                <label class="filter-label-text">${t('reports.endDate')}</label>
                <div class="input-modern-wrapper">
                    <input type="date" class="input-modern" id="filterEndDate">
                </div>
            </div>

            <div class="filter-item">
                <label class="filter-label-text">${t('invoices.currency')}</label>
                <div class="select-modern-wrapper">
                    <select class="input-modern select-modern" id="filterCurrency">
                        <option value="EUR">EUR</option>
                        <option value="RON">RON</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
            </div>
            
            <div class="filter-item filter-item-grow">
                <label class="filter-label-text">${t('invoices.client')}</label>
                <div class="select-modern-wrapper">
                    <select class="input-modern select-modern" id="filterClient">
                        <option value="">${t('reports.allClients')}</option>
                    </select>
                </div>
            </div>

            <div class="filter-actions-modern">
                <button class="btn btn-filled" id="applyFiltersBtn">
                    ${icons.search} ${t('actions.apply')}
                </button>
                <button class="btn btn-text" id="clearFiltersBtn">
                    ${t('actions.clear')}
                </button>
                <div class="filter-divider"></div>
                <button class="btn btn-tonal" id="exportExcelBtn">
                    ${icons.download} ${t('actions.exportExcel')}
                </button>
            </div>
        </div>
      </div>

      <div id="reportContent">
          <!-- Overview Stats -->
          <div id="overview-stats" class="stats-grid">
             <div class="stat-card card-elevated loading-skeleton"></div>
             <div class="stat-card card-elevated loading-skeleton"></div>
             <div class="stat-card card-elevated loading-skeleton"></div>
          </div>
    
          <div class="reports-grid">
            <!-- Revenue Chart -->
            <div class="card card-elevated report-card-large">
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
            <div class="card card-elevated report-card-small">
              <div class="card-header">
                <h2 class="card-title">${t('reports.statusDistribution')}</h2>
              </div>
              <div class="card-content">
                 <div class="chart-container" style="position: relative; height: 350px;">
                  <canvas id="statusChart"></canvas>
                </div>
              </div>
            </div>
    
            <!-- Top Clients -->
            <div class="card card-elevated report-card-full">
              <div class="card-header">
                <h2 class="card-title">${t('reports.topClients')}</h2>
              </div>
              <div class="card-content" id="topClientsTable">
                 <div class="loading-spinner"></div>
              </div>
            </div>
          </div>
      </div>
    </div>
    
    <!-- Hidden element for professional PDF Export -->
    <div id="pdfExportTemplate" style="position: fixed; left: -9999px; width: 800px; background: white; color: #1a1a1b; font-family: 'Inter', system-ui, sans-serif; padding: 40px;">
        <!-- JS will populate this -->
    </div>
  `;
}

export async function initReports() {
    try {
        await loadChartJs();
        const settings = settingsService.get();
        currentFilters.currency = settings?.default_currency || 'EUR';

        const currencySelect = document.getElementById('filterCurrency');
        if (currencySelect) currencySelect.value = currentFilters.currency;

        const clients = clientService.getAll();
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

function clearFilters() {
    const settings = settingsService.get();

    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterClient').value = '';
    document.getElementById('filterCurrency').value = settings?.default_currency || 'EUR';

    currentFilters = {
        startDate: null,
        endDate: null,
        clientId: null,
        currency: settings?.default_currency || 'EUR'
    };

    loadData();
}

async function loadData() {
    latestData.monthlyRevenue = statsService.getMonthlyRevenue({ ...currentFilters });
    latestData.statusDist = statsService.getStatusDistribution({ ...currentFilters });
    latestData.topClients = statsService.getTopClients(5, { ...currentFilters });
    latestData.overview = statsService.getOverview({ ...currentFilters });

    renderOverview(latestData.overview, currentFilters.currency);
    renderRevenueChart(latestData.monthlyRevenue, currentFilters.currency);
    renderStatusChart(latestData.statusDist);
    renderTopClients(latestData.topClients, currentFilters.currency);
}

function renderOverview(data, currency) {
    const container = document.getElementById('overview-stats');
    if (!container) return;

    const stats = [
        { label: t('reports.totalRevenue'), value: data.totalRevenue, color: 'primary', icon: icons.money },
        { label: t('reports.outstanding'), value: data.outstanding, color: 'warning', icon: icons.clock },
        { label: t('reports.overdue'), value: data.overdue, color: 'error', icon: icons.trash }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="stat-card card-elevated">
            <div class="stat-icon stat-icon-${stat.color}">${stat.icon}</div>
            <div class="stat-content">
              <div class="stat-label">${stat.label}</div>
              <div class="stat-value">${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</div>
            </div>
        </div>
    `).join('');
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
                borderColor: '#6750A4',
                backgroundColor: 'rgba(103, 80, 164, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#6750A4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (c) => `${c.parsed.y.toLocaleString()} ${currency}`
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderStatusChart(data) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    if (charts.status) charts.status.destroy();

    const colors = { draft: '#9CA3AF', sent: '#6750A4', paid: '#22C55E', overdue: '#EF4444', cancelled: '#F59E0B' };
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
                borderWidth: 4,
                borderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            }
        }
    });
}

function renderTopClients(clients, currency) {
    const container = document.getElementById('topClientsTable');
    if (!container) return;

    if (clients.length === 0) {
        container.innerHTML = `<p class="empty-results">${t('general.noResults')}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="table-container-modern">
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
                                <div class="client-cell">
                                    <div class="client-avatar">${client.name.charAt(0)}</div>
                                    <span class="font-medium">${client.name}</span>
                                </div>
                            </td>
                            <td class="text-center"><span class="chip chip-tonal">${client.invoice_count}</span></td>
                            <td class="text-right"><span class="revenue-value">${client.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</span></td>
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
        btn.innerHTML = `<span class="spinner-sm"></span> Loading...`;

        const XLSX = await loadSheetJs();
        const settings = settingsService.get();
        const invoices = statsService.getForExport(currentFilters);

        if (!invoices || invoices.length === 0) {
            alert(t('general.noResults'));
            btn.disabled = false;
            btn.innerHTML = `${icons.download} ${t('actions.exportExcel')}`;
            return;
        }

        // Styles
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "6750A4" } },
            alignment: { horizontal: "center" },
            border: {
                top: { style: "thin" }, bottom: { style: "thin" },
                left: { style: "thin" }, right: { style: "thin" }
            }
        };

        const titleStyle = {
            font: { bold: true, sz: 14, color: { rgb: "6750A4" } }
        };

        const cellStyle = {
            border: {
                top: { style: "thin", color: { rgb: "EEEEEE" } },
                bottom: { style: "thin", color: { rgb: "EEEEEE" } }
            }
        };

        // 1. Summary Worksheet
        const summaryWs = XLSX.utils.aoa_to_sheet([
            [{ v: "BUSINESS REPORT OVERVIEW", s: titleStyle }],
            [""],
            [{ v: "Company", s: { font: { bold: true } } }, settings.company_name],
            [{ v: "Date", s: { font: { bold: true } } }, new Date().toLocaleString()],
            [{ v: "Currency", s: { font: { bold: true } } }, currentFilters.currency],
            [""],
            [
                { v: "Metric", s: headerStyle },
                { v: "Value", s: headerStyle }
            ],
            [
                { v: "Total Revenue (Paid)", s: cellStyle },
                { v: latestData.overview.totalRevenue, t: 'n', s: cellStyle }
            ],
            [
                { v: "Outstanding Amount", s: cellStyle },
                { v: latestData.overview.outstanding, t: 'n', s: cellStyle }
            ],
            [
                { v: "Overdue Amount", s: cellStyle },
                { v: latestData.overview.overdue, t: 'n', s: cellStyle }
            ],
            [""],
            [{ v: "TOP CLIENTS", s: titleStyle }],
            [
                { v: "Client Name", s: headerStyle },
                { v: "Invoices", s: headerStyle },
                { v: "Revenue", s: headerStyle }
            ]
        ]);

        // Add Top Clients rows
        let rowIdx = 13; // Starting index after headers
        latestData.topClients.forEach(c => {
            XLSX.utils.sheet_add_aoa(summaryWs, [[
                { v: c.name, s: cellStyle },
                { v: c.invoice_count, t: 'n', s: cellStyle },
                { v: c.total_revenue, t: 'n', s: cellStyle }
            ]], { origin: `A${rowIdx}` });
            rowIdx++;
        });

        summaryWs['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 20 }];

        // 2. Detailed Invoices Worksheet
        const detailHeaders = [
            { v: 'Invoice #', s: headerStyle },
            { v: 'Issue Date', s: headerStyle },
            { v: 'Due Date', s: headerStyle },
            { v: 'Client Name', s: headerStyle },
            { v: 'Status', s: headerStyle },
            { v: 'Tax Amount', s: headerStyle },
            { v: 'Total Amount', s: headerStyle },
            { v: 'Currency', s: headerStyle }
        ];

        const detailData = invoices.map(inv => [
            { v: inv.invoice_number, s: cellStyle },
            { v: inv.issue_date, s: cellStyle },
            { v: inv.due_date, s: cellStyle },
            { v: inv.client_name, s: cellStyle },
            { v: inv.status.toUpperCase(), s: { ...cellStyle, font: { color: { rgb: inv.status === 'paid' ? "22C55E" : (inv.status === 'overdue' ? "EF4444" : "000000") } } } },
            { v: inv.tax_amount, t: 'n', s: cellStyle },
            { v: inv.total, t: 'n', s: { ...cellStyle, font: { bold: true } } },
            { v: inv.currency, s: cellStyle }
        ]);

        const invoicesWs = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);
        invoicesWs['!cols'] = [
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 8 }
        ];

        // Create Workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
        XLSX.utils.book_append_sheet(wb, invoicesWs, "Invoices");

        // Download
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
    const settings = settingsService.get();
    const rawData = statsService.getForExport(currentFilters);

    if (!rawData || rawData.length === 0) {
        alert(t('general.noResults'));
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-sm"></span> Generating...`;

        // Build a gorgeous document layout
        template.innerHTML = `
            <div style="border-bottom: 3px solid #6750A4; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="margin: 0; color: #6750A4; font-size: 28px;">INVOICE REPORT</h1>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">${settings.company_name}</p>
                </div>
                <div style="text-align: right; font-size: 12px; color: #888;">
                    <p style="margin: 0;">Period: ${currentFilters.startDate || 'All Time'} - ${currentFilters.endDate || 'Present'}</p>
                    <p style="margin: 0;">Currency: ${currentFilters.currency}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Total Revenue (Paid)</p>
                    <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #22C55E;">${latestData.overview.totalRevenue.toLocaleString()} ${currentFilters.currency}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Outstanding</p>
                    <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #F59E0B;">${latestData.overview.outstanding.toLocaleString()} ${currentFilters.currency}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Overdue</p>
                    <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #EF4444;">${latestData.overview.overdue.toLocaleString()} ${currentFilters.currency}</p>
                </div>
            </div>

            <h3 style="font-size: 14px; margin-bottom: 15px; border-left: 4px solid #6750A4; padding-left: 10px;">DETAILED INVOICE LIST</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #6750A4; color: white; text-align: left;">
                        <th style="padding: 10px;">Date</th>
                        <th style="padding: 10px;">Invoice #</th>
                        <th style="padding: 10px;">Client</th>
                        <th style="padding: 10px;">Status</th>
                        <th style="padding: 10px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rawData.map((row, idx) => `
                        <tr style="border-bottom: 1px solid #eee; background: ${idx % 2 === 0 ? '#fff' : '#fafafa'}">
                            <td style="padding: 8px 10px;">${row.issue_date}</td>
                            <td style="padding: 8px 10px; font-weight: 600;">${row.invoice_number}</td>
                            <td style="padding: 8px 10px;">${row.client_name}</td>
                            <td style="padding: 8px 10px;"><span style="color: ${row.status === 'paid' ? '#22C55E' : (row.status === 'overdue' ? '#EF4444' : '#666')}">${row.status.toUpperCase()}</span></td>
                            <td style="padding: 8px 10px; text-align: right; font-weight: 600;">${row.total.toLocaleString()} ${row.currency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px dashed #eee; padding-top: 20px;">
                Generated by ${settings.company_name || 'Invoice Manager'} on ${new Date().toLocaleString()}
            </div>
        `;

        // Small delay to ensure styles apply
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(template, {
            scale: 3, // High quality
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Full_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (e) {
        console.error("PDF Export failed", e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `${icons.download} ${t('actions.export')} PDF`;
    }
}

const style = document.createElement('style');
style.textContent = `
    .filters-bar-modern { margin-bottom: var(--space-8); padding: var(--space-6); background: var(--md-surface-container-low); }
    .filters-container { display: flex; flex-wrap: wrap; gap: var(--space-6); align-items: flex-end; }
    .filter-item { display: flex; flex-direction: column; gap: var(--space-2); min-width: 150px; }
    .filter-item-grow { flex: 1; min-width: 200px; }
    .filter-label-text { font-size: var(--text-label-md); font-weight: 500; color: var(--md-on-surface-variant); }
    .input-modern { width: 100%; height: 48px; padding: 0 var(--space-4); border: 1px solid var(--md-outline-variant); border-radius: var(--radius-md); background: var(--md-surface-container-lowest); outline: none; }
    .select-modern { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2349454F' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
    .filter-actions-modern { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
    .filter-divider { width: 1px; height: 32px; background: var(--md-outline-variant); margin: 0 var(--space-2); }
    .reports-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: var(--space-6); margin-top: var(--space-6); }
    .report-card-full { grid-column: 1 / -1; }
    .client-cell { display: flex; align-items: center; gap: var(--space-3); }
    .client-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--md-secondary-container); color: var(--md-on-secondary-container); display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1100px) { .reports-grid { grid-template-columns: 1fr; } }
`;
document.head.appendChild(style);
