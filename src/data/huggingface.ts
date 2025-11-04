export interface HFRow {
  row: number;
  truncated_cells?: string[];
  content: Record<string, any>;
}

export interface HFRowsResponse {
  rows: HFRow[];
  features: Array<{ name: string; dtype: string }>;
  num_rows_total?: number;
}

const DEFAULT_DATASET = 'Draichi/Formula1-2024-Miami-Verstappen-telemetry';

export async function fetchHuggingFaceRows(datasetId: string = DEFAULT_DATASET, split: string = 'train', length: number = 100): Promise<HFRowsResponse> {
  // Use Vite proxy in development, Vercel API route in production
  const isDev = import.meta.env.DEV;
  const base = isDev ? '/hf/rows' : '/api/hf-proxy';
  const url = `${base}?dataset=${encodeURIComponent(datasetId)}&config=default&split=${encodeURIComponent(split)}&offset=0&length=${length}`;
  
  const res = await fetch(url, { 
    headers: { 'Accept': 'application/json' },
    mode: 'same-origin' // Both dev proxy and Vercel API are same-origin
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMsg = `HF rows fetch failed: ${res.status} ${res.statusText}`;
    try {
      const errorJson = JSON.parse(text);
      errorMsg += ` - ${errorJson.error || errorJson.message || text.slice(0, 200)}`;
    } catch {
      errorMsg += text ? ` - ${text.slice(0, 200)}` : '';
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export function hfTimelikeToSeconds(v: any): number {
  const s = String(v || '').trim();
  // e.g., "0 days 00:00:21.893000"
  const m = /^(\d+)\s+days\s+(\d{2}):(\d{2}):(\d{2}\.\d+)$/.exec(s);
  if (m) {
    const days = Number(m[1]);
    const h = Number(m[2]);
    const mi = Number(m[3]);
    const sec = Number(m[4]);
    return days * 86400 + h * 3600 + mi * 60 + sec;
  }
  if (s.includes(':')) {
    const parts = s.split(':');
    if (parts.length === 3) {
      const h = Number(parts[0]) || 0;
      const mi = Number(parts[1]) || 0;
      const sec = Number(parts[2]) || 0;
      return h * 3600 + mi * 60 + sec;
    }
  }
  const num = Number(s);
  return isFinite(num) ? num : 0;
}

export function toNumberLoose(v: any): number {
  const s = String(v ?? '').replace(/,/g, '').trim();
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

export function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase();
  return s === 'true' || s === '1';
}


