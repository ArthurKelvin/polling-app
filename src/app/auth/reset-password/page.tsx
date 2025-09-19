"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/auth/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setValidSession(true);
      } else {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Password Reset Successful!</AlertTitle>
          <AlertDescription className="mt-2">
            Your password has been successfully updated. You will be redirected to the login page shortly.
          </AlertDescription>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/auth/login')}
            >
              Go to Login
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Reset Link</AlertTitle>
          <AlertDescription className="mt-2">
            {error || "This password reset link is invalid or has expired. Please request a new one."}
          </AlertDescription>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/auth/login')}
              className="mr-2"
            >
              Back to Login
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/auth/register')}
            >
              Create Account
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <div className="mb-4">
        <Link 
          href="/auth/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to login
        </Link>
      </div>
      
      <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>
      <p className="text-sm text-gray-600 mb-6">
        Enter your new password below.
      </p>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Enter your new password"
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <Input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            placeholder="Confirm your new password"
            minLength={6}
          />
        </div>
        {error ? (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
