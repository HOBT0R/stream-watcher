import 'dotenv/config';

export interface AppConfig {
    port: number;
    bffBaseUrl: string;
    bffApiKey: string;
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
let config: AppConfig = {
    port: 8080,
    bffBaseUrl: 'http://localhost:3001',
    bffApiKey: '',
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

// Override with environment variables
// Production: Load from a single JSON blob in an environment variable
if (process.env.NODE_CONFIG_JSON) {
    const configFromJson = JSON.parse(process.env.NODE_CONFIG_JSON);
    config = { ...config, ...configFromJson };
} else {
    // Development: Load from individual environment variables
    config.port = Number(process.env.PORT) || 8080;
    config.bffBaseUrl = process.env.BFF_BASE_URL || 'http://localhost:3001';
    config.bffApiKey = process.env.BFF_API_KEY || '';
    config.jwt.skipVerification = process.env.SKIP_JWT_VERIFY === 'true';
    config.jwt.publicKey = process.env.JWT_PUBLIC_KEY || '';
    config.jwt.jwksUri = process.env.JWT_JWKS_URI || '';
    config.jwt.issuer = process.env.JWT_ISSUER || '';
    config.jwt.audience = process.env.JWT_AUDIENCE || '';
    config.firebase.projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
}

// Basic validation
if (!config.bffBaseUrl || !config.bffApiKey) {
    throw new Error('Missing critical configuration. Ensure BFF_BASE_URL and BFF_API_KEY are set.');
}

// Only require Firebase project ID when JWT verification is enabled
if (!config.jwt.skipVerification && !config.firebase.projectId) {
    throw new Error('Missing critical configuration. Ensure FIREBASE_PROJECT_ID is set.');
}

export default config; 