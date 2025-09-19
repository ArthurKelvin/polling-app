// Constants for better maintainability
const STORAGE_KEYS = {
  QR_ANALYTICS: 'qr_analytics',
  SHARE_ANALYTICS: 'share_analytics',
  SESSION_ID: 'session_id',
  USER_ID: 'user_id'
} as const;

const STORAGE_LIMITS = {
  MAX_ENTRIES: 100,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
} as const;

const ANALYTICS_DEBOUNCE_MS = 1000;

export interface QRCodeAnalytics {
  pollId: string;
  shareMethod: 'qr' | 'link' | 'social' | 'email' | 'whatsapp';
  platform?: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email';
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
}

export interface ShareAnalytics {
  pollId: string;
  action: 'qr_generated' | 'qr_scanned' | 'link_copied' | 'social_shared';
  metadata?: Record<string, any>;
}

export interface AnalyticsEntry {
  pollId: string;
  action: string;
  timestamp: string;
  sessionId: string;
  userId: string;
  metadata?: Record<string, any>;
}

// Debounced analytics tracking
let analyticsQueue: AnalyticsEntry[] = [];
let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Debounced function to process analytics queue
 */
function processAnalyticsQueue(): void {
  if (analyticsQueue.length === 0) return;
  
  const entries = [...analyticsQueue];
  analyticsQueue = [];
  
  // Process entries in batches
  const batchSize = 10;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    processBatch(batch);
  }
}

/**
 * Process a batch of analytics entries
 */
function processBatch(entries: AnalyticsEntry[]): void {
  try {
    // Store QR analytics
    const qrEntries = entries.filter(entry => 
      entry.action === 'qr_generated' || entry.action === 'qr_scanned'
    );
    if (qrEntries.length > 0) {
      storeAnalytics(qrEntries, STORAGE_KEYS.QR_ANALYTICS);
    }
    
    // Store share analytics
    const shareEntries = entries.filter(entry => 
      entry.action === 'link_copied' || entry.action === 'social_shared'
    );
    if (shareEntries.length > 0) {
      storeAnalytics(shareEntries, STORAGE_KEYS.SHARE_ANALYTICS);
    }
  } catch (error) {
    console.error('Analytics batch processing error:', error);
  }
}

/**
 * Store analytics entries in localStorage
 */
function storeAnalytics(entries: AnalyticsEntry[], storageKey: string): void {
  try {
    const existingData = getStoredAnalytics(storageKey);
    const updatedData = [...existingData, ...entries].slice(-STORAGE_LIMITS.MAX_ENTRIES);
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  } catch (error) {
    console.error(`Failed to store ${storageKey}:`, error);
  }
}

/**
 * Get stored analytics data
 */
function getStoredAnalytics(storageKey: string): AnalyticsEntry[] {
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to get ${storageKey}:`, error);
    return [];
  }
}

/**
 * Debounced analytics tracking
 */
function trackAnalyticsDebounced(entry: AnalyticsEntry): void {
  analyticsQueue.push(entry);
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(processAnalyticsQueue, ANALYTICS_DEBOUNCE_MS);
}

/**
 * Tracks QR code usage analytics
 * @param analytics - Analytics data to track
 */
export async function trackQRCodeUsage(analytics: QRCodeAnalytics): Promise<void> {
  try {
    const entry: AnalyticsEntry = {
      pollId: analytics.pollId,
      action: analytics.shareMethod === 'qr' ? 'qr_generated' : 'qr_scanned',
      timestamp: analytics.timestamp.toISOString(),
      sessionId: getSessionId(),
      userId: getUserId(),
      metadata: {
        platform: analytics.platform,
        userAgent: analytics.userAgent,
        referrer: analytics.referrer
      }
    };

    trackAnalyticsDebounced(entry);
  } catch (error) {
    console.error('Failed to track QR code usage:', error);
  }
}

/**
 * Tracks general share analytics
 * @param analytics - Share analytics data
 */
export async function trackShareAnalytics(analytics: ShareAnalytics): Promise<void> {
  try {
    const entry: AnalyticsEntry = {
      pollId: analytics.pollId,
      action: analytics.action,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      userId: getUserId(),
      metadata: analytics.metadata
    };

    trackAnalyticsDebounced(entry);
  } catch (error) {
    console.error('Failed to track share analytics:', error);
  }
}

/**
 * Gets analytics data from localStorage (for demo purposes)
 * @param type - Type of analytics to retrieve
 * @returns Array of analytics data
 */
export function getAnalyticsData(type: 'qr' | 'share' = 'qr'): AnalyticsEntry[] {
  const storageKey = type === 'qr' ? STORAGE_KEYS.QR_ANALYTICS : STORAGE_KEYS.SHARE_ANALYTICS;
  return getStoredAnalytics(storageKey);
}

/**
 * Clears analytics data from localStorage
 * @param type - Type of analytics to clear
 */
export function clearAnalyticsData(type: 'qr' | 'share' = 'qr'): void {
  const storageKey = type === 'qr' ? STORAGE_KEYS.QR_ANALYTICS : STORAGE_KEYS.SHARE_ANALYTICS;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Failed to clear ${storageKey}:`, error);
  }
}

