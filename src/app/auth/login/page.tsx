"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SuccessAnimation, LoadingOverlay } from "@/components/ui/loading-spinner";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const { signInWithPassword, resetPassword, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setIsLoggingIn(true);
    
    const { error } = await signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setIsLoggingIn(false);
    } else {
      // Show success animation
      setShowSuccess(true);
      // Redirect after animation
      setTimeout(() => {
        const redirectTo = searchParams.get('redirectTo') || '/polls';
        router.replace(redirectTo);
      }, 2000);
    }
    
    setSubmitting(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetSubmitting(true);
    
    const { error, success } = await resetPassword(resetEmail);
    setResetSubmitting(false);
    
    if (error) {
      setError(error.message);
      return;
    }
    
    if (success) {
      setResetEmailSent(true);
      setError(null);
    }
  }

  if (resetEmailSent) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Check your email!</AlertTitle>
          <AlertDescription className="mt-2">
            We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>. 
            Please check your email and click the link to reset your password.
          </AlertDescription>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span>Didn&apos;t receive the email? Check your spam folder or try again.</span>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setResetEmailSent(false);
                setShowForgotPassword(false);
                setResetEmail("");
              }}
              className="mr-2"
            >
              Try again
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setResetEmailSent(false);
                setShowForgotPassword(false);
                setResetEmail("");
              }}
            >
              Back to login
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowForgotPassword(false)}
            className="p-0 h-auto text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Button>
        </div>
        <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input 
              type="email" 
              value={resetEmail} 
              onChange={(e) => setResetEmail(e.target.value)} 
              required 
              placeholder="Enter your email address"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={resetSubmitting || loading} className="w-full">
            {resetSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-sm p-6">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={submitting || loading} className="w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            No account? <Link href="/auth/register" className="underline">Create one</Link>
          </p>
          <p className="text-sm">
            <button 
              onClick={() => setShowForgotPassword(true)}
              className="underline hover:text-gray-800"
            >
              Forgot your password?
            </button>
          </p>
        </div>
      </div>
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoggingIn} 
        text="Signing you in..." 
      />
      
      {/* Success Animation */}
      <SuccessAnimation 
        isVisible={showSuccess}
        text="Welcome back!"
        onComplete={() => setShowSuccess(false)}
        duration={2000}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}


