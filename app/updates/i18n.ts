"use client";

import { useLocale } from '@/lib/i18n';
import { operationsSpanish } from './translations';

const fields: Record<string, string> = {
  producedCases: 'cajas producidas', plannedCases: 'cajas previstas', pricePerCase: 'precio por caja',
  material: 'materiales', regularHours: 'horas ordinarias', hourlyRate: 'tarifa por hora',
  unitsPerCase: 'unidades por caja', looseUnits: 'piezas sueltas', overtimeHours: 'horas extra',
  doubleHours: 'horas dobles', standardMaterial: 'materiales estándar', standardLaborRate: 'tarifa laboral estándar',
  lot: 'lote', sku: 'SKU', comment: 'comentario',
};

export function translateOperations(text: string, locale: string): string {
  if (locale !== 'es') return text;
  const key = text.trim();
  let translated = operationsSpanish[key];
  if (!translated) {
    const count = key.match(/^(\d+) incomplete batches excluded$/);
    const field = key.match(/^(Missing or invalid |Invalid numeric field: |Invalid text field: |Invalid )(\w+)$/);
    if (count) translated = `${count[1]} lotes incompletos excluidos`;
    else if (field) translated = `${field[1] === 'Missing or invalid ' ? 'Dato faltante o inválido' : 'Dato inválido'}: ${fields[field[2]] ?? field[2]}`;
    else if (key === 'row') translated = 'fila';
  }
  return translated ? text.replace(key, translated) : text;
}

// Translate only the action recorded by the demo, preserving user-entered correction reasons.
export function translateAudit(entry: string, t: (text: string) => string): string {
  const [minute, employee, ...parts] = entry.split(' · ');
  const action = parts.join(' · ');
  if (action.startsWith('correction ')) return `${minute} · ${employee} · ${t('correction')}${action.slice('correction'.length)}`;
  return `${minute} · ${employee} · ${t(action)}`;
}

export function useOperationsLocale() {
  const { locale } = useLocale();
  const language = locale === 'es' ? 'es-MX' : 'en-US';
  return {
    t: (text: string) => translateOperations(text, locale),
    usd: (value: number | null) => value == null ? '—' : new Intl.NumberFormat(language, {style: 'currency', currency: 'USD', maximumFractionDigits: 2}).format(value),
    num: (value: number, digits = 0) => new Intl.NumberFormat(language, {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value),
  };
}
