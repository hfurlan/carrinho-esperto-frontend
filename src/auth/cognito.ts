/*
 * Minimal Cognito Identity Provider client built on raw `fetch` (no AWS SDK
 * dependency for two calls). Uses the USER_PASSWORD_AUTH flow, which the local
 * MiniStack app client enables and which needs no client secret.
 *
 * The backend is an OAuth2 Resource Server: it only ever sees the resulting
 * access token as a bearer credential. There is no parallel auth here.
 */

import { cognitoConfig } from './config.ts';

const TARGET_PREFIX = 'AWSCognitoIdentityProviderService';

export interface CognitoTokens {
  accessToken: string;
  /** Epoch millis when `accessToken` stops being valid. */
  expiresAt: number;
  refreshToken?: string;
}

interface AuthenticationResult {
  AccessToken: string;
  ExpiresIn: number;
  RefreshToken?: string;
  TokenType: string;
}

export class CognitoError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CognitoError';
    this.code = code;
  }
}

async function call(action: string, payload: Record<string, unknown>): Promise<unknown> {
  const { endpoint } = cognitoConfig();
  let response: Response;
  try {
    response = await fetch(`${endpoint}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `${TARGET_PREFIX}.${action}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CognitoError('NetworkError', 'Não foi possível conectar ao serviço de autenticação.');
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    const rawType = typeof data.__type === 'string' ? data.__type : 'UnknownError';
    const code = rawType.split('#').pop() ?? rawType;
    // Only a curated set of codes gets a specific message. Everything else —
    // including any raw AWS/Cognito text in `data.message` — collapses to a
    // generic Portuguese message so provider internals never reach the user.
    const message =
      code === 'NotAuthorizedException'
        ? 'E-mail ou senha inválidos.'
        : code === 'UserNotFoundException'
          ? 'Usuário não encontrado.'
          : code === 'PasswordResetRequiredException'
            ? 'É necessário redefinir sua senha antes de entrar.'
            : code === 'UserNotConfirmedException'
              ? 'Sua conta ainda não foi confirmada.'
              : code === 'TooManyRequestsException'
                ? 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
                : 'Não foi possível entrar. Tente novamente em alguns instantes.';
    throw new CognitoError(code, message);
  }

  return data;
}

function toTokens(result: AuthenticationResult, fallbackRefresh?: string): CognitoTokens {
  return {
    accessToken: result.AccessToken,
    // Refresh a minute early to avoid racing an in-flight request against expiry.
    expiresAt: Date.now() + (result.ExpiresIn - 60) * 1000,
    refreshToken: result.RefreshToken ?? fallbackRefresh,
  };
}

export async function signIn(username: string, password: string): Promise<CognitoTokens> {
  const { clientId } = cognitoConfig();
  const data = (await call('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: { USERNAME: username, PASSWORD: password },
  })) as { AuthenticationResult?: AuthenticationResult };

  if (!data.AuthenticationResult) {
    throw new CognitoError('ChallengeRequired', 'Este usuário exige uma etapa adicional de login.');
  }
  return toTokens(data.AuthenticationResult);
}

export async function refreshTokens(refreshToken: string): Promise<CognitoTokens> {
  const { clientId } = cognitoConfig();
  const data = (await call('InitiateAuth', {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: clientId,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  })) as { AuthenticationResult?: AuthenticationResult };

  if (!data.AuthenticationResult) {
    throw new CognitoError('RefreshFailed', 'Não foi possível renovar a sessão.');
  }
  return toTokens(data.AuthenticationResult, refreshToken);
}
