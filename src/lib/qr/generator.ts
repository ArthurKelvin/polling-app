import QRCode from 'qrcode';

// Constants for better maintainability and performance
const DEFAULT_CONFIG = {
  size: 256,
  color: '#000000',
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'M' as const,
  margin: 1
} as const;

const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

export interface QRCodeConfig {
  size?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export interface QRCodeResult {
  dataUrl: string;
  size: number;
  errorCorrectionLevel: string;
  cacheKey?: string;
  fromCache?: boolean;
}

export interface QRCodeCache {
  [key: string]: QRCodeResult;
}

// Simple in-memory cache for QR codes
const qrCodeCache: QRCodeCache = {};

/**
 * Generates a cache key for QR code configuration
 */
function generateCacheKey(url: string, config: QRCodeConfig): string {
  return `${url}-${JSON.stringify(config)}`;
}

/**
 * Generates a QR code as a base64 data URL with caching
 * @param url - The URL to encode in the QR code
 * @param config - Optional configuration for the QR code
 * @returns Promise<QRCodeResult> - The generated QR code data
 */
export async function generateQRCode(
  url: string,
  config: QRCodeConfig = {}
): Promise<QRCodeResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheKey = generateCacheKey(url, mergedConfig);
  
  // Check cache first
  if (qrCodeCache[cacheKey]) {
    return {
      ...qrCodeCache[cacheKey],
      cacheKey,
      fromCache: true
    };
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: mergedConfig.size,
      color: {
        dark: mergedConfig.color,
        light: mergedConfig.backgroundColor
      },
      errorCorrectionLevel: mergedConfig.errorCorrectionLevel,
      margin: mergedConfig.margin,
      type: 'image/png'
    });

    const result: QRCodeResult = {
      dataUrl,
      size: mergedConfig.size,
      errorCorrectionLevel: mergedConfig.errorCorrectionLevel,
      cacheKey,
      fromCache: false
    };

    // Cache the result (without the cache metadata)
    qrCodeCache[cacheKey] = {
      dataUrl,
      size: mergedConfig.size,
      errorCorrectionLevel: mergedConfig.errorCorrectionLevel
    };
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate QR code: ${errorMessage}`);
  }
}

/**
 * Generates a QR code as SVG string with caching
 * @param url - The URL to encode in the QR code
 * @param config - Optional configuration for the QR code
 * @returns Promise<string> - The generated QR code as SVG
 */
export async function generateQRCodeSVG(
  url: string,
  config: QRCodeConfig = {}
): Promise<string> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheKey = `svg-${generateCacheKey(url, mergedConfig)}`;
  
  // Check cache first
  if (qrCodeCache[cacheKey]) {
    return qrCodeCache[cacheKey].dataUrl;
  }

  try {
    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: mergedConfig.size,
      color: {
        dark: mergedConfig.color,
        light: mergedConfig.backgroundColor
      },
      errorCorrectionLevel: mergedConfig.errorCorrectionLevel,
      margin: mergedConfig.margin
    });

    // Cache the result
    qrCodeCache[cacheKey] = {
      dataUrl: svgString,
      size: mergedConfig.size,
      errorCorrectionLevel: mergedConfig.errorCorrectionLevel
    };
    
    return svgString;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate QR code SVG: ${errorMessage}`);
  }
}

/**
 * Validates if a URL is safe for QR code generation
 * @param url - The URL to validate
 * @returns boolean - Whether the URL is safe
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return (ALLOWED_PROTOCOLS as readonly string[]).includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Generates a shareable URL for a poll
 * @param pollId - The ID of the poll
 * @param baseUrl - The base URL of the application
 * @returns string - The complete shareable URL
 */
export function generateShareUrl(
  pollId: string, 
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): string {
  if (!pollId || typeof pollId !== 'string') {
    throw new Error('Poll ID is required and must be a string');
  }
  
  return `${baseUrl.replace(/\/$/, '')}/polls/${pollId}`;
}

/**
 * Clears the QR code cache
 * @param url - Optional URL to clear specific cache entry
 */
export function clearQRCodeCache(url?: string): void {
  if (url) {
    // Find keys that start with the URL followed by a dash (since cache key format is `${url}-${config}`)
    const keys = Object.keys(qrCodeCache).filter(key => key.startsWith(`${url}-`));
    keys.forEach(key => delete qrCodeCache[key]);
  } else {
    Object.keys(qrCodeCache).forEach(key => delete qrCodeCache[key]);
  }
}

/**
 * Gets cache statistics
 * @returns Object with cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: Object.keys(qrCodeCache).length,
    keys: Object.keys(qrCodeCache)
  };
}