// Receipts Page - List and manage receipts
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { settingsService } from '../db/services/settingsService.js';
import { renderReceiptTemplate } from '../templates/receipt.js';
import { toast } from '../components/common/Toast.js';
import { router } from '../router.js';

let receipts = [];
let invoices = [];
let settings = {};

export function renderReceipts() {
    return `
    <div class="page-container" id="receiptsContainer">
        <div class="page-header-row">
            <div class="page-header-left">
                <h1 class="page-title">${t('receipts.title')}</h1>
                <p class="page-subtitle">${t('receipts.subtitle')}</p>
            </div>
        </div>

        <div class="card card-elevated">
            <div class="card-content" style="padding: 0;">
                <div class="loading-spinner" style="padding: 40px; text-align: center;">
                    <div class="spinner"></div>
                    <p style="margin-top: 10px; color: var(--md-on-surface-variant);">${t('general.loading')}</p>
                </div>
            </div>
        </div>
    </div>
    `;
}

export async function initReceipts() {
    const container = document.getElementById('receiptsContainer');
    if (!container) return;

    try {
        // Fetch all receipts
        const [receiptsRes, settingsData] = await Promise.all([
            fetch('/api/receipts'),
            settingsService.get()
        ]);

        if (!receiptsRes.ok) throw new Error('Failed to fetch receipts');
        receipts = await receiptsRes.json();
        settings = settingsData;

        // Fetch invoices for the receipts
        const invoiceIds = [...new Set(receipts.map(r => r.invoice_id))];
        const invoicePromises = invoiceIds.map(id => invoiceService.getById(id));
        const invoiceResults = await Promise.all(invoicePromises);

        // Create a map of invoices by ID
        invoices = {};
        invoiceResults.forEach(inv => {
            if (inv) invoices[inv.id] = inv;
        });

        renderReceiptsList(container);
    } catch (error) {
        console.error('Failed to load receipts:', error);
        container.querySelector('.card-content').innerHTML = `
            <div class="empty-state" style="padding: 40px;">
                <h3>${t('general.error')}</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderReceiptsList(container) {
    const cardContent = container.querySelector('.card-content');

    if (receipts.length === 0) {
        cardContent.innerHTML = `
            <div class="empty-state" style="padding: 60px; text-align: center;">
                ${icons.file}
                <h3 style="margin-top: 20px;">${t('receipts.emptyTitle')}</h3>
                <p style="color: var(--md-on-surface-variant);">${t('receipts.emptyDescription')}</p>
            </div>
        `;
        return;
    }

    cardContent.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>${t('receipts.receiptNumber')}</th>
                        <th>${t('receipts.invoiceNumber')}</th>
                        <th>${t('receipts.client')}</th>
                        <th>${t('receipts.issueDate')}</th>
                        <th>${t('receipts.amount')}</th>
                        <th style="text-align: right;">${t('actions.view')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${receipts.map(receipt => {
        const invoice = invoices[receipt.invoice_id] || {};
        return `
                            <tr>
                                <td>
                                    <span class="receipt-number-badge">${receipt.receipt_number}</span>
                                </td>
                                <td>
                                    <a href="#/invoices/${receipt.invoice_id}/preview" class="link">
                                        ${invoice.invoice_number || '-'}
                                    </a>
                                </td>
                                <td>${invoice.client_name || '-'}</td>
                                <td>${new Date(receipt.issue_date).toLocaleDateString('ro-RO')}</td>
                                <td>
                                    <span class="amount">${receipt.amount.toFixed(2)} ${receipt.currency}</span>
                                </td>
                                <td style="text-align: right;">
                                    <button class="btn btn-tonal btn-sm view-receipt-btn" data-receipt-id="${receipt.id}">
                                        ${icons.eye}
                                        ${t('receipts.viewReceipt')}
                                    </button>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Attach event listeners
    cardContent.querySelectorAll('.view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const receiptId = parseInt(btn.dataset.receiptId);
            const receipt = receipts.find(r => r.id === receiptId);
            if (receipt) {
                viewReceipt(receipt);
            }
        });
    });
}

function viewReceipt(receipt) {
    const invoice = invoices[receipt.invoice_id] || {};
    const receiptHtml = renderReceiptTemplate(receipt, invoice, settings);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Pop-up blocked. Please allow pop-ups.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chitanță ${receipt.receipt_number}</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A5 landscape; margin: 0; }
                body { 
                    margin: 0; 
                    padding: 20px; 
                    font-family: 'Roboto', sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh; 
                    background: #f5f5f5; 
                    box-sizing: border-box;
                }
                .receipt-wrapper {
                    background: white;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
                .print-actions {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    gap: 10px;
                    z-index: 1000;
                }
                .print-actions button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .print-btn {
                    background: linear-gradient(135deg, #1E3A5F 0%, #2A4F7C 100%);
                    color: white;
                }
                .print-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
                }
                .close-btn {
                    background: #e0e0e0;
                    color: #333;
                }
                .close-btn:hover {
                    background: #d0d0d0;
                }
                @media print { 
                    body { 
                        background: white; 
                        display: block; 
                        padding: 0;
                    } 
                    .receipt-wrapper { 
                        box-shadow: none;
                    }
                    .print-actions {
                        display: none;
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="print-actions">
                <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
                <button class="close-btn" onclick="window.close()">✕ Close</button>
            </div>
            <div class="receipt-wrapper">
                ${receiptHtml}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}
