export interface FastF1Row {
  Time: string; // e.g., 0:00:12.345 or "0 days 00:00:12.345000"
  Speed?: string; // km/h (may include thousands separators)
  Brake?: string | boolean; // 0/1, true/false
  Throttle?: string; // %
  nGear?: string; // gear
  RPM?: string; // may include thousands separators
  BrakePressure?: string; // if present
  TrackStatus?: string;
  Source?: string;
}

export interface ParsedTelemetrySequence {
  wheelSpeed: number[]; // converted to RPM equivalent
  brakePressure: number[]; // bar (estimated if not present)
  ambientTemp: number[]; // °C (placeholder or provided)
  padThickness: number[]; // mm (estimated decay over time)
  timestamp: number[]; // seconds
}

export function parseFastF1Csv(csv: string, ambientTempC = 25, padThicknessStartMm = 10): ParsedTelemetrySequence {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { wheelSpeed: [], brakePressure: [], ambientTemp: [], padThickness: [], timestamp: [] };
  }
  const header = splitCsvLine(lines[0]).map(h => h.trim());
  const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
  const ti = idx('Time');
  const si = idx('Speed');
  const bi = idx('BrakePressure');
  const bk = idx('Brake');

  const wheelSpeed: number[] = [];
  const brakePressure: number[] = [];
  const ambientTemp: number[] = [];
  const padThickness: number[] = [];
  const timestamp: number[] = [];

  let pad = padThicknessStartMm;
  let lastSec = 0;

  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r]);
    if (cols.length !== header.length) continue;

    const timeStr = cols[ti] || '0:00:00.000';
    const sec = toSecondsFlexible(timeStr);
    const dt = Math.max(0, sec - lastSec);
    lastSec = sec;

    const speedKmh = si >= 0 ? toNumber(cols[si]) : NaN;
    const speedMs = isFinite(speedKmh) ? speedKmh / 3.6 : 0;
    const wheelRpm = speedMs > 0 ? (speedMs / (2 * Math.PI * 0.33)) * 60 : 0; // approx tyre radius 0.33m

    let pressureBar = 0;
    if (bi >= 0) {
      pressureBar = toNumber(cols[bi]) || 0;
    } else if (bk >= 0) {
      const braking = toBool01(cols[bk]);
      // Estimate pressure based on decel proxy
      pressureBar = braking ? Math.min(300, 50 + speedMs * 20) : 0;
    }

    // Simple pad wear estimate
    const wearMm = Math.max(0, pressureBar) * 1e-5 * Math.max(0.1, dt);
    pad = Math.max(1.5, pad - wearMm);

    wheelSpeed.push(wheelRpm);
    brakePressure.push(pressureBar);
    ambientTemp.push(ambientTempC);
    padThickness.push(pad);
    timestamp.push(sec);
  }

  return { wheelSpeed, brakePressure, ambientTemp, padThickness, timestamp };
}

function toSecondsFlexible(timeStr: string) {
  // Supports: "m:s.ms", "h:m:s.ms", seconds float, or pandas Timedelta like "0 days 00:00:00.374000"
  const trimmed = (timeStr || '').toString().trim();
  if (!trimmed) return 0;
  // Pandas Timedelta pattern: "X days HH:MM:SS.mmmmmm"
  const td = /^(\d+)\s+days\s+(\d{2}):(\d{2}):(\d{2}\.\d+)$/.exec(trimmed);
  if (td) {
    const days = Number(td[1]);
    const hms = `${td[2]}:${td[3]}:${td[4]}`;
    return days * 86400 + hmsToSeconds(hms);
  }
  // Plain h:m:s.ms or m:s.ms
  if (trimmed.includes(':')) return hmsToSeconds(trimmed);
  const v = Number(trimmed);
  return isFinite(v) ? v : 0;
}

function hmsToSeconds(hms: string) {
  const parts = hms.split(':');
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    return (isFinite(m) ? m : 0) * 60 + (isFinite(s) ? s : 0);
  }
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = Number(parts[2]);
    return (isFinite(h) ? h : 0) * 3600 + (isFinite(m) ? m : 0) * 60 + (isFinite(s) ? s : 0);
  }
  return 0;
}

function toNumber(val: any): number {
  if (val === undefined || val === null) return NaN;
  const s = String(val).replace(/,/g, '').trim();
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

function toBool01(val: any): 0 | 1 {
  if (typeof val === 'boolean') return val ? 1 : 0;
  const s = String(val).toLowerCase().trim();
  if (s === 'true' || s === '1') return 1;
  if (s === 'false' || s === '0' || s === '') return 0;
  const n = Number(s);
  return isFinite(n) && n > 0 ? 1 : 0;
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV splitter handling quotes and commas within fields
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}


