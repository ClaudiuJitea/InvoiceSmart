import { loadAiConfig } from '../aiConfig.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const MAX_DATA_URL_SIZE = 18 * 1024 * 1024;

const COMPANY_FIELD_KEYS = [
  'company_name',
  'company_cif',
  'company_reg_no',
  'company_address',
  'company_city',
  'company_country',
  'company_email',
  'company_phone',
  'company_bank_account',
  'company_swift',
  'company_bank_name',
];

const CLIENT_FIELD_KEYS = [
  'name',
  'cif',
  'reg_no',
  'address',
  'city',
  'country',
  'email',
  'phone',
  'bank_account',
  'bank_name',
  'notes',
];

const INVOICE_FIELD_KEYS = [
  'invoice_number',
  'series',
  'issue_date',
  'due_date',
  'currency',
  'secondary_currency',
  'exchange_rate',
  'tax_rate',
  'payment_method',
  'notes',
];

function assertAiEnabled(config) {
  if (!config.enabled) {
    throw new Error('AI document extraction is disabled in settings');
  }

  if (!config.openrouter?.apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }
}

function sanitizeString(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

function sanitizeWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];
  return warnings.map((warning) => sanitizeString(warning)).filter(Boolean).slice(0, 8);
}

function sanitizeConfidence(value, hasValue = false) {
  const normalized = sanitizeString(value).toLowerCase();
  if (['high', 'medium', 'low'].includes(normalized)) return normalized;
  return hasValue ? 'medium' : 'low';
}

function normalizeFieldReview(fields, keys) {
  const review = {};
  for (const key of keys) {
    const raw = fields?.[key];
    const isObject = raw && typeof raw === 'object' && !Array.isArray(raw);
    const value = sanitizeString(isObject ? raw.value : raw);

    review[key] = {
      value,
      confidence: sanitizeConfidence(isObject ? raw.confidence : '', Boolean(value)),
      note: sanitizeString(isObject ? raw.note : ''),
    };
  }
  return review;
}

function normalizeExtractedFields(fieldReview, keys) {
  const normalized = {};
  for (const key of keys) {
    normalized[key] = sanitizeString(fieldReview?.[key]?.value ?? '');
  }
  return normalized;
}

function sanitizeNumber(value, fallback = null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const normalized = sanitizeString(value)
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '');

  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeInvoiceItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const description = sanitizeString(item?.description);
      const unit = sanitizeString(item?.unit) || 'pcs';
      const quantity = sanitizeNumber(item?.quantity, description ? 1 : 0);
      const unitPrice = sanitizeNumber(item?.unit_price, 0);
      const taxRate = sanitizeNumber(item?.tax_rate, 0);
      const note = sanitizeString(item?.note);
      const confidence = sanitizeConfidence(item?.confidence, Boolean(description));

      if (!description) {
        return null;
      }

      return {
        description,
        unit,
        quantity: quantity == null ? 0 : quantity,
        unit_price: unitPrice == null ? 0 : unitPrice,
        tax_rate: taxRate == null ? 0 : taxRate,
        confidence,
        note,
      };
    })
    .filter(Boolean)
    .slice(0, 100);
}

