// Classic Invoice Template - Traditional Business Style
import { t } from '../i18n/index.js';
import { settingsService } from '../db/services/settingsService.js';

export function renderClassicTemplate(invoice) {
  const settings = settingsService.get() || {};

  return `
    <div class="invoice-template invoice-classic">
      <style>
        .invoice-classic {
          font-family: 'Roboto', serif;
          color: #333;
          font-size: 10pt;
          line-height: 1.4;
        }
        .invoice-classic .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 3px double #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .invoice-classic .company-info {
          max-width: 55%;
        }
        .invoice-classic .company-name {
          font-size: 18pt;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .invoice-classic .company-details {
          font-size: 9pt;
          line-height: 1.6;
        }
        .invoice-classic .invoice-info {
          text-align: right;
        }
        .invoice-classic .invoice-title {
          font-size: 24pt;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        .invoice-classic .info-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5px;
          font-size: 10pt;
        }
        .invoice-classic .info-label {
          font-weight: 500;
          margin-right: 10px;
        }
        .invoice-classic .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }
        .invoice-classic .party-box {
          border: 1px solid #ddd;
          padding: 15px;
        }
        .invoice-classic .party-label {
          font-size: 8pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          color: #666;
        }
        .invoice-classic .party-name {
          font-size: 12pt;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .invoice-classic .party-details {
          font-size: 9pt;
          line-height: 1.5;
        }
        .invoice-classic .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .invoice-classic .items-table th,
        .invoice-classic .items-table td {
          border: 1px solid #ddd;
          padding: 10px;
        }
        .invoice-classic .items-table th {
          background: #f5f5f5;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 8pt;
          letter-spacing: 0.5px;
        }
        .invoice-classic .items-table th:last-child,
        .invoice-classic .items-table td:last-child {
          text-align: right;
        }
        .invoice-classic .items-table td.number {
          text-align: center;
        }
        .invoice-classic .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .invoice-classic .totals-table {
          border: 1px solid #ddd;
          min-width: 280px;
        }
        .invoice-classic .totals-table tr td {
          padding: 8px 12px;
          border-bottom: 1px solid #ddd;
        }
        .invoice-classic .totals-table tr:last-child td {
          border-bottom: none;
        }
        .invoice-classic .totals-table .label {
          text-transform: uppercase;
          font-size: 9pt;
        }
        .invoice-classic .totals-table .value {
          text-align: right;
          font-weight: 500;
        }
        .invoice-classic .totals-table .total-row {
          background: #333;
          color: white;
        }
        .invoice-classic .totals-table .total-row td {
          padding: 12px;
          font-size: 12pt;
          border: none;
        }
        .invoice-classic .footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        .invoice-classic .footer-section h4 {
          font-size: 9pt;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 10px;
          color: #666;
        }
        .invoice-classic .footer-section p {
          font-size: 9pt;
          margin: 0;
          line-height: 1.5;
        }
        .invoice-classic .signature-box {
          text-align: center;
          padding-top: 40px;
        }
        .invoice-classic .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 8pt;
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
          <div class="invoice-title">${t('invoice.invoice')}</div>
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
      </div>

      <div class="parties">
        <div class="party-box">
          <div class="party-label">${t('invoice.supplier')} / ${t('invoice.from')}</div>
          <div class="party-name">${settings.company_name || 'Your Company'}</div>
          <div class="party-details">
            ${settings.company_cif ? `CIF: ${settings.company_cif}<br>` : ''}
            ${settings.company_reg_no ? `Reg: ${settings.company_reg_no}<br>` : ''}
            ${settings.company_address ? settings.company_address.trim().replace(/,$/, '') + '<br>' : ''}
            ${[settings.company_city, settings.company_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ')}
          </div>
        </div>
        <div class="party-box">
          <div class="party-label">${t('invoice.client')} / ${t('invoice.to')}</div>
          <div class="party-name">${invoice.client_name || ''}</div>
          <div class="party-details">
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
          ${(invoice.items || []).map((item, index) => `
            <tr>
              <td class="number">${index + 1}</td>
              <td>${item.description}</td>
              <td class="number">${item.unit}</td>
              <td class="number">${item.quantity}</td>
              <td style="text-align: right">${item.unit_price.toFixed(2)}</td>
              <td>${item.total.toFixed(2)} ${invoice.currency}</td>
            </tr>
          `).join('')}
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
