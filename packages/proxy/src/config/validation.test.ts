import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigValidator } from './validation.js';
import { ConfigError, ConfigWarning } from './errors.js';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('required()', () => {
    it('should return trimmed value for valid input', () => {
      const result = validator.required('  valid-value  ', 'TEST_FIELD');
      expect(result).toBe('valid-value');
    });

    it('should add error for empty string', () => {
      const result = validator.required('', 'TEST_FIELD');
      expect(result).toBe('');
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveLength(1);
      expect(validationResult.errors[0]).toBeInstanceOf(ConfigError);
      expect(validationResult.errors[0].field).toBe('TEST_FIELD');
      expect(validationResult.errors[0].reason).toBe('is required');
    });

    it('should add error for undefined value', () => {
      const result = validator.required(undefined, 'TEST_FIELD');
      expect(result).toBe('');
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveLength(1);
    });
  });

  describe('optional()', () => {
    it('should return trimmed value for valid input', () => {
      const result = validator.optional('  valid-value  ', 'default', 'TEST_FIELD');
      expect(result).toBe('valid-value');
    });

    it('should return default value and add warning for empty string', () => {
      const result = validator.optional('', 'default-value', 'TEST_FIELD');
      expect(result).toBe('default-value');
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(true); // warnings don't make config invalid
      expect(validationResult.warnings).toHaveLength(1);
      expect(validationResult.warnings[0]).toBeInstanceOf(ConfigWarning);
      expect(validationResult.warnings[0].field).toBe('TEST_FIELD');
      expect(validationResult.warnings[0].message).toBe('using default: default-value');
    });
  });

  describe('validateUrl()', () => {
    it('should return valid URL object for https URL', () => {
      const result = validator.validateUrl('https://example.com', 'TEST_URL');
      expect(result).toBeInstanceOf(URL);
      expect(result.toString()).toBe('https://example.com/');
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(true);
    });

    it('should return valid URL object for http URL', () => {
      const result = validator.validateUrl('http://localhost:3000', 'TEST_URL');
      expect(result).toBeInstanceOf(URL);
      expect(result.toString()).toBe('http://localhost:3000/');
    });

    it('should add error for non-http protocols', () => {
      const result = validator.validateUrl('ftp://example.com', 'TEST_URL');
      expect(result).toBeInstanceOf(URL);
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors[0].reason).toBe('must use http or https protocol');
    });

    it('should add error for invalid URL format', () => {
      const result = validator.validateUrl('not-a-url', 'TEST_URL');
      expect(result).toBeInstanceOf(URL);
      expect(result.toString()).toBe('http://invalid/');
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors[0].reason).toBe('is not a valid URL');
    });
  });

  describe('validatePort()', () => {
    it('should return valid port number', () => {
      const result = validator.validatePort('3000', 'TEST_PORT');
      expect(result).toBe(3000);
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(true);
    });

    it('should return default port for undefined value', () => {
      const result = validator.validatePort(undefined, 'TEST_PORT', 8080);
      expect(result).toBe(8080);
    });

    it('should add error for invalid port number', () => {
      const result = validator.validatePort('99999', 'TEST_PORT');
      expect(result).toBe(8080); // default fallback
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors[0].reason).toBe('must be a valid port number (1-65535)');
    });

    it('should add error for non-numeric port', () => {
      const result = validator.validatePort('not-a-number', 'TEST_PORT');
      expect(result).toBe(8080);
      
      const validationResult = validator.getResult();
      expect(validationResult.isValid).toBe(false);
    });
  });

  describe('validateBoolean()', () => {
    it('should return true for truthy values', () => {
      expect(validator.validateBoolean('true', 'TEST_BOOL')).toBe(true);
      expect(validator.validateBoolean('TRUE', 'TEST_BOOL')).toBe(true);
      expect(validator.validateBoolean('1', 'TEST_BOOL')).toBe(true);
      expect(validator.validateBoolean('yes', 'TEST_BOOL')).toBe(true);
      expect(validator.validateBoolean('on', 'TEST_BOOL')).toBe(true);
    });

    it('should return false for falsy values', () => {
      expect(validator.validateBoolean('false', 'TEST_BOOL')).toBe(false);
      expect(validator.validateBoolean('FALSE', 'TEST_BOOL')).toBe(false);
      expect(validator.validateBoolean('0', 'TEST_BOOL')).toBe(false);
      expect(validator.validateBoolean('no', 'TEST_BOOL')).toBe(false);
      expect(validator.validateBoolean('off', 'TEST_BOOL')).toBe(false);
    });

    it('should return default value for undefined', () => {
      expect(validator.validateBoolean(undefined, 'TEST_BOOL', true)).toBe(true);
      expect(validator.validateBoolean(undefined, 'TEST_BOOL', false)).toBe(false);
    });

    it('should add warning for invalid boolean values', () => {
      const result = validator.validateBoolean('maybe', 'TEST_BOOL', true);
      expect(result).toBe(true);
      
      const validationResult = validator.getResult();
      expect(validationResult.warnings).toHaveLength(1);
      expect(validationResult.warnings[0].message).toContain('invalid boolean value "maybe"');
    });
  });

  describe('reset()', () => {
    it('should clear errors and warnings', () => {
      validator.required('', 'FIELD1');
      validator.optional('', 'default', 'FIELD2');
      
      let result = validator.getResult();
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      
      validator.reset();
      result = validator.getResult();
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.isValid).toBe(true);
    });
  });
}); 