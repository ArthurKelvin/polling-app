'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, QrCode, Share2 } from 'lucide-react';
import { generateQRCode, generateShareUrl, isValidUrl, clearQRCodeCache } from '@/lib/qr/generator';
import { trackQRCodeUsage } from '@/lib/qr/analytics';

// Constants for better maintainability
const QR_CODE_CONFIG = {
  size: 300,
  color: '#1f2937',
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'H' as const
} as const;

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
}

interface ModalState {
  qrCodeData: string | null;
  isGenerating: boolean;
  error: string | null;
}

export function QRCodeModal({ 
  isOpen, 
  onClose, 
  pollId, 
  pollTitle, 
  pollDescription = 'Vote on this interesting poll!'
}: QRCodeModalProps) {
  const [state, setState] = useState<ModalState>({
    qrCodeData: null,
    isGenerating: false,
    error: null
  });

  const shareUrl = useMemo(() => generateShareUrl(pollId), [pollId]);

  // State update helpers
  const updateState = useCallback((updates: Partial<ModalState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Generate QR code when modal opens
  const generateQR = useCallback(async (clearCache = false) => {
    if (!isValidUrl(shareUrl)) {
      updateState({ error: 'Invalid URL for QR code generation' });
      return;
    }

    // Clear cache if requested (for regeneration)
    if (clearCache) {
      clearQRCodeCache(shareUrl);
    }

    updateState({ isGenerating: true, error: null });

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
      updateState({ isGenerating: false });
    }
  }, [pollId, shareUrl, updateState]);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && !state.qrCodeData && !state.isGenerating) {
      generateQR();
    }
  }, [isOpen, state.qrCodeData, state.isGenerating, generateQR]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

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

  const handleRegenerate = useCallback(() => {
    console.log('QR Code regeneration requested');
    updateState({ qrCodeData: null, error: null });
    // Force regeneration by calling generateQR with clearCache=true
    generateQR(true);
  }, [generateQR, updateState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Share
            </CardTitle>
            <CardDescription className="line-clamp-2">
              Scan to vote on: {pollTitle}
            </CardDescription>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error ? (
            <ErrorState 
              error={state.error} 
              onRetry={handleRegenerate}
            />
          ) : state.qrCodeData ? (
            <QRCodeDisplay 
              qrCodeData={state.qrCodeData}
              onDownload={handleDownloadQR}
              onRegenerate={handleRegenerate}
            />
          ) : (
            <LoadingState 
              isGenerating={state.isGenerating}
              onGenerate={generateQR}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Extracted sub-components for better readability
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center space-y-4">
      <div className="text-red-600 text-sm bg-red-50 p-4 rounded-md border border-red-200">
        {error}
      </div>
      <Button
        onClick={onRetry}
        className="w-full"
        variant="outline"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

interface QRCodeDisplayProps {
  qrCodeData: string;
  onDownload: () => void;
  onRegenerate: () => void;
}

function QRCodeDisplay({ qrCodeData, onDownload, onRegenerate }: QRCodeDisplayProps) {
  return (
    <div className="text-center space-y-4">
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block shadow-sm">
        <img
          src={qrCodeData}
          alt="QR Code for poll"
          className="w-64 h-64"
          loading="lazy"
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Scan this QR code to vote on the poll
        </p>
        <div className="flex gap-2">
          <Button
            onClick={onDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={onRegenerate}
            variant="outline"
            className="flex-1"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  isGenerating: boolean;
  onGenerate: () => void;
}

function LoadingState({ isGenerating, onGenerate }: LoadingStateProps) {
  return (
    <div className="text-center space-y-4">
      <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
        {isGenerating ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="text-sm text-gray-600">Generating...</span>
          </div>
        ) : (
          <QrCode className="h-16 w-16 text-gray-400" />
        )}
      </div>
      {!isGenerating && (
        <Button
          onClick={onGenerate}
          className="w-full"
        >
          <QrCode className="h-4 w-4 mr-2" />
          Generate QR Code
        </Button>
      )}
    </div>
  );
}