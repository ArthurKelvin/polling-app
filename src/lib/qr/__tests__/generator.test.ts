import { 
  generateQRCode, 
  generateShareUrl, 
  isValidUrl, 
  clearQRCodeCache, 
  getCacheStats 
} from '../generator';

describe('QR Code Generator', () => {
  // Mock TextEncoder for Node.js environment
  beforeAll(() => {
    if (typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = require('util').TextEncoder;
    }
  });

  beforeEach(() => {
    clearQRCodeCache();
  });

  describe('generateShareUrl', () => {
    it('should generate correct share URL with default base URL', () => {
      const pollId = 'test-poll-123';
      const url = generateShareUrl(pollId);
      expect(url).toBe('http://localhost:3000/polls/test-poll-123');
    });

    it('should generate correct share URL with custom base URL', () => {
      const pollId = 'test-poll-123';
      const baseUrl = 'https://myapp.com';
      const url = generateShareUrl(pollId, baseUrl);
      expect(url).toBe('https://myapp.com/polls/test-poll-123');
    });

    it('should handle base URL with trailing slash', () => {
      const pollId = 'test-poll-123';
      const baseUrl = 'https://myapp.com/';
      const url = generateShareUrl(pollId, baseUrl);
      expect(url).toBe('https://myapp.com/polls/test-poll-123');
    });

    it('should throw error for invalid poll ID', () => {
      expect(() => generateShareUrl('')).toThrow('Poll ID is required and must be a string');
      expect(() => generateShareUrl(null as any)).toThrow('Poll ID is required and must be a string');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for valid URL', async () => {
      const url = 'https://example.com/test';
      const result = await generateQRCode(url);
      
      expect(result).toHaveProperty('dataUrl');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('errorCorrectionLevel');
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.size).toBe(256);
    });

    it('should generate QR code even for invalid URL (QR library behavior)', async () => {
      const invalidUrl = 'not-a-valid-url';
      const result = await generateQRCode(invalidUrl);
      
      // QR code library actually generates QR codes for any string
      expect(result).toHaveProperty('dataUrl');
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should use custom configuration', async () => {
      const url = 'https://example.com/test';
      const config = {
        size: 512,
        color: '#ff0000',
        backgroundColor: '#00ff00',
        errorCorrectionLevel: 'H' as const
      };
      
      const result = await generateQRCode(url, config);
      
      expect(result.size).toBe(512);
      expect(result.errorCorrectionLevel).toBe('H');
    });

    it('should cache QR codes', async () => {
      const url = 'https://example.com/test';
      
      // First generation
      const result1 = await generateQRCode(url);
      const stats1 = getCacheStats();
      
      // Second generation should use cache
      const result2 = await generateQRCode(url);
      const stats2 = getCacheStats();
      
      expect(result1.dataUrl).toBe(result2.dataUrl);
      expect(stats2.size).toBe(stats1.size); // Cache size should not increase
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const url = 'https://example.com/test';
      await generateQRCode(url);
      
      expect(getCacheStats().size).toBeGreaterThan(0);
      
      clearQRCodeCache();
      expect(getCacheStats().size).toBe(0);
    });

    it('should clear specific URL cache', async () => {
      const url1 = 'https://example.com/test1';
      const url2 = 'https://example.com/test2';
      
      await generateQRCode(url1);
      await generateQRCode(url2);
      
      expect(getCacheStats().size).toBe(2);
      
      clearQRCodeCache(url1);
      expect(getCacheStats().size).toBe(1);
    });
  });
});