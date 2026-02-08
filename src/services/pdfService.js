// PDF Export Service using jsPDF and html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function createPdfFromElement(element) {
    // Create a clone for rendering
    const clone = element.cloneNode(true);
    clone.style.width = '210mm';
    clone.style.minHeight = '0';
    clone.style.padding = '0';
    clone.style.boxSizing = 'border-box';
    clone.style.background = 'white';
    clone.style.position = 'fixed';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.transform = 'translateX(-200vw)';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '-1';

    document.body.appendChild(clone);

    try {
        // Render to canvas
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // A4 width in px at 96dpi
            windowHeight: 1123, // A4 height in px at 96dpi
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 16; // mm
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = pdfHeight - margin * 2;

        // Calculate dimensions to fit the page
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const overflowRatio = imgHeight / contentHeight;

        // Add image (may need multiple pages for long invoices)
        // Keep near-A4 invoices on one page to avoid orphaned totals spilling to page 2.
        if (imgHeight <= contentHeight) {
            pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        } else if (overflowRatio <= 1.2) {
            const fittedWidth = (contentHeight * canvas.width) / canvas.height;
            const offsetX = (pdfWidth - fittedWidth) / 2;
            pdf.addImage(imgData, 'PNG', offsetX, margin, fittedWidth, contentHeight);
        } else {
            // Multi-page handling
            let heightLeft = imgHeight;
            let position = margin;

            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= contentHeight;

            while (heightLeft > 0) {
                position = margin - (imgHeight - heightLeft);
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= contentHeight;
            }
        }

        return pdf;
    } finally {
        // Cleanup
        document.body.removeChild(clone);
    }
}

export async function exportToPdfBlob(element) {
    const pdf = await createPdfFromElement(element);
    return pdf.output('blob');
}

export async function exportToPdf(element, filename = 'invoice') {
    const pdf = await createPdfFromElement(element);
    pdf.save(`${filename}.pdf`);
    return true;
}

export default { exportToPdf, exportToPdfBlob };
