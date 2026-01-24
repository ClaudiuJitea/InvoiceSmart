// Settings Service - API version

export const settingsService = {
    // Get all settings
    async get() {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
    },

    // Update settings
    async update(settings) {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Failed to update settings');
        return response.json();
    },

    // Update single setting (Client-side helper, calls update)
    async updateOne(key, value) {
        // First get current settings
        const current = await this.get();
        current[key] = value;
        return this.update(current);
    },

    // Increment invoice number
    async incrementInvoiceNumber() {
        const response = await fetch('/api/settings/increment-invoice', {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to increment invoice number');
        return response.json();
    },
};

export default settingsService;
