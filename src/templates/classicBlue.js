// Classic Blue Invoice Template - Professional Blue Style
export function renderClassicBlueTemplate(invoice) {
    const settings = invoice?.settings || {};
    const isDeliveryNote = invoice.document_type === 'delivery_note';
    const documentTitle = isDeliveryNote
        ? `
            <span class="title-line title-line-primary">AVIZ DE INSOTIRE A MARFII</span>
            <span class="title-line title-line-secondary">DELIVERY NOTE</span>
        `
        : 'FACTURA';
    const items = invoice.items || [];
    // Classic Blue color palette
    const colors = {
        primary: '#21618C',
        secondary: '#3498DB',
        border: '#21618C',
        bgLight: '#f0f8ff'
    };
    const primaryCurrency = invoice.currency || settings.default_currency || 'EUR';
    const secondaryCurrency = invoice.secondary_currency || settings.secondary_currency || 'RON';
    const totalSecondary = Number(invoice.total_secondary);
    const hasSecondaryTotal = Number.isFinite(totalSecondary) && totalSecondary > 0 && primaryCurrency !== secondaryCurrency;
    const formatAmount = (value) => Number(value || 0).toFixed(2);
    const minVisibleRows = 0;
    const fillerHeight = Math.max(0, (minVisibleRows - items.length) * 30);

    return `
    <div class="invoice-template invoice-classic-blue">
      <style>
        .invoice-classic-blue {
          font-family: 'Arial', 'Helvetica', sans-serif;
          color: ${colors.primary};
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
            font-size: 20pt;
            font-weight: bold;
            text-transform: uppercase;
            color: ${colors.primary};
            margin-bottom: 8px;
            margin-top: 0;
            line-height: 1.15;
            letter-spacing: 0.6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }
        .invoice-classic-blue .invoice-title .title-line {
            display: block;
            white-space: nowrap;
        }
        .invoice-classic-blue .invoice-title .title-line-primary {
            font-size: 11.5pt;
            letter-spacing: 1.2px;
            font-weight: 700;
        }
        .invoice-classic-blue .invoice-title .title-line-secondary {
            font-size: 17pt;
            letter-spacing: 1.8px;
            font-weight: 700;
        }
        .invoice-classic-blue .invoice-subtitle-row {
            font-size: 10pt;
            margin-bottom: 20px;
            line-height: 1.4;
        }
        .invoice-classic-blue .currency-line {
            margin-top: 6px;
            font-size: 8.5pt;
            font-weight: 600;
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
            border: 2px solid ${colors.border};
        }
        .invoice-classic-blue .items-table th, 
        .invoice-classic-blue .items-table td {
            border: 1px solid ${colors.border};
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
        .invoice-classic-blue .items-table .filler-row td {
            height: ${fillerHeight}px;
            padding: 0;
        }
        @media print {
            .invoice-classic-blue .items-table .filler-row {
                display: none;
            }
        }
        
        /* Footer/Totals */
        .invoice-classic-blue .footer-row {
            display: flex; /* Not really flex in the image, strictly part of table usually, but we can simulate */
            /* Actually in the image the totals are part of the table structure at the bottom right usually, 
               but here we can just append a table or keep it separate. 
               The image shows the columns extending down. */
        }
        .invoice-classic-blue .totals-section {
            display: flex;
            border: 2px solid ${colors.border};
            border-top: none;
        }
        .invoice-classic-blue .footer-left {
            flex: 1;
            padding: 10px;
            border-right: 1px solid ${colors.border};
        }
        .invoice-classic-blue .footer-totals {
            width: 160px; /* Adjust to match last 2 columns approx */
            display: flex;
            flex-direction: column;
        }
        .invoice-classic-blue .footer-total-row {
            display: flex;
            border-bottom: 1px solid ${colors.border};
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
            border-left: 1px solid ${colors.border};
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
            <div class="invoice-title">${documentTitle}</div>
            <div class="invoice-subtitle-row">
                 Nr.: ${invoice.invoice_number}<br>
                 Seria: ${invoice.series || 'XXX'}<br>
                 Data: ${new Date(invoice.issue_date).toLocaleDateString()}
                 <div class="currency-line">Moneda: ${primaryCurrency}</div>
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
            <th class="col-price">Pret unitar<br>(fara TVA)<br>-${primaryCurrency}-</th>
            <th class="col-val">Valoare<br>-${primaryCurrency}-</th>
            <th class="col-vat">Valoare TVA<br>-${primaryCurrency}-</th>
          </tr>
          <tr style="font-size: 8pt; background-color: ${colors.bgLight};">
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
          ${items.map((item, index) => `
            <tr>
              <td class="col-idx">${index + 1}</td>
              <td class="col-desc">${item.description}</td>
              <td class="col-unit">${item.unit}</td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-price">${formatAmount(item.unit_price)}</td>
              <td class="col-val">${formatAmount(item.total)}</td>
              <td class="col-vat">${formatAmount(item.total * ((item.tax_rate ?? invoice.tax_rate ?? 0) / 100))}</td>
            </tr>
          `).join('')}
          ${fillerHeight > 0 ? `
            <tr class="filler-row">
                <td class="col-idx"></td>
                <td class="col-desc"></td>
                <td class="col-unit"></td>
                <td class="col-qty"></td>
                <td class="col-price"></td>
                <td class="col-val"></td>
                <td class="col-vat"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="footer-left">
            <div class="signature-area">
                <div>Semnatura de primire:</div>
                <div style="margin-top: 30px; border-bottom: 1px dashed ${colors.primary}; width: 200px;"></div>
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
                <div style="width: 80px; padding: 5px; text-align: right; border-right: 1px solid ${colors.border};">
                    ${formatAmount(invoice.subtotal)}
                </div>
                <div style="width: 80px; padding: 5px; text-align: right;">
                    ${formatAmount(invoice.tax_amount)}
                </div>
            </div>
            <div class="footer-total-row" style="flex: 1;">
                 <div class="footer-total-label" style="border-right: 1px solid ${colors.border}; font-size: 14pt;">
                    Total (${primaryCurrency})
                 </div>
                 <div class="footer-total-val" style="display: flex; align-items: center; justify-content: flex-end; font-size: 12pt; font-weight: bold; border-left: none;">
                    ${formatAmount(invoice.total)}
                 </div>
            </div>
            ${hasSecondaryTotal ? `
            <div class="footer-total-row">
                <div style="width: 100%; padding: 5px 8px; text-align: right;">
                    Total (${secondaryCurrency}): <strong>${formatAmount(totalSecondary)}</strong>
                    ${invoice.exchange_rate ? `<br><span style="font-size: 8pt;">Curs: 1 ${primaryCurrency} = ${Number(invoice.exchange_rate).toFixed(4)} ${secondaryCurrency}</span>` : ''}
                </div>
            </div>
            ` : ''}
        </div>
      </div>
    
    </div>
    `;
}
