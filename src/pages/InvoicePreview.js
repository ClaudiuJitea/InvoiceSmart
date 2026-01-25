// Invoice Preview Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { settingsService } from '../db/services/settingsService.js';
import { renderTemplate } from '../templates/index.js';
import { renderReceiptTemplate } from '../templates/receipt.js';
import { exportToPdf } from '../services/pdfService.js';
import { toast } from '../components/common/Toast.js';
import { router } from '../router.js';

let currentTemplate = null;

export function renderInvoicePreview(params = {}) {
  return `
    <div class="page-container" id="previewContainer">
      <div class="card card-elevated" style="padding: 40px; text-align: center;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 10px; color: var(--md-on-surface-variant);">Loading preview...</p>
      </div>
    </div>
  `;
}

export async function initInvoicePreview(params = {}) {
  const container = document.getElementById('previewContainer');
  if (!container) return;

  try {
    const [invoice, settingsResponse] = await Promise.all([
      invoiceService.getById(parseInt(params.id)),
      settingsService.get()
    ]);

    // Fetch existing receipts if any
    let receipts = [];
    try {
      const res = await fetch(`/api/receipts/invoice/${params.id}`);
      if (res.ok) receipts = await res.json();
    } catch (e) { console.error("Failed to fetch receipts", e); }

    const latestReceipt = receipts.length > 0 ? receipts[0] : null;

    if (!invoice) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>${t('general.error')}</h3>
          <p>Invoice not found</p>
          <a href="#/invoices" class="btn btn-filled">${t('actions.back')}</a>
        </div>
      `;
      return;
    }

    currentTemplate = invoice.template || 'modern';
    const templateHtml = renderTemplate(currentTemplate, invoice);

    container.innerHTML = `
      <div class="page-header-row">
        <div class="page-header-left">
          <a href="#/invoices" class="btn btn-text" style="margin-left: -12px; margin-bottom: var(--space-2);">
            ${icons.arrowLeft} ${t('actions.back')}
          </a>
          <h1 class="page-title">${t('invoices.preview')}: ${invoice.invoice_number}</h1>
        </div>
        <div class="page-header-actions">
          <a href="#/invoices/${params.id}" class="btn btn-tonal">
            ${icons.edit}
            ${t('actions.edit')}
          </a>
        </div>
      </div>

      <div class="invoice-preview-container card-elevated">
        <div class="invoice-preview-toolbar">
          <div class="template-selector">
            <label>${t('invoices.selectTemplate')}:</label>
            <div class="custom-select-container" id="templateSelectContainer">
              <div class="custom-select-trigger" id="templateSelectTrigger">
                <span id="templateSelectLabel">${t(`templates.${currentTemplate}`)}</span>
                ${icons.chevronDown || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'}
              </div>
              <div class="custom-select-options">
                <div class="custom-option ${currentTemplate === 'modern' ? 'selected' : ''}" data-value="modern">${t('templates.modern')}</div>
                <div class="custom-option ${currentTemplate === 'classic' ? 'selected' : ''}" data-value="classic">${t('templates.classic')}</div>
                <div class="custom-option ${currentTemplate === 'classicBlue' ? 'selected' : ''}" data-value="classicBlue">${t('templates.classicBlue')}</div>
                <div class="custom-option ${currentTemplate === 'creative' ? 'selected' : ''}" data-value="creative">${t('templates.creative')}</div>
              </div>
            </div>
          </div>
          <div class="invoice-preview-actions">
            <button class="btn btn-tonal" id="receiptBtn">
                ${icons.file || '<span style="font-size: 18px;">📄</span>'}
                ${latestReceipt ? 'View Receipt' : 'Generate Receipt'}
            </button>
            <button class="btn btn-tonal" id="printBtn">
              ${icons.print}
              ${t('actions.print')}
            </button>
            <button class="btn btn-filled" id="exportPdfBtn">
              ${icons.download}
              ${t('invoices.exportPdf')}
            </button>
          </div>
        </div>
        <div class="invoice-preview-content">
          <div class="invoice-document" id="invoiceDocument">
            ${templateHtml}
          </div>
        </div>
      </div>
    `;

    attachpreviewListeners(invoice, settingsResponse, latestReceipt);

  } catch (error) {
    console.error('Failed to load invoice preview:', error);
    container.innerHTML = `<div class="p-4 text-center text-error">Failed to load preview</div>`;
  }
}

function attachpreviewListeners(invoice, settings, existingReceipt) {
  const invoiceDocument = document.getElementById('invoiceDocument');
  const printBtn = document.getElementById('printBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const receiptBtn = document.getElementById('receiptBtn');

  // Receipt Button Logic
  if (receiptBtn) {
    receiptBtn.addEventListener('click', async () => {
      let receipt = existingReceipt;

      if (!receipt) {
        if (confirm('Create receipt and mark invoice as paid?')) {
          try {
            receiptBtn.disabled = true;
            receiptBtn.textContent = 'Generating...';
            const res = await fetch('/api/receipts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ invoice_id: invoice.id })
            });
            if (!res.ok) throw new Error('Failed to create receipt');
            receipt = await res.json();
            toast.success('Receipt created!');
            // Update button state (reload not strictly necessary if we just use the new receipt)
            existingReceipt = receipt;
            receiptBtn.innerHTML = `📄 View Receipt`; // Reset icon text
          } catch (e) {
            console.error(e);
            toast.error('Failed to create receipt');
            receiptBtn.disabled = false;
            receiptBtn.innerHTML = `📄 Generate Receipt`;
            return;
          } finally {
            receiptBtn.disabled = false;
          }
        } else {
          return;
        }
      }

      // Render Receipt and Print
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
              <title>Receipt ${receipt.receipt_number}</title>
              <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
              <style>
                @page { size: A5 landscape; margin: 0; }
                body { margin: 0; padding: 0; font-family: 'Roboto', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #eee; }
                .receipt-container { background: white;  }
                @media print { 
                    body { background: white; display: block; } 
                    .receipt-container { break-inside: avoid; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                  ${receiptHtml}
              </div>
            </body>
            </html>
          `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // printWindow.close(); // Optional, keep open for PDF saving
      }, 500);

    });
  }

  // Custom Dropdown Logic
  const container = document.getElementById('templateSelectContainer');
  const trigger = document.getElementById('templateSelectTrigger');
  const label = document.getElementById('templateSelectLabel');
  const options = document.querySelectorAll('.custom-option');

  if (container && trigger) {
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
      trigger.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        container.classList.remove('open');
        trigger.classList.remove('open');
      }
    });

    // Handle selection
    options.forEach(option => {
      option.addEventListener('click', async () => {
        const value = option.dataset.value;
        const text = option.textContent;

        // Update UI
        currentTemplate = value;
        label.textContent = text;

        // Update selected state
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Close dropdown
        container.classList.remove('open');
        trigger.classList.remove('open');

        // Render new template
        invoiceDocument.innerHTML = renderTemplate(currentTemplate, invoice);

        // Save preference
        try {
          await invoiceService.update(invoice.id, {
            ...invoice,
            template: currentTemplate,
            language: invoice.language,
            secondary_language: invoice.secondary_language,
            language_mode: invoice.language_mode
          }, invoice.items);
        } catch (err) {
          console.error('Failed to save template pref:', err);
        }
      });
    });
  }

  // Print button
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up blocked. Please allow pop-ups.');
        return;
      }
      printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${invoice.invoice_number}</title>
              <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
              <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 20mm; font-family: 'Roboto', sans-serif; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
              </style>
            </head>
            <body>
              ${invoiceDocument.innerHTML}
            </body>
            </html>
          `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    });
  }

  // Export PDF button
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', async () => {
      try {
        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = `${icons.download} ${t('general.loading')}`;

        await exportToPdf(invoiceDocument, invoice.invoice_number);

        toast.success(`PDF exported: ${invoice.invoice_number}.pdf`);
      } catch (error) {
        console.error('PDF export error:', error);
        toast.error(t('general.error'));
      } finally {
        exportPdfBtn.disabled = false;
        exportPdfBtn.innerHTML = `${icons.download} ${t('invoices.exportPdf')}`;
      }
    });
  }
}
