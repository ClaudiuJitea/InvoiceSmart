// Romanian Receipt (Chitanță) Template - Matching Official Format
import { numberToWordsRo } from '../utils/numberToWordsRo.js';

function getReceiptTheme(templateName = 'modern') {
    const normalized = String(templateName || 'modern')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]/g, '');

    const template = normalized === 'executive' ? 'classic' : normalized;

    if (template === 'creative') {
        return {
            primary: '#2E7D32',
            headerBg: '#E8F5E9',
            bodyBg: '#F1F8E9',
            border: '#2E7D32',
            text: '#1B4332',
            labelBg: '#D9EFD8',
            shellGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)',
            headerGradient: 'linear-gradient(135deg, #F7FCF7 0%, #E8F5E9 100%)',
            footerGradient: 'linear-gradient(180deg, #F7FCF7 0%, #FFFFFF 100%)',
            fontMain: "'Inter', sans-serif",
            fontTitle: "'Playfair Display', Georgia, serif",
        };
    }

    if (template === 'classicblue') {
        return {
            primary: '#21618C',
            headerBg: '#E8F4FC',
            bodyBg: '#F0F8FF',
            border: '#21618C',
            text: '#1C3D5A',
            labelBg: '#DCECF9',
            shellGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)',
            headerGradient: 'linear-gradient(135deg, #F8FCFF 0%, #E8F4FC 100%)',
            footerGradient: 'linear-gradient(180deg, #F8FCFF 0%, #FFFFFF 100%)',
            fontMain: "'Arial', 'Helvetica', sans-serif",
            fontTitle: "'Arial', 'Helvetica', sans-serif",
        };
    }

    if (template === 'classic') {
        return {
            primary: '#1A1D21',
            headerBg: '#FFFFFF',
            bodyBg: '#FFFFFF',
            border: '#1A1D21',
            text: '#1A1D21',
            labelBg: '#F8FAFC',
            shellGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)',
            headerGradient: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
            footerGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)',
            fontMain: "'Georgia', 'Times New Roman', serif",
            fontTitle: "'Playfair Display', Georgia, serif",
        };
    }

    return {
        primary: '#1E3A5F',
        headerBg: '#EEF1F4',
        bodyBg: '#F4F6F8',
        border: '#1E3A5F',
        text: '#1A1D21',
        labelBg: '#E5EEF7',
        shellGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)',
        headerGradient: 'linear-gradient(135deg, #F8FAFC 0%, #EEF1F4 100%)',
        footerGradient: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
        fontMain: "'Inter', sans-serif",
        fontTitle: "'Playfair Display', Georgia, serif",
    };
}

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
    const colors = getReceiptTheme(invoice.template);

    return `
    <div class="receipt-template" style="
        width: 100%;
        max-width: 132mm;
        padding: 3mm 4mm;
        min-height: auto;
        margin: 0 auto;
        box-sizing: border-box; 
        background: ${colors.shellGradient};
        font-family: ${colors.fontMain}; 
        color: ${colors.text};
    ">
        <!-- Main Container with Border -->
        <div style="
            border: 1px solid ${colors.border}; 
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
            <!-- Header Section -->
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                padding: 10px 12px;
                background: ${colors.headerGradient};
                border-bottom: 1px solid ${colors.border};
            ">
                <!-- Company Info (Left) -->
                <div style="font-size: 8pt; line-height: 1.35; max-width: 52%;">
                    <div style="font-weight: bold; font-size: 9pt; color: ${colors.primary}; margin-bottom: 2px;">
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
                        font-size: 20pt; 
                        font-weight: bold; 
                        font-family: ${colors.fontTitle};
                        color: ${colors.primary}; 
                        letter-spacing: 1px;
                        line-height: 1.1;
                    ">CHITANȚĂ <span style="font-size: 11pt;">Nr. ${receipt.number}</span></div>
                    <div style="font-size: 8pt; color: ${colors.primary}; margin-top: 3px;">
                        Data: ${formatDate(receipt.issue_date)} &nbsp; Seria: ${receipt.series}
                    </div>
                </div>
            </div>

            <!-- Body Section (Blue Background) -->
            <div style="
                background: linear-gradient(180deg, ${colors.bodyBg} 0%, ${colors.headerBg} 100%);
                padding: 10px 12px;
            ">
                <!-- Client Name Row -->
                <div style="
                    display: flex; 
                    align-items: center;
                    margin-bottom: 8px;
                    background: white;
                    border: 1px solid ${colors.border};
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <span style="
                        background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                        color: ${colors.primary};
                        padding: 7px 9px;
                        min-width: 88px;
                        font-size: 8pt;
                        border-right: 1px solid ${colors.border};
                    ">Am primit de la:</span>
                    <span style="
                        flex: 1;
                        padding: 7px 9px;
                        font-weight: bold;
                        font-size: 9pt;
                        text-align: center;
                        color: ${colors.primary};
                    ">${invoice.client_name || '-'}</span>
                </div>

                <!-- CIF / Reg Row -->
                <div style="
                    display: flex;
                    gap: 10px;
                    margin-bottom: 8px;
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
                            padding: 7px 9px;
                            min-width: 50px;
                            font-size: 8pt;
                            border-right: 1px solid ${colors.border};
                        ">CIF:</span>
                        <span style="
                            flex: 1;
                            padding: 7px 9px;
                            font-size: 8.5pt;
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
                            padding: 7px 9px;
                            min-width: 80px;
                            font-size: 8pt;
                            border-right: 1px solid ${colors.border};
                        ">Reg. com.:</span>
                        <span style="
                            flex: 1;
                            padding: 7px 9px;
                            font-size: 8.5pt;
                            text-align: center;
                            color: ${colors.primary};
                        ">${invoice.client_reg_no || '-'}</span>
                    </div>
                </div>

                <!-- Address Row -->
                <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    background: white;
                    border: 1px solid ${colors.border};
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <span style="
                        background: linear-gradient(135deg, ${colors.labelBg} 0%, ${colors.headerBg} 100%);
                        color: ${colors.primary};
                        padding: 7px 9px;
                        min-width: 60px;
                        font-size: 8pt;
                        border-right: 1px solid ${colors.border};
                    ">Adresa:</span>
                    <span style="
                        flex: 1;
                        padding: 7px 9px;
                        font-size: 8.5pt;
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
                        padding: 7px 9px;
                        min-width: 70px;
                        font-size: 8pt;
                        border-right: 1px solid ${colors.border};
                    ">Suma de:</span>
                    <span style="
                        padding: 7px 10px;
                        font-weight: bold;
                        font-size: 9pt;
                        color: ${colors.primary};
                        border-right: 1px solid ${colors.border};
                        min-width: 90px;
                        text-align: center;
                    ">${receipt.amount.toFixed(2)} ${receipt.currency}</span>
                    <span style="
                        padding: 7px 9px;
                        font-size: 8pt;
                        color: ${colors.primary};
                        border-right: 1px solid ${colors.border};
                    ">adica</span>
                    <span style="
                        flex: 1;
                        padding: 7px 9px;
                        font-size: 8pt;
                        font-style: italic;
                        color: ${colors.primary};
                    ">${amountText}</span>
                </div>
            </div>

            <!-- Footer (Signature) -->
            <div style="
                padding: 10px 12px 12px;
                background: ${colors.footerGradient};
                border-top: 1px solid ${colors.border};
            ">
                <div style="text-align: right; padding-right: 16px;">
                    <div style="color: ${colors.primary}; font-size: 8pt; margin-bottom: 16px;">Semnatura:</div>
                    <div style="
                        display: inline-block;
                        width: 90px;
                        border-bottom: 1px solid ${colors.primary};
                    "></div>
                </div>
            </div>
        </div>
    </div>
    `;
}
