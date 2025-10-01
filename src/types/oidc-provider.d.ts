declare module 'oidc-provider' {
  export interface Configuration {
    [key: string]: unknown;
  }
  
  export class Provider {
    constructor(issuer: string, configuration: Configuration);
    callback(): (req: unknown) => Promise<Response>;
  }
  
  export function createProvider(issuer: string, configuration: Configuration): Provider;
}
