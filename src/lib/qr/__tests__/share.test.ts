import { 
  generateSocialShareData, 
  generateWhatsAppUrl, 
  generateEmailUrl,
  generateAllShareUrls,
  copyToClipboard
} from '../share';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
});

// Mock window.isSecureContext
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: true
});

describe('Share Utilities', () => {
  describe('generateSocialShareData', () => {
    it('should generate correct social share data', () => {
      const options = {
        pollId: 'test-poll-123',
        title: 'Test Poll Title',
        description: 'Test poll description'
      };
      
      const result = generateSocialShareData(options);
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('hashtags');
      expect(result.url).toContain('test-poll-123');
      expect(result.title).toBe('Test Poll Title');
      expect(result.description).toBe('Test poll description');
      expect(result.hashtags).toEqual(['polling', 'vote', 'survey']);
    });

    it('should truncate long titles and descriptions', () => {
      const options = {
        pollId: 'test-poll-123',
        title: 'A'.repeat(150), // Very long title
        description: 'B'.repeat(250) // Very long description
      };
      
      const result = generateSocialShareData(options);
      
      expect(result.title).toHaveLength(100); // Should be truncated
      expect(result.title.endsWith('...')).toBe(true);
      expect(result.description).toHaveLength(200); // Should be truncated
      expect(result.description.endsWith('...')).toBe(true);
    });

    it('should use default values when not provided', () => {
      const options = {
        pollId: 'test-poll-123'
      };
      
      const result = generateSocialShareData(options);
      
      expect(result.title).toBe('Check out this poll!');
      expect(result.description).toBe('Vote on this interesting poll.');
    });

    it('should throw error for invalid poll ID', () => {
      expect(() => generateSocialShareData({ pollId: '' })).toThrow('Poll ID is required and must be a string');
      expect(() => generateSocialShareData({ pollId: null as any })).toThrow('Poll ID is required and must be a string');
    });
  });

  describe('generateWhatsAppUrl', () => {
    it('should generate correct WhatsApp URL', () => {
      const data = {
        url: 'https://example.com/poll/123',
        title: 'Test Poll',
        description: 'Test Description',
        hashtags: ['poll']
      };
      
      const result = generateWhatsAppUrl(data);
      
      expect(result).toContain('wa.me');
      expect(result).toContain('Test+Poll'); // URL encoded
      expect(result).toContain('Test+Description'); // URL encoded
      expect(result).toContain('https%3A%2F%2Fexample.com%2Fpoll%2F123'); // URL encoded
    });

    it('should handle special characters in URL', () => {
      const data = {
        url: 'https://example.com/poll/123?param=value&other=test',
        title: 'Test & Poll',
        description: 'Test "Description"',
        hashtags: ['poll']
      };
      
      const result = generateWhatsAppUrl(data);
      
      expect(result).toContain('wa.me');
      expect(result).toContain('Test+%26+Poll'); // URL encoded
      expect(result).toContain('Test+%22Description%22'); // URL encoded
    });
  });

  describe('generateEmailUrl', () => {
    it('should generate correct email URL', () => {
      const data = {
        url: 'https://example.com/poll/123',
        title: 'Test Poll',
        description: 'Test Description',
        hashtags: ['poll']
      };
      
      const result = generateEmailUrl(data);
      
      expect(result).toContain('mailto:');
      expect(result).toContain('subject=');
      expect(result).toContain('body=');
      expect(result).toContain('Test%20Poll'); // URL encoded
      expect(result).toContain('Test%20Description'); // URL encoded
    });
  });

  describe('generateAllShareUrls', () => {
    it('should generate all share URLs', () => {
      const data = {
        url: 'https://example.com/poll/123',
        title: 'Test Poll',
        description: 'Test Description',
        hashtags: ['poll']
      };
      
      const result = generateAllShareUrls(data);
      
      expect(result).toHaveProperty('twitter');
      expect(result).toHaveProperty('facebook');
      expect(result).toHaveProperty('linkedin');
      expect(result).toHaveProperty('whatsapp');
      expect(result).toHaveProperty('email');
      
      expect(result.twitter).toContain('twitter.com');
      expect(result.facebook).toContain('facebook.com');
      expect(result.linkedin).toContain('linkedin.com');
      expect(result.whatsapp).toContain('wa.me');
      expect(result.email).toContain('mailto:');
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should copy text to clipboard using modern API', async () => {
      const text = 'Test text to copy';
      
      const result = await copyToClipboard(text);
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });

    it('should throw error for invalid input', async () => {
      await expect(copyToClipboard('')).rejects.toThrow('Text to copy must be a non-empty string');
      await expect(copyToClipboard(null as any)).rejects.toThrow('Text to copy must be a non-empty string');
    });

    it('should handle clipboard API errors', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
      
      const result = await copyToClipboard('test');
      
      expect(result).toBe(false);
    });
  });
});