function getTargetConfig(target) {
  if (target === 'company') {
    return {
      name: 'company_details',
      keys: COMPANY_FIELD_KEYS,
      prompt: [
        'Extract the business identity, contact details, and bank details from the uploaded document.',
        'The document may be a scanned PDF, invoice, registration certificate, or bank document.',
        'Return only JSON with this shape:',
        '{"fields":{"company_name":{"value":"","confidence":"low","note":""},"company_cif":{"value":"","confidence":"low","note":""},"company_reg_no":{"value":"","confidence":"low","note":""},"company_address":{"value":"","confidence":"low","note":""},"company_city":{"value":"","confidence":"low","note":""},"company_country":{"value":"","confidence":"low","note":""},"company_email":{"value":"","confidence":"low","note":""},"company_phone":{"value":"","confidence":"low","note":""},"company_bank_account":{"value":"","confidence":"low","note":""},"company_swift":{"value":"","confidence":"low","note":""},"company_bank_name":{"value":"","confidence":"low","note":""}},"warnings":[]}',
        'Rules:',
        '- Use empty strings when a field is missing or unclear.',
        '- Do not invent values.',
        '- Put the full street address into company_address.',
        '- Extract city and country separately when possible.',
        '- Preserve original capitalization where it is clear.',
        '- confidence must be one of: low, medium, high.',
        '- note should briefly explain uncertainty or formatting concerns when needed.',
      ].join('\n'),
    };
  }

  if (target === 'invoice') {
    return {
      name: 'invoice_document',
      keys: INVOICE_FIELD_KEYS,
      prompt: [
        'Extract the full invoice data from the uploaded document.',
        'The document may be a digital PDF, scanned PDF, photo, screenshot, or mobile scan of an invoice.',
        'Return only JSON with this shape:',
        '{"fields":{"invoice_number":{"value":"","confidence":"low","note":""},"series":{"value":"","confidence":"low","note":""},"issue_date":{"value":"","confidence":"low","note":""},"due_date":{"value":"","confidence":"low","note":""},"currency":{"value":"","confidence":"low","note":""},"secondary_currency":{"value":"","confidence":"low","note":""},"exchange_rate":{"value":"","confidence":"low","note":""},"tax_rate":{"value":"","confidence":"low","note":""},"payment_method":{"value":"","confidence":"low","note":""},"notes":{"value":"","confidence":"low","note":""}},"client":{"name":{"value":"","confidence":"low","note":""},"cif":{"value":"","confidence":"low","note":""},"reg_no":{"value":"","confidence":"low","note":""},"address":{"value":"","confidence":"low","note":""},"city":{"value":"","confidence":"low","note":""},"country":{"value":"","confidence":"low","note":""},"email":{"value":"","confidence":"low","note":""},"phone":{"value":"","confidence":"low","note":""},"bank_account":{"value":"","confidence":"low","note":""},"bank_name":{"value":"","confidence":"low","note":""},"notes":{"value":"","confidence":"low","note":""}},"items":[{"description":"","unit":"","quantity":"","unit_price":"","tax_rate":"","confidence":"low","note":""}],"warnings":[]}',
        'Rules:',
        '- Use empty strings when a field is missing or unclear.',
        '- Do not invent values.',
        '- Dates must be in ISO format YYYY-MM-DD.',
        '- currency and secondary_currency must be uppercase 3-letter currency codes when visible.',
        '- exchange_rate and tax_rate should be numeric values without symbols when visible.',
        '- series should contain only the invoice series or prefix if it is shown or can be derived clearly from invoice_number.',
        '- invoice_number should preserve the printed invoice number as shown on the document.',
        '- Put only useful invoice-level notes into notes; do not repeat the line items there.',
        '- Extract the billed customer into client.',
        '- Extract one entry per invoice line into items.',
        '- quantity, unit_price, and tax_rate may be numbers or numeric strings.',
        '- confidence must be one of: low, medium, high.',
        '- note should briefly explain uncertainty or formatting concerns when needed.',
      ].join('\n'),
    };
  }

  return {
    name: 'client_details',
    keys: CLIENT_FIELD_KEYS,
    prompt: [
      'Extract the customer or company contact details from the uploaded document.',
      'The document may be a scanned PDF, invoice, contract, registration certificate, or business card.',
      'Return only JSON with this shape:',
      '{"fields":{"name":{"value":"","confidence":"low","note":""},"cif":{"value":"","confidence":"low","note":""},"reg_no":{"value":"","confidence":"low","note":""},"address":{"value":"","confidence":"low","note":""},"city":{"value":"","confidence":"low","note":""},"country":{"value":"","confidence":"low","note":""},"email":{"value":"","confidence":"low","note":""},"phone":{"value":"","confidence":"low","note":""},"bank_account":{"value":"","confidence":"low","note":""},"bank_name":{"value":"","confidence":"low","note":""},"notes":{"value":"","confidence":"low","note":""}},"warnings":[]}',
      'Rules:',
      '- Use empty strings when a field is missing or unclear.',
      '- Do not invent values.',
      '- Prefer the legal company name for name.',
      '- Use notes only for short useful context that does not fit the other fields.',
      '- confidence must be one of: low, medium, high.',
      '- note should briefly explain uncertainty or formatting concerns when needed.',
    ].join('\n'),
  };
}

function buildUserContent(file, prompt) {
  const content = [
    {
      type: 'text',
      text: prompt,
    },
  ];

  if (file.mimeType === 'application/pdf') {
    content.push({
      type: 'file',
      file: {
        filename: file.name || 'document.pdf',
        file_data: file.dataUrl,
      },
    });
    return content;
  }

  content.push({
    type: 'image_url',
    image_url: {
      url: file.dataUrl,
    },
  });
  return content;
}

function validateFilePayload(file) {
  const mimeType = sanitizeString(file?.mimeType);
  const name = sanitizeString(file?.name) || 'document';
  const dataUrl = sanitizeString(file?.dataUrl);

  if (!mimeType || !dataUrl) {
    throw new Error('Document payload is incomplete');
  }

  const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error('Only PDF, PNG, JPEG, and WebP files are supported');
  }

  if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
    throw new Error('Invalid document encoding');
  }

  if (dataUrl.length > MAX_DATA_URL_SIZE) {
    throw new Error('Document is too large. Please keep files under 10 MB');
  }

  return { mimeType, name, dataUrl };
}

