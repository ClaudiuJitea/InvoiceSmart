// Modern Invoice Template - Clean, Minimal
import { t, tDual, i18n } from '../i18n/index.js';
import { settingsService } from '../db/services/settingsService.js';

export function renderModernTemplate(invoice) {
  const settings = settingsService.get() || {};
  const lang = invoice.language || 'en';
  const secLang = invoice.secondary_language || 'ro';
  const mode = invoice.language_mode || 'single';
  const items = invoice.items || [];
  const minVisibleRows = 12;
  const fillerHeight = Math.max(0, (minVisibleRows - items.length) * 38);

  const text = (key) => {
    if (mode === 'dual') {
      return tDual(key, lang, secLang);
    }
    return i18n.get(key, lang);
  };
  const headerLabel = (key) => {
    if (mode === 'dual') {
      return `
        <span class="label-primary">${i18n.get(key, lang)}</span>
        <span class="label-secondary">${i18n.get(key, secLang)}</span>
      `;
    }
    return `<span class="label-single">${i18n.get(key, lang)}</span>`;
  };

  // Modern color palette
  const colors = {
    primary: '#1E3A5F',
    secondary: '#5A6169',
    accent: '#1E3A5F',
    text: '#1A1D21',
    border: '#E8ECF0',
    bgLight: '#F4F6F8',
    bgDark: '#EEF1F4'
  };

  return `
    <div class="invoice-template invoice-modern">
      <style>
        .invoice-modern {
          font-family: 'Inter', sans-serif;
          color: ${colors.text};
          font-size: 10pt;
          line-height: 1.5;
        }
        .invoice-modern .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 48px;
          align-items: flex-start;
        }
        .invoice-modern .company-info {
          max-width: 60%;
        }
        .invoice-modern .company-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18pt;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 10px;
          line-height: 1.2;
          margin-top: 0;
          letter-spacing: -0.01em;
        }
        .invoice-modern .company-details {
          font-size: 9pt;
          color: ${colors.secondary};
          line-height: 1.6;
        }
        .invoice-modern .invoice-badge {
          text-align: right;
        }
        .invoice-modern .invoice-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32pt;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 10px;
          line-height: 1;
          margin-top: 0;
          letter-spacing: -0.02em;
        }
        .invoice-modern .invoice-number {
          font-size: 12pt;
          color: ${colors.accent};
          font-weight: 600;
        }
        .invoice-modern .dates-client {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding: 24px;
          background: linear-gradient(135deg, ${colors.bgLight} 0%, ${colors.bgDark} 100%);
          border-radius: 12px;
          border: 1px solid ${colors.border};
        }
        .invoice-modern .dates {
          font-size: 9pt;
        }
        .invoice-modern .dates-label {
          color: ${colors.secondary};
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.5px;
        }
        .invoice-modern .dates-value {
          font-weight: 600;
          font-size: 10pt;
          color: ${colors.primary};
        }
        .invoice-modern .client-info {
          text-align: right;
        }
        .invoice-modern .client-label {
          font-size: 9pt;
          color: ${colors.secondary};
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.5px;
        }
        .invoice-modern .client-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 13pt;
          font-weight: 600;
          color: ${colors.primary};
        }
        .invoice-modern .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          table-layout: fixed;
        }
        .invoice-modern .items-table th {
          padding: 8px 10px 9px;
          border-bottom: 3px solid ${colors.primary};
          font-weight: 600;
          font-size: 8.5pt;
          color: ${colors.primary};
          text-transform: none;
          letter-spacing: 0.2px;
          vertical-align: top;
          line-height: 1.3;
        }
        .invoice-modern .items-table th .header-label {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 40px;
          white-space: normal;
          word-break: keep-all;
          overflow-wrap: break-word;
          width: 100%;
        }
        .invoice-modern .items-table th .label-primary,
        .invoice-modern .items-table th .label-secondary,
        .invoice-modern .items-table th .label-single {
          display: block;
        }
        .invoice-modern .items-table th .label-primary {
          font-weight: 700;
          line-height: 1.2;
        }
        .invoice-modern .items-table th .label-secondary {
          margin-top: 2px;
          font-size: 8pt;
          opacity: 0.88;
          line-height: 1.2;
        }
        .invoice-modern .items-table td {
          padding: 14px 12px;
          border-bottom: 1px solid ${colors.border};
          vertical-align: top;
        }
        .invoice-modern .items-table .col-description {
          width: 44%;
          text-align: left;
        }
        .invoice-modern .items-table .col-unit,
        .invoice-modern .items-table .col-qty {
          width: 10%;
          text-align: center;
        }
        .invoice-modern .items-table .col-unit-price,
        .invoice-modern .items-table .col-amount {
          width: 18%;
          text-align: right;
        }
        .invoice-modern .items-table td.col-description {
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .invoice-modern .items-table td.col-unit,
        .invoice-modern .items-table td.col-qty {
          white-space: nowrap;
        }
        .invoice-modern .items-table td.col-unit-price,
        .invoice-modern .items-table td.col-amount {
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .invoice-modern .items-table th.col-description .header-label {
          align-items: flex-start;
          text-align: left;
        }
        .invoice-modern .items-table th.col-unit .header-label,
        .invoice-modern .items-table th.col-qty .header-label {
          align-items: center;
          text-align: center;
        }
        .invoice-modern .items-table th.col-unit-price .header-label,
        .invoice-modern .items-table th.col-amount .header-label {
          align-items: flex-end;
          text-align: right;
        }
        .invoice-modern .items-table .filler-row td {
          height: ${fillerHeight}px;
          padding: 0;
          border-bottom: 1px solid ${colors.border};
        }
        .invoice-modern .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .invoice-modern .totals-table {
          min-width: 250px;
        }
        .invoice-modern .totals-table tr td {
          padding: 8px 0;
        }
        .invoice-modern .totals-table .label {
          color: ${colors.secondary};
          padding-right: 20px;
        }
        .invoice-modern .totals-table .value {
          text-align: right;
          font-weight: 600;
          color: ${colors.primary};
        }
        .invoice-modern .totals-table .total-row {
          border-top: 3px solid ${colors.primary};
        }
        .invoice-modern .totals-table .total-row td {
          padding-top: 14px;
          font-size: 16pt;
          color: ${colors.primary};
        }
        .invoice-modern .footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid ${colors.border};
          display: flex;
          justify-content: space-between;
        }
        .invoice-modern .bank-info {
          font-size: 9pt;
        }
        .invoice-modern .bank-label {
          color: ${colors.secondary};
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.5px;
        }
        .invoice-modern .signature {
          text-align: center;
          min-width: 160px;
          font-size: 9pt;
          color: ${colors.secondary};
          margin-left: auto;
        }
        .invoice-modern .signature-line {
          width: 100%;
          border-bottom: 2px solid ${colors.accent};
          margin-top: 45px;
        }
      </style>

      <div class="header">
        <div class="company-info">
          <div class="company-name">${settings.company_name || 'Your Company'}</div>
          <div class="company-details">
            ${settings.company_cif ? `CIF: ${settings.company_cif}<br>` : ''}
            ${settings.company_reg_no ? `Reg: ${settings.company_reg_no}<br>` : ''}
            ${settings.company_address ? settings.company_address.trim().replace(/,$/, '') + '<br>' : ''}
            ${[settings.company_city, settings.company_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ') + '<br>'}
            ${settings.company_email ? `${settings.company_email}` : ''}
          </div>
        </div>
        <div class="invoice-badge">
          <div class="invoice-title">${text('invoice.invoice')}</div>
          <div class="invoice-number">${invoice.invoice_number}</div>
        </div>
      </div>

      <div class="dates-client">
        <div class="dates">
          <div>
            <div class="dates-label">${text('invoice.date')}</div>
            <div class="dates-value">${new Date(invoice.issue_date).toLocaleDateString()}</div>
          </div>
          <div style="margin-top: 12px;">
            <div class="dates-label">${text('invoice.dueDate')}</div>
            <div class="dates-value">${new Date(invoice.due_date).toLocaleDateString()}</div>
          </div>
        </div>
        <div class="client-info">
          <div class="client-label">${text('invoice.to')}</div>
          <div class="client-name">${invoice.client_name || ''}</div>
          <div class="company-details">
            ${invoice.client_cif ? `CIF: ${invoice.client_cif}<br>` : ''}
            ${invoice.client_address ? invoice.client_address.trim().replace(/,$/, '') + '<br>' : ''}
            ${[invoice.client_city, invoice.client_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ')}
            ${invoice.client_bank_account ? `<br>${text('invoice.iban')}: ${invoice.client_bank_account}` : ''}
            ${invoice.client_bank_name ? `<br>${text('invoice.bank')}: ${invoice.client_bank_name}` : ''}
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="col-description"><span class="header-label">${headerLabel('invoice.description')}</span></th>
            <th class="col-unit"><span class="header-label">${headerLabel('invoice.unit')}</span></th>
            <th class="col-qty"><span class="header-label">${headerLabel('invoice.quantity')}</span></th>
            <th class="col-unit-price"><span class="header-label">${headerLabel('invoice.unitPrice')}</span></th>
            <th class="col-amount"><span class="header-label">${headerLabel('invoice.amount')}</span></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td class="col-description">${item.description}</td>
              <td class="col-unit">${item.unit}</td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-unit-price">${item.unit_price.toFixed(2)} ${invoice.currency}</td>
              <td class="col-amount">${item.total.toFixed(2)} ${invoice.currency}</td>
            </tr>
          `).join('')}
          ${fillerHeight > 0 ? `
            <tr class="filler-row">
              <td colspan="5"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="totals">
        <table class="totals-table">
          <tr>
            <td class="label">${text('invoice.subtotal')}</td>
            <td class="value">${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
          </tr>
          ${invoice.tax_amount > 0 ? `
            <tr>
              <td class="label">${text('invoice.tax')} (${invoice.tax_rate}%)</td>
              <td class="value">${invoice.tax_amount.toFixed(2)} ${invoice.currency}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td class="label">${text('invoice.total')}</td>
            <td class="value">${invoice.total.toFixed(2)} ${invoice.currency}</td>
          </tr>
          ${invoice.total_secondary ? `
            <tr>
              <td class="label"></td>
              <td class="value" style="font-size: 11pt; color: #49454F;">${invoice.total_secondary.toFixed(2)} ${invoice.secondary_currency}</td>
            </tr>
          ` : ''}
        </table>
      </div>

      <div class="footer">
        <div class="bank-info">
          <div class="bank-label">${text('invoice.bankDetails')}</div>
          ${settings.company_bank_account ? `<div>${text('invoice.iban')}: ${settings.company_bank_account}</div>` : ''}
          ${settings.company_swift ? `<div>${text('invoice.swift')}: ${settings.company_swift}</div>` : ''}
          ${settings.company_bank_name ? `<div>${text('invoice.bank')}: ${settings.company_bank_name}</div>` : ''}
        </div>
        <div class="signature">
          <div>${text('invoice.customerSignature')}</div>
          <div class="signature-line"></div>
        </div>
      </div>
    </div>
  `;
}
