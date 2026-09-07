/*
 * PUBLIC Cognito configuration only. The app client is created with
 * `--no-generate-secret`, so the browser can call InitiateAuth directly with
 * nothing secret. A client id and a regional endpoint are not credentials.
 *
 * Never add LLM/AWS/admin secrets here — the frontend must stay a public client.
 */

export interface CognitoConfig {
  endpoint: string;
  region: string;
  clientId: string;
}

export function cognitoConfig(): CognitoConfig {
  return {
    endpoint: import.meta.env.VITE_COGNITO_ENDPOINT?.replace(/\/+$/, '') || 'http://localhost:4566',
    region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  };
}

export function isCognitoConfigured(): boolean {
  return cognitoConfig().clientId.trim().length > 0;
}
