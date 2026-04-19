import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const configPath = path.join(dataDir, 'ai-config.json');

export const DEFAULT_AI_CONFIG = {
  enabled: false,
  autoExtractCompany: true,
  provider: 'openrouter',
  openrouter: {
    apiKey: '',
    model: 'google/gemma-4-26b-a4b-it',
  },
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

export function normalizeAiConfig(config = {}) {
  const openrouter = config.openrouter || {};

  return {
    enabled: toBool(config.enabled, DEFAULT_AI_CONFIG.enabled),
    autoExtractCompany: toBool(config.autoExtractCompany, DEFAULT_AI_CONFIG.autoExtractCompany),
    provider: 'openrouter',
    openrouter: {
      apiKey: String(openrouter.apiKey || ''),
      model: String(openrouter.model || DEFAULT_AI_CONFIG.openrouter.model),
    },
  };
}

export function loadAiConfig() {
  ensureDataDir();

  if (!fs.existsSync(configPath)) {
    return normalizeAiConfig(DEFAULT_AI_CONFIG);
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return normalizeAiConfig(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to read AI config, using defaults:', error);
    return normalizeAiConfig(DEFAULT_AI_CONFIG);
  }
}

export function saveAiConfig(config) {
  ensureDataDir();
  const normalized = normalizeAiConfig(config);
  fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

export function applyAiSecretPreservation(currentConfig, incomingConfig = {}) {
  const normalizedCurrent = normalizeAiConfig(currentConfig);
  const normalizedIncoming = normalizeAiConfig({
    ...normalizedCurrent,
    ...incomingConfig,
    openrouter: {
      ...(normalizedCurrent.openrouter || {}),
      ...(incomingConfig.openrouter || {}),
    },
  });

  if (!('openrouter' in incomingConfig) || !('apiKey' in (incomingConfig.openrouter || {})) || incomingConfig.openrouter.apiKey === '') {
    normalizedIncoming.openrouter.apiKey = normalizedCurrent.openrouter.apiKey || '';
  }

  return normalizedIncoming;
}

export function getPublicAiConfig(config) {
  const normalized = normalizeAiConfig(config);
  return {
    enabled: normalized.enabled,
    autoExtractCompany: normalized.autoExtractCompany,
    provider: normalized.provider,
    openrouter: {
      model: normalized.openrouter.model,
      apiKey: '',
      hasApiKey: Boolean(normalized.openrouter.apiKey),
    },
  };
}
