import 'dotenv/config';

export interface AppConfig {
    port: number;
    bffBaseUrl: string;
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
    bffBaseUrl: 'http://localhost:3001',
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
    config.bffBaseUrl = secretConfig.cloudRunUrl;
} else {
    // Fallback to environment variables for local development
    config.bffBaseUrl = process.env.BFF_BASE_URL || 'http://localhost:3001';
}

// Load all other configs from environment variables.
// These are common to both production and development environments.
config.port = Number(process.env.PORT) || 8080;
config.jwt.skipVerification = process.env.SKIP_JWT_VERIFY === 'true';
config.jwt.publicKey = process.env.JWT_PUBLIC_KEY || '';
config.jwt.jwksUri = process.env.JWT_JWKS_URI || '';
config.jwt.issuer = process.env.JWT_ISSUER || '';
config.jwt.audience = process.env.JWT_AUDIENCE || '';
config.firebase.projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';

// Basic validation
// Only require Firebase project ID when JWT verification is enabled
if (!config.jwt.skipVerification && !config.firebase.projectId) {
    throw new Error('Missing critical configuration. Ensure FIREBASE_PROJECT_ID is set.');
}

export default config; 