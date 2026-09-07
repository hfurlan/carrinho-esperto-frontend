import { describe, expect, it } from 'vitest';
import { classifyDecodedQr } from './nfceUrl.ts';

describe('classifyDecodedQr', () => {
  const SP_URL =
    'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=' +
    '3'.repeat(44) +
    '|2|1|1|ABC';

  it('recognises a São Paulo NFC-e URL across SEFAZ subdomains', () => {
    expect(classifyDecodedQr(SP_URL).kind).toBe('nfce-sp');
    expect(classifyDecodedQr(`  ${SP_URL}  `).kind).toBe('nfce-sp');
    expect(classifyDecodedQr('https://nfce.fazenda.sp.gov.br/qrcode?p=x').kind).toBe('nfce-sp');
    expect(
      classifyDecodedQr('https://www.homologacao.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=x')
        .kind,
    ).toBe('nfce-sp');
  });

  it('percent-encodes the literal "|" separators that the backend URI parser rejects', () => {
    const { url } = classifyDecodedQr(SP_URL);
    expect(url).not.toContain('|');
    expect(url).toContain('%7C');
    expect(url).toBe(new URL(SP_URL).href.replace(/\|/g, '%7C'));
  });

  it('does not double-encode a QR that already uses %7C', () => {
    const encoded = SP_URL.replace(/\|/g, '%7C');
    expect(classifyDecodedQr(encoded).url).toBe(encoded);
  });

  it('marks another host as url-unsupported but still keeps the URL (backend decides)', () => {
    const other = 'https://www.fazenda.mg.gov.br/nfce/consulta?p=123';
    expect(classifyDecodedQr(other)).toEqual({ kind: 'url-unsupported', url: other });
  });

  it('passes http on the SEFAZ host through — the backend enforces HTTPS and returns 400', () => {
    const httpUrl = SP_URL.replace('https://', 'http://');
    expect(classifyDecodedQr(httpUrl).kind).toBe('nfce-sp');
  });

  it('classifies non-URL QR content as not-a-url', () => {
    expect(classifyDecodedQr('just some text')).toEqual({ kind: 'not-a-url' });
    expect(classifyDecodedQr('mailto:someone@example.com')).toEqual({ kind: 'not-a-url' });
    expect(classifyDecodedQr('')).toEqual({ kind: 'not-a-url' });
  });
});
