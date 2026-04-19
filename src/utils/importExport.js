const SHEETJS_CDN_URL = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.min.js';

export async function loadSheetJs() {
  if (window.XLSX) return window.XLSX;

  if (!window.__invoiceSmartSheetJsPromise) {
    window.__invoiceSmartSheetJsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-sheetjs-loader="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.XLSX));
        existing.addEventListener('error', () => reject(new Error('Failed to load spreadsheet library')));
        return;
      }

      const script = document.createElement('script');
      script.src = SHEETJS_CDN_URL;
      script.async = true;
      script.dataset.sheetjsLoader = 'true';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error('Failed to load spreadsheet library'));
      document.head.appendChild(script);
    });
  }

  return window.__invoiceSmartSheetJsPromise;
}

export function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function stringifyValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function toTrimmedString(value) {
  return stringifyValue(value).trim();
}

export function toNullableString(value) {
  const next = toTrimmedString(value);
  return next || null;
}

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = Number(String(value).replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function toBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'da', 'active'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'nu', 'inactive'].includes(normalized)) return false;
  return fallback;
}

export function groupRowsBy(rows, getKey) {
  const map = new Map();
  rows.forEach((row, index) => {
    const key = getKey(row, index);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(row);
  });
  return map;
}

export function parseCsvText(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(value);
      const hasContent = row.some((cell) => String(cell || '').trim() !== '');
      if (hasContent) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => String(cell || '').trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

export function csvRowsToObjects(csvRows = []) {
  if (csvRows.length === 0) return [];
  const [headerRow, ...dataRows] = csvRows;
  const headers = headerRow.map((header, index) => normalizeHeader(header) || `column_${index + 1}`);

  return dataRows
    .filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
    .map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] ?? '';
      });
      return entry;
    });
}

export async function readStructuredFile(file) {
  const fileName = String(file?.name || '').toLowerCase();
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const XLSX = await loadSheetJs();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return rawRows.map((row) => {
      const normalized = {};
      Object.entries(row || {}).forEach(([key, value]) => {
        normalized[normalizeHeader(key)] = value;
      });
      return normalized;
    });
  }

  const text = await file.text();
  return csvRowsToObjects(parseCsvText(text));
}

export function serializeCsv(rows = [], columns = []) {
  const headers = columns.map((column) => column.label);
  const lines = [headers];

  rows.forEach((row) => {
    lines.push(columns.map((column) => stringifyValue(row[column.key])));
  });

  return lines
    .map((line) => line.map((value) => {
      const stringValue = stringifyValue(value);
      if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(','))
    .join('\r\n');
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, rows, columns) {
  const csv = serializeCsv(rows, columns);
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}

export async function downloadWorkbook(filename, rows, columns, sheetName = 'Export') {
  const XLSX = await loadSheetJs();
  const worksheetRows = [
    columns.reduce((acc, column) => {
      acc[column.label] = column.label;
      return acc;
    }, {}),
    ...rows.map((row) => columns.reduce((acc, column) => {
      acc[column.label] = row[column.key];
      return acc;
    }, {})),
  ];

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    skipHeader: true,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function resolveFirstValue(row, aliases = []) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    const value = row[key];
    if (value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}
