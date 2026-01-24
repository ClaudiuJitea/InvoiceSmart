// Service to fetch exchange rates from BNR (National Bank of Romania)

// We use a CORS proxy because BNR does not support CORS for browser requests
const PROXY_URL = 'https://corsproxy.io/?';
const BNR_CURRENT_URL = 'https://www.bnr.ro/nbrfxrates.xml';
const BNR_YEAR_URL = (year) => `https://www.bnr.ro/files/xml/years/nbrfxrates${year}.xml`;

export const bnrService = {
    async getExchangeRate(currency = 'EUR', dateStr = null) {
        if (currency === 'RON') return 1;
        try {
            let url = BNR_CURRENT_URL;
            let targetDate = null;

            if (dateStr) {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                url = BNR_YEAR_URL(year);
                // We only care about YYYY-MM-DD
                targetDate = dateStr;
            }

            const response = await fetch(PROXY_URL + url);
            if (!response.ok) {
                // Fallback for current year if file doesn't exist yet (very start of year)
                if (dateStr && new Date(dateStr).getFullYear() === new Date().getFullYear()) {
                    console.warn('Yearly file not found, trying current rates...');
                    const fallbackResponse = await fetch(PROXY_URL + BNR_CURRENT_URL);
                    if (!fallbackResponse.ok) throw new Error('Failed to fetch BNR rates');
                    return this.parseXml(await fallbackResponse.text(), currency, targetDate);
                }
                throw new Error('Failed to fetch BNR rates');
            }

            const text = await response.text();
            return this.parseXml(text, currency, targetDate);

        } catch (error) {
            console.error('BNR Service Error:', error);
            throw error;
        }
    },

    parseXml(xmlText, currency, targetDate) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        const cubes = Array.from(xmlDoc.getElementsByTagName('Cube'));

        // Filter cubes that have a date attribute
        const dateCubes = cubes.filter(c => c.getAttribute('date'));

        if (dateCubes.length === 0) throw new Error('No exchange rate data found');

        let selectedCube = null;

        if (targetDate) {
            // Sort cubes descending by date just to be safe (XML usually is, but let's ensure)
            dateCubes.sort((a, b) => new Date(b.getAttribute('date')) - new Date(a.getAttribute('date')));

            // Find the first cube where date <= targetDate
            // e.g. Target: Sunday -> Find Friday
            const targetTime = new Date(targetDate).getTime();

            selectedCube = dateCubes.find(c => {
                const cubeDate = new Date(c.getAttribute('date')).getTime();
                return cubeDate <= targetTime;
            });

            if (!selectedCube) {
                // If target date is older than oldest entry in this file?
                // Just take the oldest
                selectedCube = dateCubes[dateCubes.length - 1];
            }
        } else {
            // No date specified, use the very first one (usually latest in nbrfxrates.xml)
            selectedCube = dateCubes[0];
        }

        const rates = selectedCube.getElementsByTagName('Rate');
        for (let i = 0; i < rates.length; i++) {
            if (rates[i].getAttribute('currency') === currency) {
                return parseFloat(rates[i].textContent);
            }
        }

        throw new Error(`Rate for ${currency} not found on ${selectedCube.getAttribute('date')}`);
    }
};
