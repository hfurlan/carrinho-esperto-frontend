/**
 * Read-only, unverified decoding of a Cognito access token's claims — used only
 * to decide which navigation to show. The backend verifies the signature and
 * enforces every admin route; a tampered token buys nothing here.
 */

interface AccessTokenClaims {
  'cognito:groups'?: string[];
  username?: string;
  sub?: string;
}

function decodeSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
  return JSON.parse(json);
}

export function readGroups(accessToken: string | null | undefined): string[] {
  if (!accessToken) return [];
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return [];
    const claims = decodeSegment(parts[1]) as AccessTokenClaims;
    return Array.isArray(claims['cognito:groups']) ? claims['cognito:groups'] : [];
  } catch {
    return [];
  }
}
