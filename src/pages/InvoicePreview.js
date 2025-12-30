// Invoice Preview Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { renderTemplate } from '../templates/index.js';
import { exportToPdf } from '../services/pdfService.js';
import { toast } from '../components/common/Toast.js';
import { router } from '../router.js';

let currentTemplate = null;

export function renderInvoicePreview(params = {}) {
  const invoice = invoiceService.getById(parseInt(params.id));

  if (!invoice) {
    return `
      <div class="page-container">
        <div class="empty-state">
          <h3>${t('general.error')}</h3>
          <p>Invoice not found</p>
          <a href="#/invoices" class="btn btn-filled">${t('actions.back')}</a>
        </div>
      </div>
    `;
  }

  currentTemplate = invoice.template || 'modern';
  const templateHtml = renderTemplate(currentTemplate, invoice);

  return `
    <div class="page-container">
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
    </div>
  `;
}

export function initInvoicePreview(params = {}) {
  const invoice = invoiceService.getById(parseInt(params.id));
  if (!invoice) return;

  const invoiceDocument = document.getElementById('invoiceDocument');
  const printBtn = document.getElementById('printBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

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
      option.addEventListener('click', () => {
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
        invoiceService.update(invoice.id, {
          ...invoice,
          template: currentTemplate,
          language: invoice.language,
          secondary_language: invoice.secondary_language,
          language_mode: invoice.language_mode
        }, invoice.items);
      });
    });
  }

  // Print button
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
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