/**
 * Gets or creates a session ID with timeout
 * @returns string - Session ID
 */
function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
    let sessionData: { id: string; timestamp: number } | null = null;
    
    if (sessionId) {
      try {
        sessionData = JSON.parse(sessionId);
      } catch {
        // Invalid session data, create new one
        sessionData = null;
      }
    }
    
    const now = Date.now();
    const isExpired = sessionData && (now - sessionData.timestamp) > STORAGE_LIMITS.SESSION_TIMEOUT;
    
    if (!sessionData || isExpired) {
      const newSessionId = `session_${now}_${Math.random().toString(36).substr(2, 9)}`;
      const newSessionData = { id: newSessionId, timestamp: now };
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, JSON.stringify(newSessionData));
      return newSessionId;
    }
    
    return sessionData.id;
  } catch (error) {
    console.error('Failed to get session ID:', error);
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Gets user ID from localStorage or generates a temporary one
 * @returns string - User ID
 */
function getUserId(): string {
  try {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Gets analytics summary for a specific poll
 * @param pollId - The poll ID to get analytics for
 * @returns Object with analytics summary
 */
export function getPollAnalyticsSummary(pollId: string): {
  totalShares: number;
  qrGenerations: number;
  socialShares: number;
  linkCopies: number;
  platforms: Record<string, number>;
  recentActivity: AnalyticsEntry[];
} {
  const qrData = getAnalyticsData('qr').filter(item => item.pollId === pollId);
  const shareData = getAnalyticsData('share').filter(item => item.pollId === pollId);
  
  const allData = [...qrData, ...shareData].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const summary = {
    totalShares: allData.length,
    qrGenerations: qrData.filter(item => item.action === 'qr_generated').length,
    socialShares: shareData.filter(item => item.action === 'social_shared').length,
    linkCopies: shareData.filter(item => item.action === 'link_copied').length,
    platforms: {} as Record<string, number>,
    recentActivity: allData.slice(0, 10) // Last 10 activities
  };

  // Count platform usage
  allData.forEach(item => {
    if (item.metadata?.platform) {
      summary.platforms[item.metadata.platform] = (summary.platforms[item.metadata.platform] || 0) + 1;
    }
  });

  return summary;
}

/**
 * Exports analytics data for external use
 * @param type - Type of analytics to export
 * @returns Promise<string> - JSON string of analytics data
 */
export async function exportAnalyticsData(type: 'qr' | 'share' | 'all' = 'all'): Promise<string> {
  try {
    let data: { qr: AnalyticsEntry[]; share: AnalyticsEntry[] } = {
      qr: [],
      share: []
    };
    
    if (type === 'all' || type === 'qr') {
      data.qr = getAnalyticsData('qr');
    }
    
    if (type === 'all' || type === 'share') {
      data.share = getAnalyticsData('share');
    }
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export analytics data:', error);
    throw new Error('Failed to export analytics data');
  }
}

/**
 * Clears all analytics data
 */
export function clearAllAnalyticsData(): void {
  clearAnalyticsData('qr');
  clearAnalyticsData('share');
  analyticsQueue = [];
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}