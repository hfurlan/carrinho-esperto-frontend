import { describe, expect, it } from 'vitest';
import { formatAccessKey, formatBRL, formatCnpj, formatDate, formatMonth, formatQuantity } from './format.ts';

describe('format', () => {
  it('formats currency in R$ with Brazilian grouping', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50');
    expect(formatBRL('0')).toBe('R$ 0,00');
    expect(formatBRL(null)).toBe('—');
  });

  it('formats dates as dd/mm/aaaa', () => {
    expect(formatDate('2026-09-06T14:57:04-03:00')).toBe('06/09/2026');
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats a YYYY-MM month label', () => {
    expect(formatMonth('2026-09')).toMatch(/2026/);
  });

  it('masks a 14-digit CNPJ', () => {
    expect(formatCnpj('00371046000117')).toBe('00.371.046/0001-17');
    expect(formatCnpj(null)).toBe('—');
  });

  it('groups the access key in fours', () => {
    expect(formatAccessKey('35260900371046000117650080001172161001384659')).toBe(
      '3526 0900 3710 4600 0117 6500 8000 1172 1610 0138 4659',
    );
  });

  it('keeps decimal quantities', () => {
    expect(formatQuantity('0.9944')).toBe('0,9944');
  });
});