function extractMessageContent(content) {
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return JSON.stringify(content);
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function parseJsonObject(raw) {
  const text = sanitizeString(raw);
  if (!text) {
    throw new Error('AI provider returned an empty response');
  }

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI provider returned invalid JSON');
  }
}

async function openRouterFetch(path, { method = 'GET', body, apiKey }) {
  const response = await fetch(`${OPENROUTER_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || data?.message || `OpenRouter request failed with status ${response.status}`);
  }

  return data;
}

export async function testOpenRouterConfig(config) {
  const candidate = {
    enabled: Boolean(config?.enabled),
    openrouter: {
      apiKey: sanitizeString(config?.openrouter?.apiKey),
      model: sanitizeString(config?.openrouter?.model) || 'google/gemma-4-26b-a4b-it',
    },
  };

  assertAiEnabled(candidate);

  const result = await openRouterFetch('/models', {
    apiKey: candidate.openrouter.apiKey,
  });

  const models = Array.isArray(result.data) ? result.data : [];
  const matched = models.find((model) => String(model?.id || '') === candidate.openrouter.model);

  return {
    ok: true,
    modelFound: Boolean(matched),
    model: candidate.openrouter.model,
  };
}

export async function listOpenRouterModels({ q = '' } = {}) {
  const config = loadAiConfig();
  assertAiEnabled({
    ...config,
    enabled: true,
  });

  const result = await openRouterFetch('/models', {
    apiKey: config.openrouter.apiKey,
  });

  const needle = sanitizeString(q).toLowerCase();
  const models = Array.isArray(result.data) ? result.data : [];
  const filtered = models
    .filter((model) => {
      const inputModalities = model?.architecture?.input_modalities || [];
      const outputModalities = model?.architecture?.output_modalities || [];
      const supportsImage = inputModalities.includes('image');
      const outputsText = outputModalities.includes('text');
      if (!outputsText) return false;
      if (!supportsImage && model.id !== config.openrouter.model) return false;

      const haystack = `${model.id || ''} ${model.name || ''} ${model.description || ''}`.toLowerCase();
      return !needle || haystack.includes(needle);
    })
    .map((model) => ({
      id: String(model.id || ''),
      name: String(model.name || model.id || ''),
      description: sanitizeString(model.description),
      context_length: Number(model.context_length || 0),
      input_modalities: Array.isArray(model?.architecture?.input_modalities) ? model.architecture.input_modalities : [],
      output_modalities: Array.isArray(model?.architecture?.output_modalities) ? model.architecture.output_modalities : [],
    }))
    .sort((a, b) => {
      if (a.id === config.openrouter.model) return -1;
      if (b.id === config.openrouter.model) return 1;
      return a.name.localeCompare(b.name);
    });

  return filtered;
}

export async function extractDocumentFields({ target, file }) {
  const config = loadAiConfig();
  assertAiEnabled(config);

  const validatedFile = validateFilePayload(file);
  const targetConfig = getTargetConfig(target);

  const plugins = [{ id: 'response-healing' }];
  if (validatedFile.mimeType === 'application/pdf') {
    plugins.unshift({
      id: 'file-parser',
      pdf: {
        engine: 'mistral-ocr',
      },
    });
  }

  const response = await openRouterFetch('/chat/completions', {
    method: 'POST',
    apiKey: config.openrouter.apiKey,
    body: {
      model: config.openrouter.model,
      messages: [
        {
          role: 'system',
          content: 'You extract structured business data from uploaded documents. Return valid JSON only.',
        },
        {
          role: 'user',
          content: buildUserContent(validatedFile, targetConfig.prompt),
        },
      ],
      plugins,
      response_format: {
        type: 'json_object',
      },
      temperature: 0.1,
      max_tokens: target === 'invoice' ? 1800 : 900,
      stream: false,
    },
  });

  const rawContent = extractMessageContent(response?.choices?.[0]?.message?.content);
  const parsed = parseJsonObject(rawContent);
  const warnings = sanitizeWarnings(parsed?.warnings);

  if (target === 'invoice') {
    const review = normalizeFieldReview(parsed?.fields || parsed, targetConfig.keys);
    const clientReview = normalizeFieldReview(parsed?.client, CLIENT_FIELD_KEYS);
    const items = normalizeInvoiceItems(parsed?.items);

    return {
      model: config.openrouter.model,
      fields: normalizeExtractedFields(review, targetConfig.keys),
      review,
      client: normalizeExtractedFields(clientReview, CLIENT_FIELD_KEYS),
      clientReview,
      items,
      warnings,
    };
  }

  const review = normalizeFieldReview(parsed?.fields || parsed, targetConfig.keys);

  return {
    model: config.openrouter.model,
    fields: normalizeExtractedFields(review, targetConfig.keys),
    review,
    warnings,
  };
}
