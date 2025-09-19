import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8"
};

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  className?: string;
}

export function LoadingOverlay({ isVisible, text = "Loading...", className }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center",
      className
    )}>
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium">{text}</p>
      </div>
    </div>
  );
}

interface SuccessAnimationProps {
  isVisible: boolean;
  text?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({ 
  isVisible, 
  text = "Success!", 
  onComplete,
  duration = 2000 
}: SuccessAnimationProps) {
  if (!isVisible) return null;

  // Auto-hide after duration
  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, duration]);

  return (
    <div className="fixed inset-0 bg-green-50/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center space-y-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-600 animate-in scale-in-0 duration-500 delay-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-20" />
        </div>
        <p className="text-green-700 font-semibold text-lg">{text}</p>
        <div className="w-32 h-1 bg-green-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-in slide-in-from-left-0 duration-2000" />
        </div>
      </div>
    </div>
  );
}

