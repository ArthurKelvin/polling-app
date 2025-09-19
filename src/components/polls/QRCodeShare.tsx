'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Share2, Copy, Download, Twitter, Facebook, Linkedin, MessageCircle, Mail } from 'lucide-react';
import { generateQRCode, generateShareUrl, isValidUrl } from '@/lib/qr/generator';
import { 
  generateSocialShareData, 
  shareToTwitter, 
  shareToFacebook, 
  shareToLinkedIn, 
  copyToClipboard,
  generateWhatsAppUrl,
  generateEmailUrl
} from '@/lib/qr/share';
import { trackQRCodeUsage, trackShareAnalytics } from '@/lib/qr/analytics';

// Constants for better maintainability
const QR_CODE_CONFIG = {
  size: 256,
  color: '#1f2937',
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'M' as const
} as const;

const COPY_FEEDBACK_DURATION = 2000;

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'Twitter', icon: Twitter, handler: shareToTwitter },
  { id: 'facebook', label: 'Facebook', icon: Facebook, handler: shareToFacebook },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, handler: shareToLinkedIn },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, handler: null },
  { id: 'email', label: 'Email', icon: Mail, handler: null }
] as const;

interface QRCodeShareProps {
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
  className?: string;
}

interface ComponentState {
  qrCodeData: string | null;
  isGenerating: boolean;
  isCopied: boolean;
  error: string | null;
}

export function QRCodeShare({ 
  pollId, 
  pollTitle, 
  pollDescription = 'Vote on this interesting poll!',
  className = ''
}: QRCodeShareProps) {
  const [state, setState] = useState<ComponentState>({
    qrCodeData: null,
    isGenerating: false,
    isCopied: false,
    error: null
  });

  // Memoized values to prevent unnecessary recalculations
  const shareUrl = useMemo(() => generateShareUrl(pollId), [pollId]);
  
  const socialData = useMemo(() => 
    generateSocialShareData({
      pollId,
      title: pollTitle,
      description: pollDescription
    }), [pollId, pollTitle, pollDescription]
  );

  // State update helpers for better readability
  const updateState = useCallback((updates: Partial<ComponentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const setGenerating = useCallback((isGenerating: boolean) => {
    updateState({ isGenerating });
  }, [updateState]);

  // QR Code generation with improved error handling
  const generateQR = useCallback(async () => {
    if (!isValidUrl(shareUrl)) {
      updateState({ error: 'Invalid URL for QR code generation' });
      return;
    }

    setGenerating(true);
    resetError();

    try {
      const qrResult = await generateQRCode(shareUrl, QR_CODE_CONFIG);
      
      updateState({ qrCodeData: qrResult.dataUrl });

      // Track QR code generation (non-blocking)
      trackQRCodeUsage({
        pollId,
        shareMethod: 'qr',
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }).catch(console.error);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      updateState({ error: errorMessage });
    } finally {
      setGenerating(false);
    }
  }, [pollId, shareUrl, updateState, setGenerating, resetError]);

  // Copy link functionality with better UX
  const handleCopyLink = useCallback(async () => {
    try {
      const success = await copyToClipboard(shareUrl);
      
      if (success) {
        updateState({ isCopied: true });
        setTimeout(() => updateState({ isCopied: false }), COPY_FEEDBACK_DURATION);

        // Track link copy (non-blocking)
        trackShareAnalytics({
          pollId,
          action: 'link_copied'
        }).catch(console.error);
      } else {
        updateState({ error: 'Failed to copy link to clipboard' });
      }
    } catch (error) {
      updateState({ error: 'Failed to copy link to clipboard' });
    }
  }, [pollId, shareUrl, updateState]);

  // Social sharing with improved error handling
  const handleSocialShare = useCallback(async (platform: typeof SOCIAL_PLATFORMS[number]) => {
    try {
      // Track social share (non-blocking)
      trackShareAnalytics({
        pollId,
        action: 'social_shared',
        metadata: { platform: platform.id }
      }).catch(console.error);

      if (platform.handler) {
        platform.handler(socialData);
      } else if (platform.id === 'whatsapp') {
        window.open(generateWhatsAppUrl(socialData), '_blank', 'width=600,height=400');
      } else if (platform.id === 'email') {
        window.open(generateEmailUrl(socialData), '_blank');
      }
    } catch (error) {
      updateState({ error: `Failed to share on ${platform.label}` });
    }
  }, [pollId, socialData, updateState]);

  // QR code download with error handling
  const handleDownloadQR = useCallback(() => {
    if (!state.qrCodeData) return;

    try {
      const link = document.createElement('a');
      link.href = state.qrCodeData;
      link.download = `poll-${pollId}-qr-code.png`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      updateState({ error: 'Failed to download QR code' });
    }
  }, [state.qrCodeData, pollId, updateState]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Poll
        </CardTitle>
        <CardDescription>
          Share this poll with others via QR code or social media
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copy Link Section */}
        <LinkShareSection 
          shareUrl={shareUrl}
          isCopied={state.isCopied}
          onCopy={handleCopyLink}
        />

        {/* QR Code Section */}
        <QRCodeSection
          qrCodeData={state.qrCodeData}
          isGenerating={state.isGenerating}
          onGenerate={generateQR}
          onDownload={handleDownloadQR}
        />

        {/* Social Media Sharing */}
        <SocialShareSection
          platforms={SOCIAL_PLATFORMS}
          onShare={handleSocialShare}
        />

        {/* Error Display */}
        {state.error && (
          <ErrorDisplay 
            error={state.error} 
            onDismiss={() => updateState({ error: null })}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Extracted sub-components for better readability
interface LinkShareSectionProps {
  shareUrl: string;
  isCopied: boolean;
  onCopy: () => void;
}

function LinkShareSection({ shareUrl, isCopied, onCopy }: LinkShareSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Share Link</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          onClick={onCopy}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 min-w-[80px]"
        >
          <Copy className="h-4 w-4" />
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

interface QRCodeSectionProps {
  qrCodeData: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onDownload: () => void;
}

function QRCodeSection({ qrCodeData, isGenerating, onGenerate, onDownload }: QRCodeSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">QR Code</label>
      {!qrCodeData ? (
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full"
          variant="outline"
        >
          <QrCode className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate QR Code'}
        </Button>
      ) : (
        <div className="text-center space-y-2">
          <img
            src={qrCodeData}
            alt="QR Code for poll"
            className="mx-auto border border-gray-200 rounded-lg shadow-sm"
            loading="lazy"
          />
          <div className="flex gap-2 justify-center">
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={onGenerate}
              variant="outline"
              size="sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SocialShareSectionProps {
  platforms: typeof SOCIAL_PLATFORMS;
  onShare: (platform: typeof SOCIAL_PLATFORMS[number]) => void;
}

function SocialShareSection({ platforms, onShare }: SocialShareSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Share on Social Media</label>
      <div className="flex gap-2 flex-wrap">
        {platforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <Button
              key={platform.id}
              onClick={() => onShare(platform)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {platform.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200 flex items-center justify-between">
      <span>{error}</span>
      <Button
        onClick={onDismiss}
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
      >
        ×
      </Button>
    </div>
  );
}