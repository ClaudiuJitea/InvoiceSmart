// PDF Export Service using jsPDF and html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPdf(element, filename = 'invoice') {
    // Create a clone for rendering
    const clone = element.cloneNode(true);
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.padding = '20mm';
    clone.style.background = 'white';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';

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

        // Calculate dimensions to fit the page
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add image (may need multiple pages for long invoices)
        if (imgHeight <= pdfHeight) {
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        } else {
            // Multi-page handling
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
        }

        // Save the PDF
        pdf.save(`${filename}.pdf`);

        return true;
    } finally {
        // Cleanup
        document.body.removeChild(clone);
    }
}

export default { exportToPdf };
