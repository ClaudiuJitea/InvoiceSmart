// Template Registry
import { renderModernTemplate } from './modern.js';
import { renderClassicTemplate } from './classic.js';
import { renderClassicBlueTemplate } from './classicBlue.js';
import { renderCreativeTemplate } from './creative.js';

export const templates = {
    modern: {
        id: 'modern',
        render: renderModernTemplate,
    },
    classic: {
        id: 'classic',
        render: renderClassicTemplate,
    },
    classicBlue: {
        id: 'classicBlue',
        render: renderClassicBlueTemplate,
    },
    creative: {
        id: 'creative',
        render: renderCreativeTemplate,
    },
};

export function renderTemplate(templateId, invoice, settings = null) {
    const template = templates[templateId] || templates.modern;
    return template.render({
        ...(invoice || {}),
        settings: settings || invoice?.settings || {},
    });
}

export default templates;
