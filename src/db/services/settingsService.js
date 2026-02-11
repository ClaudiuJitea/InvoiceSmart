// Settings Service - API version
import {
    formatSeriesNumber,
    getDefaultSeriesTemplate,
    normalizeSeriesTemplates,
    syncLegacyInvoiceSeries,
} from '../../utils/seriesTemplates.js';

export const settingsService = {
    // Get all settings
    async get() {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const settings = await response.json();
        const templates = normalizeSeriesTemplates(settings || {});
        return syncLegacyInvoiceSeries({
            ...settings,
            document_series_templates: templates,
        }, templates);
    },

    // Update settings
    async update(settings) {
        const templates = normalizeSeriesTemplates(settings || {});
        const merged = syncLegacyInvoiceSeries({
            ...settings,
            document_series_templates: templates,
        }, templates);

        const payload = {
            ...merged,
            document_series_templates: JSON.stringify(templates),
        };

        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
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
        const settings = await this.get();
        const defaultInvoiceSeries = getDefaultSeriesTemplate(settings.document_series_templates, 'invoice');
        return this.consumeSeriesTemplateNumber(defaultInvoiceSeries?.id || null);
    },

    async consumeSeriesTemplateNumber(templateId) {
        const settings = await this.get();
        const templates = normalizeSeriesTemplates(settings);

        const fallbackTemplate = getDefaultSeriesTemplate(templates, 'invoice');
        const targetTemplateId = templateId || fallbackTemplate?.id;
        const targetTemplate = templates.find((template) => template.id === targetTemplateId);

        if (!targetTemplate) {
            throw new Error('Series template not found');
        }

        const usedNumber = targetTemplate.next_number;
        targetTemplate.next_number += 1;

        await this.update({
            ...settings,
            document_series_templates: templates,
        });

        return {
            templateId: targetTemplate.id,
            series: targetTemplate.prefix,
            number: usedNumber,
            formatted: formatSeriesNumber(targetTemplate, usedNumber),
        };
    },
};

export default settingsService;
