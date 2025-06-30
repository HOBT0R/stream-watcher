export interface BaseConfig {
  port: number;
  bffTargetUrl: URL;
  bffAudience: string;
}

export interface ValidatedLoggingConfig {
  level: string;
  format: 'json' | 'simple';
  enableRequestLogging: boolean;
  enableBffTokenLogging: boolean;
  enableRequestBodyLogging: boolean;
  enableFileLogging: boolean;
}

export interface ValidatedUserTokenConfig {
  skipVerification: boolean;
  publicKey?: string;
  jwksUri?: URL;
  issuer?: string;
  audience?: string;
  mockUser?: {
    sub: string;
    email: string;
    name: string;
  };
}

export interface ValidatedGoogleConfig {
  skipAuth: boolean;
  projectId?: string;
  audience?: string;
  mockToken?: string;
}

export interface ValidatedAppConfig extends BaseConfig {
  userToken: ValidatedUserTokenConfig;
  google: ValidatedGoogleConfig;
  logging: ValidatedLoggingConfig;
}

export interface DevelopmentConfig extends BaseConfig {
  userToken: {
    skipVerification: boolean; // can be true or false in dev
    publicKey?: string;
    mockUser?: {
      sub: string;
      email: string;
      name: string;
    };
  };
  google: {
    skipAuth: true;
    mockToken?: string;
  };
  logging: ValidatedLoggingConfig;
}

export interface ProductionConfig extends BaseConfig {
  userToken: {
    skipVerification: false;
    jwksUri: URL;
    issuer: string;
    audience: string;
  };
  google: {
    skipAuth: false;
    projectId: string;
    audience: string;
  };
  logging: ValidatedLoggingConfig;
} 