import Provider from 'oidc-provider';
import { oidcConfig } from './oidc-config';

let provider: Provider | null = null;

export function getOIDCProvider(): Provider {
  if (!provider) {
    const ISSUER = process.env.OIDC_ISSUER || 'http://localhost:3000';
    provider = new Provider(ISSUER, oidcConfig);
  }
  return provider;
}

export function createOIDCProvider(): Provider {
  const ISSUER = process.env.OIDC_ISSUER || 'http://localhost:3000';
  return new Provider(ISSUER, oidcConfig);
}
