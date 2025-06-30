/**
 * Sanitizes request body by removing or masking sensitive fields
 */
export function sanitizeRequestBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(body));
  
  // List of field names that should be sanitized
  const sensitiveFields = [
    'password',
    'token', 
    'authorization',
    'secret',
    'key',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken', 
    'refresh_token',
    'clientSecret',
    'client_secret',
    'privateKey',
    'private_key'
  ];
  
  // Recursively sanitize object
  sanitizeObject(sanitized, sensitiveFields);
  
  return sanitized;
}

/**
 * Recursively sanitizes an object by replacing sensitive field values
 */
function sanitizeObject(obj: Record<string, unknown>, sensitiveFields: string[]): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      
      // Check if this field should be sanitized
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively sanitize nested objects
        if (Array.isArray(obj[key])) {
          (obj[key] as unknown[]).forEach((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              sanitizeObject(item as Record<string, unknown>, sensitiveFields);
            }
          });
        } else {
          sanitizeObject(obj[key] as Record<string, unknown>, sensitiveFields);
        }
      }
    }
  }
} 