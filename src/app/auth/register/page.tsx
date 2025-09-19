"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { CheckCircle, Mail } from "lucide-react";

function RegisterForm() {
  const { signUpWithPassword, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShowConfirmation(false);
    setSubmitting(true);
    
    const { error, needsConfirmation, data } = await signUpWithPassword({ email, password });
    setSubmitting(false);
    
    if (error) {
      setError(error.message);
      return;
    }
    
    // If user needs email confirmation, show confirmation banner
    if (needsConfirmation) {
      setRegisteredEmail(email);
      setShowConfirmation(true);
      setEmail("");
      setPassword("");
      return;
    }
    
    // If user is automatically logged in (no confirmation needed)
    const redirectTo = searchParams.get('redirectTo') || '/polls';
    router.replace(redirectTo);
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      
      {showConfirmation ? (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Check your email!</AlertTitle>
          <AlertDescription className="mt-2">
            We've sent a confirmation link to <strong>{registeredEmail}</strong>. 
            Please check your email and click the link to verify your account before you can sign in.
          </AlertDescription>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span>Didn't receive the email? Check your spam folder or try again.</span>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowConfirmation(false)}
              className="mr-2"
            >
              Try again
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/auth/login')}
            >
              Go to sign in
            </Button>
          </div>
        </Alert>
      ) : (
        <>
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
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="text-sm mt-4">
            Have an account? <Link href="/auth/login" className="underline">Sign in</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}


