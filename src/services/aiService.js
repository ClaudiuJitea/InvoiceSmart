import { authService } from '../db/services/authService.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

function getAuthHeader() {
  return authService.getAuthHeader();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function buildFilePayload(file) {
  if (!file) {
    throw new Error('No document selected');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only PDF, PNG, JPEG, and WebP files are supported');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Document is too large. Please keep files under 10 MB');
  }

  return {
    name: file.name || 'document',
    mimeType: file.type,
    dataUrl: await readFileAsDataUrl(file),
  };
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }
  return data;
}

export const aiService = {
  async getConfig() {
    const response = await fetch('/api/ai/config', {
      headers: getAuthHeader(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch AI configuration');
    }
    return data;
  },

  async updateConfig(config) {
    const response = await fetch('/api/ai/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(config),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update AI configuration');
    }
    return data.config;
  },

  async testConfig(config) {
    const response = await fetch('/api/ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(config),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to test AI configuration');
    }
    return data;
  },

  async listModels(q = '') {
    const response = await fetch(`/api/ai/models?q=${encodeURIComponent(q)}`, {
      headers: getAuthHeader(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch AI models');
    }
    return Array.isArray(data.data) ? data.data : [];
  },

  async extractCompanyFromFile(file) {
    return postJson('/api/ai/extract/company', {
      file: await buildFilePayload(file),
    });
  },

  async extractClientFromFile(file) {
    return postJson('/api/ai/extract/client', {
      file: await buildFilePayload(file),
    });
  },
};

export default aiService;
