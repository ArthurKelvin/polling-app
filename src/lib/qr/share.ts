import { generateShareUrl } from './generator';

// Constants for better maintainability
const TEXT_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 200,
  TITLE_TRUNCATE_POSITION: 97,
  DESCRIPTION_TRUNCATE_POSITION: 197
} as const;

const DEFAULT_HASHTAGS = ['polling', 'vote', 'survey'] as const;

const WINDOW_OPTIONS = 'width=600,height=400,scrollbars=yes,resizable=yes' as const;

export interface ShareOptions {
  pollId: string;
  title?: string;
  description?: string;
  includeQR?: boolean;
}

export interface SocialShareData {
  url: string;
  title: string;
  description: string;
  hashtags?: readonly string[];
}

export interface ShareError extends Error {
  platform?: string;
  originalError?: Error;
}

/**
 * Truncates text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number, truncatePosition: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, truncatePosition) + '...';
}

/**
 * Validates share options
 */
function validateShareOptions(options: ShareOptions): void {
  if (!options.pollId || typeof options.pollId !== 'string') {
    throw new Error('Poll ID is required and must be a string');
  }
}

/**
 * Generates social sharing data for different platforms
 * @param options - Share options including poll details
 * @returns SocialShareData - Formatted data for social sharing
 */
export function generateSocialShareData(options: ShareOptions): SocialShareData {
  validateShareOptions(options);
  
  const { 
    pollId, 
    title = 'Check out this poll!', 
    description = 'Vote on this interesting poll.' 
  } = options;
  
  const url = generateShareUrl(pollId);
  
  return {
    url,
    title: truncateText(title, TEXT_LIMITS.TITLE_MAX_LENGTH, TEXT_LIMITS.TITLE_TRUNCATE_POSITION),
    description: truncateText(description, TEXT_LIMITS.DESCRIPTION_MAX_LENGTH, TEXT_LIMITS.DESCRIPTION_TRUNCATE_POSITION),
    hashtags: DEFAULT_HASHTAGS
  };
}

/**
 * Opens a new window with error handling
 */
function openShareWindow(url: string, platform: string): void {
  try {
    const newWindow = window.open(url, '_blank', WINDOW_OPTIONS);
    if (!newWindow) {
      throw new Error('Popup blocked or failed to open');
    }
  } catch (error) {
    const shareError: ShareError = new Error(`Failed to open ${platform} share window`);
    shareError.platform = platform;
    shareError.originalError = error instanceof Error ? error : new Error(String(error));
    throw shareError;
  }
}

/**
 * Opens Twitter share dialog
 * @param data - Social share data
 */
export function shareToTwitter(data: SocialShareData): void {
  try {
    const text = `${data.title}\n\n${data.description}\n\n${data.url}`;
    const hashtags = data.hashtags?.join(',') || '';
    
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', text);
    if (hashtags) {
      twitterUrl.searchParams.set('hashtags', hashtags);
    }
    
    openShareWindow(twitterUrl.toString(), 'Twitter');
  } catch (error) {
    console.error('Twitter share error:', error);
    throw error;
  }
}

/**
 * Opens Facebook share dialog
 * @param data - Social share data
 */
export function shareToFacebook(data: SocialShareData): void {
  try {
    const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
    facebookUrl.searchParams.set('u', data.url);
    facebookUrl.searchParams.set('quote', `${data.title}\n\n${data.description}`);
    
    openShareWindow(facebookUrl.toString(), 'Facebook');
  } catch (error) {
    console.error('Facebook share error:', error);
    throw error;
  }
}

/**
 * Opens LinkedIn share dialog
 * @param data - Social share data
 */
export function shareToLinkedIn(data: SocialShareData): void {
  try {
    const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    linkedInUrl.searchParams.set('url', data.url);
    linkedInUrl.searchParams.set('title', data.title);
    linkedInUrl.searchParams.set('summary', data.description);
    
    openShareWindow(linkedInUrl.toString(), 'LinkedIn');
  } catch (error) {
    console.error('LinkedIn share error:', error);
    throw error;
  }
}

/**
 * Copies text to clipboard with improved error handling
 * @param text - Text to copy
 * @returns Promise<boolean> - Success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to copy must be a non-empty string');
  }

  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers or non-secure contexts
    return await fallbackCopyToClipboard(text);
  } catch (error) {
    console.error('Clipboard copy error:', error);
    return false;
  }
}

/**
 * Fallback clipboard copy method for older browsers
 */
async function fallbackCopyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      resolve(success);
    } catch (error) {
      console.error('Fallback clipboard copy error:', error);
      resolve(false);
    }
  });
}

/**
 * Generates WhatsApp share URL
 * @param data - Social share data
 * @returns string - WhatsApp share URL
 */
export function generateWhatsAppUrl(data: SocialShareData): string {
  try {
    const text = `${data.title}\n\n${data.description}\n\n${data.url}`;
    const whatsappUrl = new URL('https://wa.me/');
    whatsappUrl.searchParams.set('text', text);
    return whatsappUrl.toString();
  } catch (error) {
    console.error('WhatsApp URL generation error:', error);
    throw new Error('Failed to generate WhatsApp share URL');
  }
}

/**
 * Generates email share URL
 * @param data - Social share data
 * @returns string - Email share URL
 */
export function generateEmailUrl(data: SocialShareData): string {
  try {
    const subject = encodeURIComponent(data.title);
    const body = encodeURIComponent(`${data.description}\n\n${data.url}`);
    
    return `mailto:?subject=${subject}&body=${body}`;
  } catch (error) {
    console.error('Email URL generation error:', error);
    throw new Error('Failed to generate email share URL');
  }
}

/**
 * Generates all share URLs for a given social share data
 * @param data - Social share data
 * @returns Object with all share URLs
 */
export function generateAllShareUrls(data: SocialShareData): {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  email: string;
} {
  const text = `${data.title}\n\n${data.description}\n\n${data.url}`;
  const hashtags = data.hashtags?.join(',') || '';
  
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.set('text', text);
  if (hashtags) {
    twitterUrl.searchParams.set('hashtags', hashtags);
  }
  
  const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
  facebookUrl.searchParams.set('u', data.url);
  facebookUrl.searchParams.set('quote', text);
  
  const linkedinUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
  linkedinUrl.searchParams.set('url', data.url);
  linkedinUrl.searchParams.set('title', data.title);
  linkedinUrl.searchParams.set('summary', data.description);
  
  const whatsappUrl = new URL('https://wa.me/');
  whatsappUrl.searchParams.set('text', text);
  
  const emailUrl = `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.description + '\n\n' + data.url)}`;
  
  return {
    twitter: twitterUrl.toString(),
    facebook: facebookUrl.toString(),
    linkedin: linkedinUrl.toString(),
    whatsapp: whatsappUrl.toString(),
    email: emailUrl
  };
}