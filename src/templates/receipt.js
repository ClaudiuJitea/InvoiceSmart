// Romanian Receipt (Chitanță) Template - Matching Official Format
import { numberToWordsRo } from '../utils/numberToWordsRo.js';

export function renderReceiptTemplate(receipt, invoice, settings) {
    // Basic validation
    if (!receipt || !invoice || !settings) {
        return '<div class="error">Missing data for receipt generation</div>';
    }

    // Format helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ro-RO');
    };

    const amountText = numberToWordsRo(receipt.amount);

    // Colors matching the reference image
    const colors = {
        primary: '#1a5a8c',      // Deep blue for text
        headerBg: '#d4e5f7',     // Light blue header background
        bodyBg: '#b8d4ed',       // Medium blue body background
        border: '#1a5a8c',       // Blue border
        text: '#1a5a8c',         // Blue text
        labelBg: '#a8c8e0',      // Label background
    };

    return `
    <div class="receipt-template" style="
        width: 210mm; 
        min-height: 148mm; 
        padding: 15mm 20mm;
        box-sizing: border-box; 
        background: linear-gradient(180deg, #e8f4fc 0%, #d0e8f5 100%);
        font-family: 'Arial', sans-serif; 
        color: ${colors.text};
    ">
        <!-- Main Container with Border -->
        <div style="
            border: 2px solid ${colors.border}; 
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
            <!-- Header Section -->
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                padding: 15px 20px;
                background: linear-gradient(135deg, #f8fcff 0%, #e8f4fc 100%);
                border-bottom: 1px solid ${colors.border};
            ">
                <!-- Company Info (Left) -->
                <div style="font-size: 9pt; line-height: 1.5; max-width: 55%;">
                    <div style="font-weight: bold; font-size: 13pt; color: ${colors.primary}; margin-bottom: 3px;">
                        ${settings.company_name || 'Nume Companie'}
                    </div>
                    <div style="color: ${colors.primary};">CIF: ${settings.company_cif || '-'}</div>
                    <div style="color: ${colors.primary};">Reg.com.: ${settings.company_reg_no || '-'}</div>
                    <div style="color: ${colors.primary};">Adresa: ${settings.company_address || '-'}</div>
                    ${settings.company_capital ? `<div style="color: ${colors.primary};">Capital: ${settings.company_capital}</div>` : ''}
                </div>

                <!-- Receipt Title (Right) -->
                <div style="text-align: right;">
                    <div style="
                        font-size: 28pt; 
                        font-weight: bold; 
                        color: ${colors.primary}; 
                        letter-spacing: 1px;
                        line-height: 1.1;
                    ">CHITANȚĂ <span style="font-size: 16pt;">Nr. ${receipt.number}</span></div>
                    <div style="font-size: 10pt; color: ${colors.primary}; margin-top: 5px;">
                        Data: ${formatDate(receipt.issue_date)} &nbsp; Seria: ${receipt.series}
                    </div>
                </div>
            </div>

            <!-- Body Section (Blue Background) -->
            <div style="
                background: linear-gradient(180deg, ${colors.bodyBg} 0%, ${colors.headerBg} 100%);
                padding: 20px;
            ">
                <!-- Client Name Row -->
                <div style="
                    display: flex; 
                    align-items: center;
                    margin-bottom: 12px;
                    background: white;
                    border: 1px solid ${colors.border};
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <span style="
                        background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                        color: ${colors.primary};
                        padding: 10px 15px;
                        min-width: 110px;
                        font-size: 10pt;
                        border-right: 1px solid ${colors.border};
                    ">Am primit de la:</span>
                    <span style="
                        flex: 1;
                        padding: 10px 15px;
                        font-weight: bold;
                        font-size: 11pt;
                        text-align: center;
                        color: ${colors.primary};
                    ">${invoice.client_name || '-'}</span>
                </div>

                <!-- CIF / Reg Row -->
                <div style="
                    display: flex;
                    gap: 15px;
                    margin-bottom: 12px;
                ">
                    <div style="
                        flex: 1;
                        display: flex;
                        align-items: center;
                        background: white;
                        border: 1px solid ${colors.border};
                        border-radius: 3px;
                        overflow: hidden;
                    ">
                        <span style="
                            background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                            color: ${colors.primary};
                            padding: 10px 15px;
                            min-width: 50px;
                            font-size: 10pt;
                            border-right: 1px solid ${colors.border};
                        ">CIF:</span>
                        <span style="
                            flex: 1;
                            padding: 10px 15px;
                            font-size: 10pt;
                            text-align: center;
                            color: ${colors.primary};
                        ">${invoice.client_cif || '-'}</span>
                    </div>
                    <div style="
                        flex: 1;
                        display: flex;
                        align-items: center;
                        background: white;
                        border: 1px solid ${colors.border};
                        border-radius: 3px;
                        overflow: hidden;
                    ">
                        <span style="
                            background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                            color: ${colors.primary};
                            padding: 10px 15px;
                            min-width: 80px;
                            font-size: 10pt;
                            border-right: 1px solid ${colors.border};
                        ">Reg. com.:</span>
                        <span style="
                            flex: 1;
                            padding: 10px 15px;
                            font-size: 10pt;
                            text-align: center;
                            color: ${colors.primary};
                        ">${invoice.client_reg_no || '-'}</span>
                    </div>
                </div>

                <!-- Address Row -->
                <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                    background: white;
                    border: 1px solid ${colors.border};
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <span style="
                        background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                        color: ${colors.primary};
                        padding: 10px 15px;
                        min-width: 60px;
                        font-size: 10pt;
                        border-right: 1px solid ${colors.border};
                    ">Adresa:</span>
                    <span style="
                        flex: 1;
                        padding: 10px 15px;
                        font-size: 10pt;
                        text-align: center;
                        color: ${colors.primary};
                    ">${invoice.client_address || '-'}</span>
                </div>

                <!-- Amount Row -->
                <div style="
                    display: flex;
                    align-items: center;
                    background: white;
                    border: 1px solid ${colors.border};
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <span style="
                        background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                        color: ${colors.primary};
                        padding: 10px 15px;
                        min-width: 70px;
                        font-size: 10pt;
                        border-right: 1px solid ${colors.border};
                    ">Suma de:</span>
                    <span style="
                        padding: 10px 20px;
                        font-weight: bold;
                        font-size: 12pt;
                        color: ${colors.primary};
                        border-right: 1px solid ${colors.border};
                        min-width: 120px;
                        text-align: center;
                    ">${receipt.amount.toFixed(2)} ${receipt.currency}</span>
                    <span style="
                        padding: 10px 15px;
                        font-size: 10pt;
                        color: ${colors.primary};
                        border-right: 1px solid ${colors.border};
                    ">adica</span>
                    <span style="
                        flex: 1;
                        padding: 10px 15px;
                        font-size: 10pt;
                        font-style: italic;
                        color: ${colors.primary};
                    ">${amountText}</span>
                </div>
            </div>

            <!-- Footer (Signature) -->
            <div style="
                padding: 15px 20px 25px;
                background: linear-gradient(180deg, #f0f8ff 0%, #ffffff 100%);
                border-top: 1px solid ${colors.border};
            ">
                <div style="text-align: right; padding-right: 30px;">
                    <div style="color: ${colors.primary}; font-size: 10pt; margin-bottom: 35px;">Semnatura:</div>
                    <div style="
                        display: inline-block;
                        width: 150px;
                        border-bottom: 1px solid ${colors.primary};
                    "></div>
                </div>
            </div>
        </div>
    </div>
    `;
}
