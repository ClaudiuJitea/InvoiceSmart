import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const configPath = path.join(dataDir, 'db-config.json');

const DEFAULT_CONFIG = {
  provider: 'sqlite',
  sqlite: {
    filePath: 'invoices.db',
  },
  postgres: {
    host: '',
    port: 5432,
    database: '',
    user: '',
    password: '',
    ssl: false,
  },
  mysql: {
    host: '',
    port: 3306,
    database: '',
    user: '',
    password: '',
    ssl: false,
  },
  mariadb: {
    host: '',
    port: 3306,
    database: '',
    user: '',
    password: '',
    ssl: false,
  },
  supabase: {
    host: '',
    port: 5432,
    database: 'postgres',
    user: '',
    password: '',
    ssl: true,
  },
};

const SUPPORTED_PROVIDERS = ['sqlite', 'postgres', 'mysql', 'mariadb', 'supabase'];

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

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProviderConfig(provider, config = {}) {
  if (provider === 'sqlite') {
    return {
      filePath: String(config.filePath || DEFAULT_CONFIG.sqlite.filePath),
    };
  }

  const defaults = DEFAULT_CONFIG[provider] || {};
  return {
    host: String(config.host || defaults.host || ''),
    port: toInt(config.port, defaults.port || 0),
    database: String(config.database || defaults.database || ''),
    user: String(config.user || defaults.user || ''),
    password: String(config.password || defaults.password || ''),
    ssl: toBool(config.ssl, Boolean(defaults.ssl)),
  };
}

export function normalizeDatabaseConfig(config = {}) {
  const requestedProvider = String(config.provider || DEFAULT_CONFIG.provider).toLowerCase();
  const provider = SUPPORTED_PROVIDERS.includes(requestedProvider) ? requestedProvider : DEFAULT_CONFIG.provider;

  const merged = {
    ...DEFAULT_CONFIG,
    ...config,
    provider,
  };

  return {
    provider,
    sqlite: normalizeProviderConfig('sqlite', merged.sqlite),
    postgres: normalizeProviderConfig('postgres', merged.postgres),
    mysql: normalizeProviderConfig('mysql', merged.mysql),
    mariadb: normalizeProviderConfig('mariadb', merged.mariadb),
    supabase: normalizeProviderConfig('supabase', merged.supabase),
  };
}

export function loadDatabaseConfig() {
  ensureDataDir();

  if (!fs.existsSync(configPath)) {
    return normalizeDatabaseConfig(DEFAULT_CONFIG);
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return normalizeDatabaseConfig(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to read database config, using defaults:', error);
    return normalizeDatabaseConfig(DEFAULT_CONFIG);
  }
}

export function saveDatabaseConfig(config) {
  ensureDataDir();
  const normalized = normalizeDatabaseConfig(config);
  fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

export function mergeDatabaseConfig(currentConfig, patch) {
  const merged = {
    ...currentConfig,
    ...patch,
    sqlite: {
      ...(currentConfig.sqlite || {}),
      ...(patch.sqlite || {}),
    },
    postgres: {
      ...(currentConfig.postgres || {}),
      ...(patch.postgres || {}),
    },
    mysql: {
      ...(currentConfig.mysql || {}),
      ...(patch.mysql || {}),
    },
    mariadb: {
      ...(currentConfig.mariadb || {}),
      ...(patch.mariadb || {}),
    },
    supabase: {
      ...(currentConfig.supabase || {}),
      ...(patch.supabase || {}),
    },
  };

  return normalizeDatabaseConfig(merged);
}

function redactProviderConfig(providerConfig = {}) {
  const cloned = { ...providerConfig };
  if ('password' in cloned) {
    const hasPassword = Boolean(cloned.password);
    cloned.password = '';
    cloned.hasPassword = hasPassword;
  }
  return cloned;
}

export function getPublicDatabaseConfig(config) {
  const normalized = normalizeDatabaseConfig(config);
  return {
    provider: normalized.provider,
    sqlite: redactProviderConfig(normalized.sqlite),
    postgres: redactProviderConfig(normalized.postgres),
    mysql: redactProviderConfig(normalized.mysql),
    mariadb: redactProviderConfig(normalized.mariadb),
    supabase: redactProviderConfig(normalized.supabase),
  };
}

export function applySecretPreservation(currentConfig, incomingConfig = {}) {
  const merged = mergeDatabaseConfig(currentConfig, incomingConfig);

  for (const provider of SUPPORTED_PROVIDERS) {
    const incomingProvider = incomingConfig[provider] || {};
    if (!('password' in incomingProvider) || incomingProvider.password === '') {
      merged[provider].password = currentConfig[provider]?.password || '';
    }
  }

  return merged;
}

export { DEFAULT_CONFIG, SUPPORTED_PROVIDERS };
