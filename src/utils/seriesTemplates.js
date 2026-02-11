const DEFAULT_NUMBER_PADDING = 4;
const DEFAULT_INVOICE_TEMPLATE_ID = 'default-invoice';

function toPositiveInteger(value, fallback = 1) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

function generateTemplateId() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultPrefixByType(documentType) {
  const map = {
    invoice: 'INV',
    quote: 'QTE',
    receipt: 'RCP',
    delivery_note: 'DN',
  };
  return map[documentType] || 'DOC';
}

function normalizeTemplate(template = {}, index = 0) {
  const prefix = String(template.prefix || '').trim() || 'INV';
  const separator = template.separator == null ? '-' : String(template.separator);
  const nextNumber = toPositiveInteger(template.next_number, 1);
  const numberPadding = toPositiveInteger(template.number_padding, DEFAULT_NUMBER_PADDING);
  const rawDocumentType = String(template.document_type || 'invoice');
  const documentType = rawDocumentType === 'proforma' ? 'quote' : rawDocumentType;

  return {
    id: String(template.id || `${DEFAULT_INVOICE_TEMPLATE_ID}-${index}`),
    document_type: documentType,
    prefix,
    separator,
    next_number: nextNumber,
    number_padding: numberPadding,
    is_default: Boolean(template.is_default),
  };
}

function parseTemplates(rawTemplates) {
  if (!rawTemplates) return [];

  if (Array.isArray(rawTemplates)) {
    return rawTemplates;
  }

  if (typeof rawTemplates === 'string') {
    try {
      const parsed = JSON.parse(rawTemplates);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  return [];
}

function ensureSingleDefaultPerType(templates) {
  const grouped = new Map();

  templates.forEach((template) => {
    const key = template.document_type;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(template);
  });

  grouped.forEach((group) => {
    const defaultTemplates = group.filter((template) => template.is_default);
    if (defaultTemplates.length === 0) {
      group[0].is_default = true;
      return;
    }

    const keepId = defaultTemplates[0].id;
    group.forEach((template) => {
      template.is_default = template.id === keepId;
    });
  });

  return templates;
}

export function createDefaultInvoiceTemplate(settings = {}) {
  return {
    id: DEFAULT_INVOICE_TEMPLATE_ID,
    document_type: 'invoice',
    prefix: String(settings.invoice_series || 'INV').trim() || 'INV',
    separator: '-',
    next_number: toPositiveInteger(settings.next_invoice_number, 1),
    number_padding: DEFAULT_NUMBER_PADDING,
    is_default: true,
  };
}

function createDefaultTemplateByType(documentType, settings = {}) {
  if (documentType === 'invoice') {
    return createDefaultInvoiceTemplate(settings);
  }

  return {
    id: `default-${documentType}`,
    document_type: documentType,
    prefix: getDefaultPrefixByType(documentType),
    separator: '-',
    next_number: 1,
    number_padding: DEFAULT_NUMBER_PADDING,
    is_default: true,
  };
}

export function normalizeSeriesTemplates(settings = {}) {
  const parsed = parseTemplates(settings.document_series_templates);
  let templates = parsed.map((template, index) => normalizeTemplate(template, index));

  const hasInvoiceTemplate = templates.some((template) => template.document_type === 'invoice');
  if (!hasInvoiceTemplate) {
    templates.unshift(createDefaultInvoiceTemplate(settings));
  }

  const hasDeliveryNoteTemplate = templates.some((template) => template.document_type === 'delivery_note');
  if (!hasDeliveryNoteTemplate) {
    templates.push(createDefaultTemplateByType('delivery_note', settings));
  }

  if (templates.length === 0) {
    templates = [createDefaultInvoiceTemplate(settings)];
  }

  return ensureSingleDefaultPerType(templates);
}

export function getSeriesTemplatesForDocument(templates, documentType = 'invoice') {
  if (!Array.isArray(templates)) return [];
  return templates.filter((template) => template.document_type === documentType);
}

export function getDefaultSeriesTemplate(templates, documentType = 'invoice') {
  const filtered = getSeriesTemplatesForDocument(templates, documentType);
  if (filtered.length === 0) return null;
  return filtered.find((template) => template.is_default) || filtered[0];
}

export function formatSeriesNumber(template, number = null) {
  if (!template) return '';
  const nextNumber = number == null ? template.next_number : number;
  const padded = String(toPositiveInteger(nextNumber, 1)).padStart(
    toPositiveInteger(template.number_padding, DEFAULT_NUMBER_PADDING),
    '0',
  );
  return `${template.prefix}${template.separator}${padded}`;
}

export function syncLegacyInvoiceSeries(settings, templates) {
  const defaultInvoice = getDefaultSeriesTemplate(templates, 'invoice');
  if (!defaultInvoice) return settings;

  return {
    ...settings,
    invoice_series: defaultInvoice.prefix,
    next_invoice_number: defaultInvoice.next_number,
  };
}

export function createSeriesTemplate({
  documentType = 'invoice',
  prefix = '',
  separator = '-',
  startNumber = 1,
  numberPadding = DEFAULT_NUMBER_PADDING,
  isDefault = false,
} = {}) {
  return {
    id: generateTemplateId(),
    document_type: documentType,
    prefix: String(prefix || '').trim().toUpperCase(),
    separator: separator == null ? '-' : String(separator),
    next_number: toPositiveInteger(startNumber, 1),
    number_padding: toPositiveInteger(numberPadding, DEFAULT_NUMBER_PADDING),
    is_default: Boolean(isDefault),
  };
}
