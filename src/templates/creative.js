// Creative Invoice Template - Green Professional
import { t, tDual, i18n } from '../i18n/index.js';
import { settingsService } from '../db/services/settingsService.js';

export function renderCreativeTemplate(invoice) {
  const settings = settingsService.get() || {};
  const lang = invoice.language || 'en';
  const secLang = invoice.secondary_language || 'ro';
  const mode = invoice.language_mode || 'single';
  const items = invoice.items || [];
  const minVisibleRows = 12;
  const fillerHeight = Math.max(0, (minVisibleRows - items.length) * 30);

  // Helper to get text based on mode
  // The image shows specific bilingual labels (RO/EN) regardless of mode for some headers
  // But we will respect the app's mode for dynamic text
  const text = (key) => {
    if (mode === 'dual') {
      return tDual(key, lang, secLang);
    }
    return i18n.get(key, lang);
  };

  // Static bilingual labels matching the image style
  const labels = {
    from: 'Furnizor/From:',
    cui: 'CUI/VAT No.:',
    reg: 'Nr. Reg. Com/Reg. No.:',
    address: 'Adresa/Address:',
    email: 'Email:',
    account: 'Cont:',
    swift: 'SWIFT:',
    bank: 'Banca:',
    invoiceTitle: 'FACTURA\nINVOICE',
    nr: 'Nr./No.:',
    date: 'Data/Date:',
    client: 'Client/To:',
    dueDate: 'Data scadenta / Due Date:',
    table: {
      nr: 'Nr.\nNo.',
      item: 'Denumirea serviciilor si a produselor\nItem name and description',
      unit: 'U.M.\nUnit',
      qty: 'Cant.\nQty.',
      price: 'Pret Unitar\nNet Price',
      vat: 'TVA\nVAT',
      amount: 'Valoare\nNet Amount'
    }
  };

  // Professional green color palette
  const colors = {
    lightGreenBg: '#F1F8E9', // table header
    darkGreen: '#2E7D32',    // main green accent
    lightGreen: '#E8F5E9',   // invoice box header / backgrounds
    textDark: '#1A1D21',
    textGrey: '#5A6169',
    borderGreen: '#2E7D32'
  };

  return `
    <div class="invoice-template invoice-creative">
      <style>
        .invoice-creative {
          font-family: 'Inter', sans-serif;
          color: ${colors.textDark};
          font-size: 9pt;
          line-height: 1.4;
          background: white;
          padding: 0;
        }

        /* Top Header Area */
        .invoice-creative .header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        .invoice-creative .supplier-col {
          flex: 1;
          padding-right: 20px;
        }

        .invoice-creative .supplier-label {
          font-size: 9pt;
          margin-bottom: 5px;
          color: ${colors.textGrey};
        }

        .invoice-creative .company-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 13pt;
          font-weight: 600;
          margin-bottom: 6px;
          color: ${colors.darkGreen};
        }

        .invoice-creative .company-details {
          font-size: 9pt;
        }

        .invoice-creative .details-line {
          margin-bottom: 2px;
        }

        .invoice-creative .invoice-col {
            width: 300px;
            flex-shrink: 0;
        }

        /* Invoice Box Style */
        .invoice-creative .invoice-box-header {
            background-color: ${colors.lightGreen};
            padding: 10px 15px;
            height: 60px;
        }

        .invoice-creative .invoice-title {
            font-size: 14pt;
            line-height: 1.2;
            font-weight: 400;
            white-space: pre-line;
        }

        .invoice-creative .invoice-box-details {
            background-color: ${colors.darkGreen};
            color: white;
            padding: 8px 15px;
        }

        .invoice-creative .invoice-detail-row {
            display: flex;
            margin-bottom: 2px;
            font-size: 9pt;
        }
        
        .invoice-creative .detail-val {
            margin-left: 5px;
        }

        /* Client Section */
        .invoice-creative .client-section {
            margin-top: 20px;
            margin-left: 0; /* Aligned left in the right column space effectively */
        }
        
        .invoice-creative .client-label {
            margin-bottom: 5px;
            color: ${colors.textGrey};
        }

        .invoice-creative .client-name {
            font-weight: 700;
            font-size: 11pt;
            margin-bottom: 3px;
        }

        /* Due Date Bar */
        .invoice-creative .due-date-row {
            margin-top: 40px;
            margin-bottom: 10px;
            font-weight: 500;
        }

        /* Items Table */
        .invoice-creative .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .invoice-creative .items-table th {
            background-color: ${colors.lightGreenBg};
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 8.5pt;
            vertical-align: top;
            white-space: pre-line;
            color: ${colors.darkGreen};
            border-bottom: 2px solid ${colors.borderGreen};
        }
        
        .invoice-creative .items-table th.text-right {
            text-align: right;
        }
        
        .invoice-creative .items-table th.text-center {
            text-align: center;
        }

        .invoice-creative .items-table td {
            padding: 8px 5px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }

        .invoice-creative .items-table td.text-right {
            text-align: right;
        }
        
        .invoice-creative .items-table td.text-center {
            text-align: center;
        }
        .invoice-creative .items-table .filler-row td {
            height: ${fillerHeight}px;
            padding: 0;
            border-bottom: 1px solid #eee;
        }

        /* Totals */
        .invoice-creative .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }

        .invoice-creative .totals-table {
            min-width: 250px;
            border-collapse: collapse;
        }

        .invoice-creative .totals-table td {
            padding: 5px 10px;
            text-align: right;
        }

        .invoice-creative .totals-table .total-row {
            background-color: ${colors.lightGreenBg};
            font-weight: 700;
            color: ${colors.darkGreen};
        }

        .invoice-creative .totals-table .total-row td {
            padding: 12px;
            border-top: 2px solid ${colors.borderGreen};
        }

        /* Footer / Signatures */
        .invoice-creative .footer-row {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
        }

        .invoice-creative .signature-box {
            text-align: center;
            width: 200px;
            border-top: 1px solid #ccc;
            padding-top: 5px;
        }

      </style>

      <div class="header-row">
        <!-- Left: Supplier Info -->
        <div class="supplier-col">
          <div class="supplier-label">${labels.from}</div>
          <div class="company-name">${settings.company_name || 'Your Company'}</div>
          <div class="company-details">
            ${settings.company_cif ? `<div class="details-line"><strong>${labels.cui}</strong> ${settings.company_cif}</div>` : ''}
            ${settings.company_reg_no ? `<div class="details-line"><strong>${labels.reg}</strong> ${settings.company_reg_no}</div>` : ''}
            ${(() => {
      const addr = settings.company_address ? settings.company_address.trim().replace(/,$/, '') : '';
      const cityCountry = [settings.company_city, settings.company_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ');
      if (!addr && !cityCountry) return '';
      return `
                <div class="details-line">
                  <strong>${labels.address}</strong> ${addr}
                  ${cityCountry ? `<br><span style="margin-left: 0;">${cityCountry}</span>` : ''}
                </div>
              `;
    })()}
            ${settings.company_email ? `<div class="details-line"><strong>${labels.email}</strong> ${settings.company_email}</div>` : ''}
            ${settings.company_bank_account ? `<div class="details-line"><strong>${labels.account}</strong> ${settings.company_bank_account}</div>` : ''}
            ${settings.company_swift ? `<div class="details-line"><strong>${labels.swift}</strong> ${settings.company_swift}</div>` : ''}
            ${settings.company_bank_name ? `<div class="details-line"><strong>${labels.bank}</strong> ${settings.company_bank_name}</div>` : ''}
          </div>
        </div>

        <!-- Right: Invoice & Client Info -->
        <div class="invoice-col">
          <!-- Green Box Header -->
          <div class="invoice-box-header">
            <div class="invoice-title">${labels.invoiceTitle}</div>
          </div>
          <!-- Dark Green Strip -->
          <div class="invoice-box-details">
            <div class="invoice-detail-row">
                <span style="opacity: 0.8;">${labels.nr}</span>
                <span class="detail-val">${invoice.invoice_number}</span>
            </div>
            <div class="invoice-detail-row">
                <span style="opacity: 0.8;">${labels.date}</span>
                <span class="detail-val">${new Date(invoice.issue_date).toLocaleDateString()}</span>
            </div>
          </div>

          <!-- Client Info (Below Header Box) -->
          <div class="client-section">
            <div class="client-label">${labels.client}</div>
            <div class="client-name">${invoice.client_name || 'Client Name'}</div>
            <div class="company-details">
                ${invoice.client_cif ? `<div class="details-line"><strong>${labels.cui}</strong> ${invoice.client_cif}</div>` : ''}
                ${(() => {
      const addr = invoice.client_address ? invoice.client_address.trim().replace(/,$/, '') : '';
      const cityCountry = [invoice.client_city, invoice.client_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ');
      if (!addr && !cityCountry) return '';
      return `
                    <div class="details-line">
                      <strong>${labels.address}</strong> ${addr}
                      ${cityCountry ? `<br><span style="margin-left: 0;">${cityCountry}</span>` : ''}
                    </div>
                  `;
    })()}
                ${invoice.client_bank_account ? `<div class="details-line"><strong>${labels.account}</strong> ${invoice.client_bank_account}</div>` : ''}
                ${invoice.client_bank_name ? `<div class="details-line"><strong>${labels.bank}</strong> ${invoice.client_bank_name}</div>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Due Date Line -->
      <div class="due-date-row">
        ${labels.dueDate} ${new Date(invoice.due_date).toLocaleDateString()}
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
            <tr>
                <th style="width: 40px; text-align: center;">${labels.table.nr}</th>
                <th>${labels.table.item}</th>
                <th class="text-center" style="width: 60px;">${labels.table.unit}</th>
                <th class="text-center" style="width: 60px;">${labels.table.qty}</th>
                <th class="text-right" style="width: 100px;">${labels.table.price}</th>
                <th class="text-right" style="width: 60px;">${labels.table.vat}</th>
                <th class="text-right" style="width: 100px;">${labels.table.amount}</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.description}</td>
                    <td class="text-center">${item.unit}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">
                        <div>${item.unit_price.toFixed(2)} ${invoice.currency}</div>
                    </td>
                    <td class="text-right">
                        <div>${item.tax_rate || 0}%</div>
                    </td>
                    <td class="text-right">
                        <div>${item.total.toFixed(2)} ${invoice.currency}</div>
                    </td>
                </tr>
            `).join('')}
            ${fillerHeight > 0 ? `
                <tr class="filler-row">
                    <td colspan="7"></td>
                </tr>
            ` : ''}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td>${text('invoice.subtotal')}</td>
                <td>${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
            </tr>
            ${invoice.tax_amount > 0 ? `
            <tr>
                <td>${text('invoice.tax')} / TVA</td>
                <td>${invoice.tax_amount.toFixed(2)} ${invoice.currency}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td>${text('invoice.total')}</td>
                <td>${invoice.total.toFixed(2)} ${invoice.currency}</td>
            </tr>
            ${invoice.total_secondary ? `
            <tr>
                <td></td>
                <td style="font-size: 10pt; color: #555;">${invoice.total_secondary.toFixed(2)} ${invoice.secondary_currency}</td>
            </tr>
            ` : ''}
        </table>
      </div>

      <!-- Footer Signatures -->
      <div class="footer-row">
        <div class="signature-box">
             ${text('invoice.signature')}
        </div>
        <div class="signature-box">
             ${text('invoice.customerSignature')}
        </div>
      </div>

    </div>
    `;
}
