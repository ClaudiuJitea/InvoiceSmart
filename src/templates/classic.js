// Classic Invoice Template - Traditional Business Style
import { t } from '../i18n/index.js';

export function renderClassicTemplate(invoice) {
  const settings = invoice?.settings || {};
  const isDeliveryNote = invoice.document_type === 'delivery_note';
  const documentTitle = isDeliveryNote
    ? `
      <span class="title-line title-line-primary">AVIZ DE INSOTIRE A MARFII</span>
      <span class="title-line title-line-secondary">DELIVERY NOTE</span>
    `
    : t('invoice.invoice');
  const items = invoice.items || [];
  const minVisibleRows = 12;
  const fillerHeight = Math.max(0, (minVisibleRows - items.length) * 34);

  // Classic color palette
  const colors = {
    primary: '#1A1D21',
    primaryDark: '#000000',
    secondary: '#5A6169',
    accent: '#333333',
    text: '#1A1D21',
    border: '#E2E8F0',
    bgLight: '#F8FAFC'
  };

  return `
    <div class="invoice-template invoice-classic">
      <style>
        .invoice-classic {
          font-family: 'Georgia', 'Times New Roman', serif;
          color: ${colors.text};
          font-size: 10pt;
          line-height: 1.5;
        }
        .invoice-classic .header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          gap: 28px;
          align-items: start;
          border-bottom: 3px solid ${colors.primary};
          padding-bottom: 24px;
          margin-bottom: 36px;
        }
        .invoice-classic .company-info {
          min-width: 0;
        }
        .invoice-classic .company-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20pt;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }
        .invoice-classic .company-details {
          font-size: 9pt;
          line-height: 1.7;
          color: ${colors.secondary};
        }
        .invoice-classic .invoice-info {
          text-align: center;
        }
        .invoice-classic .invoice-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22pt;
          font-weight: 600;
          color: ${colors.primary};
          letter-spacing: 1.2px;
          line-height: 1.15;
          margin-bottom: 16px;
          text-transform: uppercase;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          max-width: 460px;
          margin-left: 0;
          text-align: center;
        }
        .invoice-classic .invoice-title .title-line {
          display: block;
        }
        .invoice-classic .invoice-title .title-line-primary {
          font-size: 12pt;
          letter-spacing: 1.8px;
          font-weight: 700;
        }
        .invoice-classic .invoice-title .title-line-secondary {
          font-size: 18pt;
          letter-spacing: 2.2px;
          font-weight: 600;
        }
        .invoice-classic .info-row {
          display: flex;
          justify-content: center;
          margin-bottom: 5px;
          font-size: 10pt;
        }
        .invoice-classic .client-info {
          min-width: 0;
          text-align: right;
        }
        .invoice-classic .client-label {
          font-size: 8pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.4px;
          margin-bottom: 10px;
          color: ${colors.primary};
        }
        .invoice-classic .client-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14pt;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 8px;
        }
        .invoice-classic .info-label {
          font-weight: 600;
          color: ${colors.secondary};
          margin-right: 12px;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.5px;
        }
        .invoice-classic .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 36px;
        }
        .invoice-classic .parties.single-party {
          grid-template-columns: minmax(320px, 52%);
          justify-content: start;
          gap: 0;
        }
        .invoice-classic .party-box {
          border: 1px solid ${colors.border};
          padding: 18px;
          background: ${colors.bgLight};
          border-radius: 4px;
        }
        .invoice-classic .party-label {
          font-size: 8pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          color: ${colors.primary};
        }
        .invoice-classic .party-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 13pt;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 10px;
        }
        .invoice-classic .party-details {
          font-size: 9pt;
          line-height: 1.6;
          color: ${colors.secondary};
        }
        .invoice-classic .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .invoice-classic .items-table th,
        .invoice-classic .items-table td {
          border: 1px solid ${colors.border};
          padding: 12px;
        }
        .invoice-classic .items-table th {
          background: linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.75px;
        }
        .invoice-classic .items-table th:last-child,
        .invoice-classic .items-table td:last-child {
          text-align: right;
        }
        .invoice-classic .items-table td.number {
          text-align: center;
        }
        .invoice-classic .items-table .filler-row td {
          height: ${fillerHeight}px;
          padding: 0;
        }
        @media print {
          .invoice-classic .items-table .filler-row {
            display: none;
          }
        }
        .invoice-classic .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .invoice-classic .totals-table {
          border: 1px solid ${colors.border};
          min-width: 300px;
        }
        .invoice-classic .totals-table tr td {
          padding: 10px 16px;
          border-bottom: 1px solid ${colors.border};
        }
        .invoice-classic .totals-table tr:last-child td {
          border-bottom: none;
        }
        .invoice-classic .totals-table .label {
          text-transform: uppercase;
          font-size: 9pt;
          color: ${colors.secondary};
        }
        .invoice-classic .totals-table .value {
          text-align: right;
          font-weight: 600;
          color: ${colors.primary};
        }
        .invoice-classic .totals-table .total-row {
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
          color: white;
        }
        .invoice-classic .totals-table .total-row td {
          padding: 14px 16px;
          font-size: 13pt;
          border: none;
          color: white;
        }
        .invoice-classic .totals-table .total-row .value,
        .invoice-classic .totals-table .total-row .label {
          color: white;
        }
        .invoice-classic .footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 60px;
          padding-top: 24px;
          border-top: 2px solid ${colors.border};
        }
        .invoice-classic .footer-section h4 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 10pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          color: ${colors.primary};
        }
        .invoice-classic .footer-section p {
          font-size: 9pt;
          margin: 0;
          line-height: 1.6;
          color: ${colors.secondary};
        }
        .invoice-classic .signature-box {
          text-align: center;
          padding-top: 50px;
        }
        .invoice-classic .signature-line {
          border-top: 2px solid ${colors.accent};
          margin-top: 60px;
          padding-top: 8px;
          font-size: 9pt;
          color: ${colors.secondary};
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>

      <div class="header">
        <div class="company-info">
          <div class="company-name">${settings.company_name || 'Your Company'}</div>
          <div class="company-details">
            ${settings.company_cif ? `CIF/VAT: ${settings.company_cif}<br>` : ''}
            ${settings.company_reg_no ? `Reg. No.: ${settings.company_reg_no}<br>` : ''}
            ${settings.company_address ? settings.company_address.trim().replace(/,$/, '') + '<br>' : ''}
            ${[settings.company_city, settings.company_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ') + '<br>'}
            ${settings.company_phone ? `Tel: ${settings.company_phone}<br>` : ''}
            ${settings.company_email || ''}
          </div>
        </div>
        <div class="invoice-info">
          <div class="invoice-title">${documentTitle}</div>
          <div class="info-row">
            <span class="info-label">${t('invoice.invoiceNo')}:</span>
            <span>${invoice.invoice_number}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('invoice.date')}:</span>
            <span>${new Date(invoice.issue_date).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('invoice.dueDate')}:</span>
            <span>${new Date(invoice.due_date).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="client-info">
          <div class="client-label">${t('invoice.client')} / ${t('invoice.to')}</div>
          <div class="client-name">${invoice.client_name || ''}</div>
          <div class="company-details">
            ${invoice.client_cif ? `CIF: ${invoice.client_cif}<br>` : ''}
            ${invoice.client_reg_no ? `Reg: ${invoice.client_reg_no}<br>` : ''}
            ${invoice.client_address ? invoice.client_address.trim().replace(/,$/, '') + '<br>' : ''}
            ${[invoice.client_city, invoice.client_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ')}
            ${invoice.client_bank_account ? `<br>${t('invoice.iban')}: ${invoice.client_bank_account}` : ''}
            ${invoice.client_bank_name ? `<br>${t('invoice.bank')}: ${invoice.client_bank_name}` : ''}
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px">Nr.</th>
            <th>${t('invoice.description')}</th>
            <th style="width: 60px">${t('invoice.unit')}</th>
            <th style="width: 70px">${t('invoice.quantity')}</th>
            <th style="width: 100px">${t('invoice.unitPrice')}</th>
            <th style="width: 110px">${t('invoice.amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td class="number">${index + 1}</td>
              <td>${item.description}</td>
              <td class="number">${item.unit}</td>
              <td class="number">${item.quantity}</td>
              <td style="text-align: right">${item.unit_price.toFixed(2)}</td>
              <td>${item.total.toFixed(2)} ${invoice.currency}</td>
            </tr>
          `).join('')}
          ${fillerHeight > 0 ? `
            <tr class="filler-row">
              <td colspan="6"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="totals">
        <table class="totals-table">
          <tr>
            <td class="label">${t('invoice.subtotal')}</td>
            <td class="value">${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
          </tr>
          ${invoice.tax_amount > 0 ? `
            <tr>
              <td class="label">${t('invoice.tax')} (${invoice.tax_rate}%)</td>
              <td class="value">${invoice.tax_amount.toFixed(2)} ${invoice.currency}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td class="label">${t('invoice.totalDue')}</td>
            <td class="value">${invoice.total.toFixed(2)} ${invoice.currency}</td>
          </tr>
          ${invoice.total_secondary ? `
            <tr>
              <td class="label"></td>
              <td class="value">${invoice.total_secondary.toFixed(2)} ${invoice.secondary_currency}</td>
            </tr>
          ` : ''}
        </table>
      </div>

      <div class="footer">
        <div class="footer-section">
          <h4>${t('invoice.bankDetails')}</h4>
          <p>
            ${settings.company_bank_account ? `${t('invoice.iban')}: ${settings.company_bank_account}<br>` : ''}
            ${settings.company_swift ? `${t('invoice.swift')}: ${settings.company_swift}<br>` : ''}
            ${settings.company_bank_name ? `${t('invoice.bank')}: ${settings.company_bank_name}` : ''}
          </p>
        </div>
        <div class="signature-box">
          <div class="signature-line">${t('invoice.customerSignature')}</div>
        </div>
      </div>
    </div>
  `;
}
