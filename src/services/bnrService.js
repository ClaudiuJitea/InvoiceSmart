// Service to fetch exchange rates from BNR (National Bank of Romania)

// We use CORS proxies because BNR does not support CORS for browser requests.
// Different proxies expose different URL formats and may fail intermittently.
const PROXY_BUILDERS = [
    (targetUrl) => `https://corsproxy.io/?${targetUrl}`,
    (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
];
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
                if (Number.isNaN(date.getTime())) {
                    throw new Error(`Invalid date: ${dateStr}`);
                }
                const year = date.getFullYear();
                url = BNR_YEAR_URL(year);
                // We only care about YYYY-MM-DD
                targetDate = dateStr;
            }

            const text = await this.fetchXmlText(url);
            return this.parseXml(text, currency, targetDate);

        } catch (error) {
            // Fallback for current year if yearly file is unavailable early in January.
            if (dateStr) {
                const requestedYear = new Date(dateStr).getFullYear();
                if (requestedYear === new Date().getFullYear()) {
                    try {
                        console.warn('Yearly file unavailable, trying current rates...');
                        const fallbackText = await this.fetchXmlText(BNR_CURRENT_URL);
                        return this.parseXml(fallbackText, currency, dateStr);
                    } catch (fallbackError) {
                        console.error('BNR fallback error:', fallbackError);
                    }
                }
            }
            console.error('BNR Service Error:', error);
            throw error;
        }
    },

    async fetchXmlText(targetUrl) {
        const errors = [];

        for (const buildProxyUrl of PROXY_BUILDERS) {
            const proxyUrl = buildProxyUrl(targetUrl);
            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) {
                    errors.push(`${proxyUrl} -> HTTP ${response.status}`);
                    continue;
                }

                const rawText = await response.text();
                const xmlText = this.extractXml(rawText);
                if (xmlText) return xmlText;

                errors.push(`${proxyUrl} -> invalid XML payload`);
            } catch (error) {
                errors.push(`${proxyUrl} -> ${error.message}`);
            }
        }

        throw new Error(`Failed to fetch BNR rates. Attempts: ${errors.join(' | ')}`);
    },

    extractXml(rawText) {
        if (!rawText) return null;

        const text = rawText.trim();
        if (!text) return null;

        if (text.startsWith('<?xml') || text.includes('<DataSet')) {
            return text;
        }

        // Some proxies return JSON wrappers, e.g. {"contents":"<?xml ..."}
        try {
            const parsed = JSON.parse(text);
            const wrapped = parsed?.contents || parsed?.data || parsed?.response;
            if (typeof wrapped === 'string') {
                const normalized = wrapped.trim();
                if (normalized.startsWith('<?xml') || normalized.includes('<DataSet')) {
                    return normalized;
                }
            }
        } catch (_) {
            // Not JSON.
        }

        // Some proxies HTML-escape XML in body/pre tags.
        if (text.includes('&lt;') && text.includes('&gt;')) {
            const decoded = text
                .replaceAll('&lt;', '<')
                .replaceAll('&gt;', '>')
                .replaceAll('&amp;', '&')
                .trim();
            if (decoded.startsWith('<?xml') || decoded.includes('<DataSet')) {
                return decoded;
            }
        }

        return null;
    },

    parseXml(xmlText, currency, targetDate) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
        if (parserError) {
            throw new Error('Failed to parse BNR XML response');
        }

        const cubes = Array.from(xmlDoc.getElementsByTagNameNS('*', 'Cube'));

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

        const rates = selectedCube.getElementsByTagNameNS('*', 'Rate');
        for (let i = 0; i < rates.length; i++) {
            if (rates[i].getAttribute('currency') === currency) {
                return parseFloat(rates[i].textContent);
            }
        }

        throw new Error(`Rate for ${currency} not found on ${selectedCube.getAttribute('date')}`);
    }
};
