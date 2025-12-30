// Classic Blue Invoice Template - Professional Blue Style
import { t } from '../i18n/index.js';
import { settingsService } from '../db/services/settingsService.js';

export function renderClassicBlueTemplate(invoice) {
    const settings = settingsService.get() || {};
    const primaryColor = '#21618C'; // Strong Blue
    const secondaryColor = '#3498DB'; // Lighter Blue
    const tableBorderColor = '#21618C';

    return `
    <div class="invoice-template invoice-classic-blue">
      <style>
        .invoice-classic-blue {
          font-family: 'Arial', 'Helvetica', sans-serif;
          color: ${primaryColor};
          font-size: 9pt;
          line-height: 1.3;
        }
        .invoice-classic-blue strong {
            font-weight: 700;
        }
        .invoice-classic-blue .header-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            align-items: flex-start;
        }
        .invoice-classic-blue .supplier-col {
            width: 32%;
            text-align: left;
        }
        .invoice-classic-blue .invoice-title-col {
            width: 32%;
            text-align: center;
        }
        .invoice-classic-blue .client-col {
            width: 32%;
            text-align: right;
        }
        .invoice-classic-blue .invoice-title {
            font-size: 24pt;
            font-weight: bold;
            text-transform: uppercase;
            color: ${primaryColor};
            margin-bottom: 5px;
            margin-top: 0;
            line-height: 1;
        }
        .invoice-classic-blue .invoice-subtitle-row {
            font-size: 10pt;
            margin-bottom: 20px;
            line-height: 1.4;
        }
        .invoice-classic-blue .client-col {
           /* ensuring margin reset if any */
        }
        .invoice-classic-blue .section-label {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: 10pt;
        }
        
        /* Table Styles */
        .invoice-classic-blue .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border: 2px solid ${tableBorderColor};
        }
        .invoice-classic-blue .items-table th, 
        .invoice-classic-blue .items-table td {
            border: 1px solid ${tableBorderColor};
            padding: 5px 8px;
            vertical-align: top;
        }
        .invoice-classic-blue .items-table th {
            text-align: center;
            font-weight: bold;
            font-size: 8pt;
            padding: 8px 4px;
        }
        .invoice-classic-blue .col-idx { width: 30px; text-align: center; }
        .invoice-classic-blue .col-desc { }
        .invoice-classic-blue .col-unit { width: 40px; text-align: center; }
        .invoice-classic-blue .col-qty { width: 40px; text-align: right; }
        .invoice-classic-blue .col-price { width: 80px; text-align: right; }
        .invoice-classic-blue .col-val { width: 80px; text-align: right; }
        .invoice-classic-blue .col-vat { width: 80px; text-align: right; }

        .invoice-classic-blue .col-number { text-align: center; font-size: 8pt; }
        
        /* Footer/Totals */
        .invoice-classic-blue .footer-row {
            display: flex; /* Not really flex in the image, strictly part of table usually, but we can simulate */
            /* Actually in the image the totals are part of the table structure at the bottom right usually, 
               but here we can just append a table or keep it separate. 
               The image shows the columns extending down. */
        }
        .invoice-classic-blue .totals-section {
            display: flex;
            border: 2px solid ${tableBorderColor};
            border-top: none;
        }
        .invoice-classic-blue .footer-left {
            flex: 1;
            padding: 10px;
            border-right: 1px solid ${tableBorderColor};
        }
        .invoice-classic-blue .footer-totals {
            width: 160px; /* Adjust to match last 2 columns approx */
            display: flex;
            flex-direction: column;
        }
        .invoice-classic-blue .footer-total-row {
            display: flex;
            border-bottom: 1px solid ${tableBorderColor};
        }
        .invoice-classic-blue .footer-total-row:last-child {
            border-bottom: none;
            flex: 1;
        }
        .invoice-classic-blue .footer-total-label {
            padding: 5px;
            font-weight: bold;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .invoice-classic-blue .footer-total-val {
            padding: 5px;
            text-align: right;
            border-left: 1px solid ${tableBorderColor};
            width: 80px; /* match vat col */
        }
        .invoice-classic-blue .grand-total {
            font-size: 14pt;
            font-weight: bold;
        }
        
        .invoice-classic-blue .signature-area {
            margin-top: 10px;
            font-size: 9pt;
        }

      </style>

      <div class="header-row">
        <!-- Supplier (Left) -->
        <div class="supplier-col">
            <div class="section-label">${settings.company_name || 'Firma Test'}</div>
            <div>${settings.company_cif ? `CIF: ${settings.company_cif}` : ''}</div>
            <div>${settings.company_reg_no ? `Reg.com.: ${settings.company_reg_no}` : ''}</div>
            <div>${settings.company_address || settings.company_city || settings.company_country ? `Adresa: ${settings.company_address ? settings.company_address.trim().replace(/,$/, '') + ', ' : ''}<br>${[settings.company_city, settings.company_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ')}` : ''}</div>
            <div>${settings.company_bank_account ? `Cont: ${settings.company_bank_account}` : ''}</div>
            <div>${settings.company_bank_name ? `Banca: ${settings.company_bank_name}` : ''}</div>
            <div style="margin-top: 10px;">Cota TVA: ${invoice.tax_rate || 19}%</div>
        </div>

        <!-- Invoice Title (Center) -->
        <div class="invoice-title-col">
            <div class="invoice-title">FACTURA</div>
            <div class="invoice-subtitle-row">
                 Nr.: ${invoice.invoice_number}<br>
                 Seria: ${invoice.series || 'XXX'}<br>
                 Data: ${new Date(invoice.issue_date).toLocaleDateString()}
            </div>
        </div>

        <!-- Client (Right) -->
        <div class="client-col">
            <div class="section-label">Client:</div>
            <div>${invoice.client_name || 'Client Name'}</div>
            <div>${invoice.client_cif ? `CIF: ${invoice.client_cif}` : ''}</div>
            <div>${invoice.client_reg_no ? `Reg.com.: ${invoice.client_reg_no}` : ''}</div>
            <div>${invoice.client_address || invoice.client_city || invoice.client_country ? `Adresa: ${invoice.client_address ? invoice.client_address.trim().replace(/,$/, '') + ', ' : ''}<br>${[invoice.client_city, invoice.client_country].filter(Boolean).map(s => s.trim().replace(/,$/, '')).join(', ')}` : ''}</div>
            <div>${invoice.client_bank_account ? `Cont: ${invoice.client_bank_account}` : ''}</div>
            <div>${invoice.client_bank_name ? `Banca: ${invoice.client_bank_name}` : ''}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="col-idx">Nr.<br>crt.</th>
            <th class="col-desc">Denumirea produselor sau a serviciilor</th>
            <th class="col-unit">U.M.</th>
            <th class="col-qty">Cant.</th>
            <th class="col-price">Pret unitar<br>(fara TVA)<br>-${invoice.currency}-</th>
            <th class="col-val">Valoare<br>-${invoice.currency}-</th>
            <th class="col-vat">Valoare TVA<br>-${invoice.currency}-</th>
          </tr>
          <tr style="font-size: 8pt; background-color: #f0f8ff;">
            <th class="col-idx">0</th>
            <th class="col-desc">1</th>
            <th class="col-unit">2</th>
            <th class="col-qty">3</th>
            <th class="col-price">4</th>
            <th class="col-val">5(3x4)</th>
            <th class="col-vat">6</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || []).map((item, index) => `
            <tr>
              <td class="col-idx">${index + 1}</td>
              <td class="col-desc">${item.description}</td>
              <td class="col-unit">${item.unit}</td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-price">${item.unit_price.toFixed(2)}</td>
              <td class="col-val">${item.total.toFixed(2)}</td>
              <td class="col-vat">${(item.total * (item.tax_rate / 100)).toFixed(2)}</td>
            </tr>
          `).join('')}
          <!-- Fill with specialized empty rows if we want to mimic the height, 
               but dynamic height is better for web. 
               We can add a minimum height row if needed. -->
            <tr style="height: 200px;">
                <td class="col-idx"></td>
                <td class="col-desc"></td>
                <td class="col-unit"></td>
                <td class="col-qty"></td>
                <td class="col-price"></td>
                <td class="col-val"></td>
                <td class="col-vat"></td>
            </tr>
        </tbody>
      </table>

      <div class="totals-section">
        <div class="footer-left">
            <div class="signature-area">
                <div>Semnatura de primire:</div>
                <div style="margin-top: 30px; border-bottom: 1px dashed ${primaryColor}; width: 200px;"></div>
            </div>
             <div class="signature-area" style="margin-top: 20px;">
                <!-- Delegate info if we had it -->
                <div>Delegat: _________________</div>
                <div style="margin-top:5px;">CNP: ____________________</div>
                <div style="margin-top:5px;">B.I./C.I.: ________________</div>
            </div>
        </div>
        <div class="footer-totals">
            <div class="footer-total-row">
                <div style="width: 80px; padding: 5px; text-align: right; border-right: 1px solid ${tableBorderColor};">
                    ${invoice.subtotal.toFixed(2)}
                </div>
                <div style="width: 80px; padding: 5px; text-align: right;">
                    ${invoice.tax_amount.toFixed(2)}
                </div>
            </div>
            <div class="footer-total-row" style="flex: 1;">
                 <div class="footer-total-label" style="border-right: 1px solid ${tableBorderColor}; font-size: 14pt;">
                    Total
                 </div>
                 <div class="footer-total-val" style="display: flex; align-items: center; justify-content: flex-end; font-size: 12pt; font-weight: bold; border-left: none;">
                    ${invoice.total.toFixed(2)}
                 </div>
            </div>
        </div>
      </div>
    
    </div>
    `;
}
