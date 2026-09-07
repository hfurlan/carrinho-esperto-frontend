/*
 * Client-side triage of a decoded QR Code, before it is handed to the backend
 * import (M006.1). This is only a hint for the UI — the authority on what can be
 * imported is the backend (`SaoPauloNfceQrCodeValidator` + `SaoPauloNfceProvider`),
 * which also enforces the SSRF allow-list, HTTPS-only, private-address protection
 * and provider selection.
 *
 * So the rule here is deliberately permissive: anything that is an http(s) URL is
 * worth sending to import (the backend returns a clean 400 / 422 otherwise). We
 * only hard-stop content that is not a web address at all. `nfce-sp` is a
 * positive signal used for nicer messaging, not a gate.
 */

/** São Paulo SEFAZ domain (any subdomain: www.nfce., homologacao.nfce., …). */
const SAO_PAULO_SUFFIX = 'fazenda.sp.gov.br';

export type DecodedQrKind =
  | 'nfce-sp' // looks like a São Paulo NFC-e link
  | 'url-unsupported' // some other URL — still handed to the backend to decide
  | 'not-a-url'; // the QR did not contain a web address at all

export interface DecodedQr {
  kind: DecodedQrKind;
  /** The trimmed URL, present when `kind !== 'not-a-url'`. */
  url?: string;
}

/** Classify the raw text a QR decoder produced. */
export function classifyDecodedQr(raw: string): DecodedQr {
  const text = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return { kind: 'not-a-url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { kind: 'not-a-url' };
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const isSaoPaulo = host === SAO_PAULO_SUFFIX || host.endsWith(`.${SAO_PAULO_SUFFIX}`);
  // The São Paulo NFC-e QR carries literal `|` separators in the `p=` parameter
  // (`chave|versao|ambiente|…`). The WHATWG URL parser (and `URL.href`) leave
  // `|` unencoded in a query, but the backend's stricter `java.net.URI` rejects
  // it outright. Percent-encode it here so the URL survives the trip; an already
  // `%7C`-encoded QR is untouched, so there is no double-encoding.
  return {
    kind: isSaoPaulo ? 'nfce-sp' : 'url-unsupported',
    url: parsed.href.replace(/\|/g, '%7C'),
  };
}
