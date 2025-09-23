import { generateQRCode, clearQRCodeCache, getCacheStats } from './generator';

/**
 * Debug utility for QR code generation and caching
 */
export async function debugQRCodeGeneration(url: string) {
  console.log('=== QR Code Debug ===');
  console.log('URL:', url);
  
  // Check initial cache state
  const initialCache = getCacheStats();
  console.log('Initial cache:', initialCache);
  
  // Generate first QR code
  console.log('Generating first QR code...');
  const firstResult = await generateQRCode(url);
  console.log('First generation result:', {
    success: !!firstResult.dataUrl,
    dataUrlLength: firstResult.dataUrl?.length || 0,
    cacheKey: firstResult.cacheKey
  });
  
  // Check cache after first generation
  const afterFirstCache = getCacheStats();
  console.log('Cache after first generation:', afterFirstCache);
  
  // Generate second QR code (should use cache)
  console.log('Generating second QR code (should use cache)...');
  const secondResult = await generateQRCode(url);
  console.log('Second generation result:', {
    success: !!secondResult.dataUrl,
    dataUrlLength: secondResult.dataUrl?.length || 0,
    cacheKey: secondResult.cacheKey,
    fromCache: secondResult.fromCache
  });
  
  // Clear cache
  console.log('Clearing cache...');
  clearQRCodeCache(url);
  const afterClearCache = getCacheStats();
  console.log('Cache after clear:', afterClearCache);
  
  // Generate third QR code (should regenerate)
  console.log('Generating third QR code (should regenerate)...');
  const thirdResult = await generateQRCode(url);
  console.log('Third generation result:', {
    success: !!thirdResult.dataUrl,
    dataUrlLength: thirdResult.dataUrl?.length || 0,
    cacheKey: thirdResult.cacheKey,
    fromCache: thirdResult.fromCache
  });
  
  console.log('=== Debug Complete ===');
  
  return {
    firstResult,
    secondResult,
    thirdResult,
    cacheStats: {
      initial: initialCache,
      afterFirst: afterFirstCache,
      afterClear: afterClearCache
    }
  };
}
