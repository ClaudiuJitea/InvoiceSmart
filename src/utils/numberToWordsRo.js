
/**
 * Converts a number to Romanian words
 * simplified version for common invoice amounts
 */
export function numberToWordsRo(number) {
    if (number === 0) return 'zero';

    const units = ['', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă'];
    const tens = ['', 'zece', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'];
    const teens = ['zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece'];

    // Helper for groups of 3 digits
    function convertGroup(n) {
        let str = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) {
            if (h === 1) str += 'o sută ';
            else if (h === 2) str += 'două sute ';
            else str += units[h] + ' sute ';
        }

        if (t > 0) {
            if (t === 1) {
                str += teens[u] + ' ';
            } else {
                str += tens[t] + ' ';
                if (u > 0) str += 'și ' + units[u] + ' ';
            }
        } else if (u > 0) {
            str += units[u] + ' ';
        }
        return str;
    }

    // Split into integer and decimals
    const parts = number.toFixed(2).split('.');
    let integerPart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);

    let words = '';

    if (integerPart === 0) words = 'zero ';
    else {
        // Billions
        const billions = Math.floor(integerPart / 1000000000);
        integerPart %= 1000000000;
        if (billions > 0) {
            words += convertGroup(billions) + (billions === 1 ? 'miliard ' : 'miliarde ');
        }

        // Millions
        const millions = Math.floor(integerPart / 1000000);
        integerPart %= 1000000;
        if (millions > 0) {
            words += convertGroup(millions) + (millions === 1 ? 'milion ' : 'milioane ');
        }

        // Thousands
        const thousands = Math.floor(integerPart / 1000);
        integerPart %= 1000;
        if (thousands > 0) {
            if (thousands === 1) words += 'o mie ';
            else if (thousands === 2) words += 'două mii ';
            else words += convertGroup(thousands) + 'mii ';
        }

        // Hundreds
        if (integerPart > 0) {
            words += convertGroup(integerPart);
        }
    }

    // Currency (RON assumed or passed?) 
    // Usually "lei" for RON. The image shows just the number text "douamiicincisutezece".
    // It doesn't explicitly say "lei". But usually receipts say "suma de X lei".
    // The image says "Suma de: 2510.00 RON adica douamiicincisutezece" -> It seems to just be the number.

    // Clean up spaces
    words = words.trim();

    // Decimals
    if (decimalPart > 0) {
        words += ` și ${decimalPart} bani`;
    }

    return words;
}
