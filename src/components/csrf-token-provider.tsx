'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { generateCSRFTokenAction } from '@/lib/csrf-actions';

interface CSRFContextType {
  token: string | null;
  loading: boolean;
  error: string | null;
}

const CSRFContext = createContext<CSRFContextType>({
  token: null,
  loading: true,
  error: null,
});

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const csrfToken = await generateCSRFTokenAction();
        setToken(csrfToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate CSRF token');
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  return (
    <CSRFContext.Provider value={{ token, loading, error }}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF() {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

