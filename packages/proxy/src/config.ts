import 'dotenv/config';

export interface AppConfig {
    port: number;
    bffTargetUrl: string;
    bffAudience: string;
    jwt: {
        skipVerification?: boolean;
        publicKey?: string;
        jwksUri?: string;
        issuer?: string;
        audience?: string;
    };
    firebase: {
        projectId: string;
    };
}

// Default configuration
const config: AppConfig = {
    port: 8080,
    bffTargetUrl: 'http://localhost:3001',
    bffAudience: 'http://localhost:3001',
    jwt: {
        skipVerification: false,
        publicKey: '',
        jwksUri: '',
        issuer: '',
        audience: '',
    },
    firebase: {
        projectId: '',
    },
};

// Load BFF config from secrets if available
if (process.env.APP_CONFIG_JSON) {
    const secretConfig = JSON.parse(process.env.APP_CONFIG_JSON);
    // In production, the target and audience are the same
    config.bffTargetUrl = secretConfig.cloudRunUrl;
    config.bffAudience = secretConfig.cloudRunUrl;
} else {
    // Fallback to environment variables for local development
    // Allows for separate target and audience, but defaults to the same URL if only BFF_BASE_URL is set
    config.bffTargetUrl = process.env.BFF_TARGET_URL || process.env.BFF_BASE_URL || 'http://localhost:3001';
    config.bffAudience = process.env.BFF_AUDIENCE || process.env.BFF_BASE_URL || 'http://localhost:3001';
}

// Load all other configs from environment variables.
// These are common to both production and development environments.
config.port = Number(process.env.PORT) || 8080;
config.jwt.skipVerification = process.env.SKIP_JWT_VERIFY === 'true';
config.jwt.publicKey = process.env.JWT_PUBLIC_KEY || '';
config.jwt.jwksUri = process.env.JWT_JWKS_URI || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
config.jwt.issuer = process.env.JWT_ISSUER || '';
config.jwt.audience = process.env.JWT_AUDIENCE || '';
config.firebase.projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';

// Basic validation
// Only require Firebase project ID when JWT verification is enabled
if (!config.jwt.skipVerification && !config.firebase.projectId) {
    throw new Error('Missing critical configuration. Ensure FIREBASE_PROJECT_ID is set.');
}

export default config; 