import { getDb } from './database.js';

function sanitizeValue(value, key = '') {
  const sensitiveKeys = new Set([
    'password',
    'password_hash',
    'currentPassword',
    'newPassword',
    'token',
  ]);

  if (sensitiveKeys.has(key)) return '[REDACTED]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeValue(item));
  if (typeof value === 'object') {
    const out = {};
    Object.entries(value).slice(0, 50).forEach(([k, v]) => {
      out[k] = sanitizeValue(v, k);
    });
    return out;
  }

  return String(value);
}

function getIpAddress(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

export async function logAuditEvent({
  userId = null,
  username = null,
  action,
  method = 'SYSTEM',
  path = '',
  statusCode = null,
  details = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    const db = await getDb();
    const detailsJson = details ? JSON.stringify(sanitizeValue(details)) : null;

    await db.run(
      `INSERT INTO audit_logs (
        user_id, username_snapshot, action, method, path, status_code, details, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, action, method, path, statusCode, detailsJson, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export function auditRequestLogger(req, res, next) {
  const method = String(req.method || '').toUpperCase();
  const shouldTrack = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (!shouldTrack) {
    return next();
  }

  const startedAt = Date.now();
  const requestPath = req.originalUrl || req.path || '';
  const action = 'api.mutation';
  const user = req.user || null;

  res.on('finish', () => {
    // Track only authenticated users for global request logging.
    if (!user?.id) return;

    logAuditEvent({
      userId: user.id,
      username: user.username || user.email || null,
      action,
      method,
      path: requestPath,
      statusCode: res.statusCode,
      details: {
        duration_ms: Date.now() - startedAt,
        body: req.body || null,
        params: req.params || {},
        query: req.query || {},
      },
      ipAddress: getIpAddress(req),
      userAgent: req.headers['user-agent'] || null,
    });
  });

  next();
}

export function buildRequestAuditContext(req) {
  return {
    userId: req.user?.id || null,
    username: req.user?.username || req.user?.email || null,
    ipAddress: getIpAddress(req),
    userAgent: req.headers['user-agent'] || null,
  };
}
