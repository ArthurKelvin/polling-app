"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminStatus {
  isAdmin: boolean;
  role: string;
  userEmail: string;
  loading: boolean;
}

export function AdminAccessBanner() {
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    role: 'user',
    userEmail: '',
    loading: true
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setAdminStatus(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('/api/check-admin');
      const data = await response.json();
      
      if (data.success) {
        setAdminStatus({
          isAdmin: data.isAdmin,
          role: data.role,
          userEmail: data.userEmail,
          loading: false
        });
      } else {
        setAdminStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setAdminStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleMakeAdmin = async () => {
    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('🎉 Admin privileges granted! You now have access to the admin dashboard.');
        checkAdminStatus(); // Refresh status
      } else {
        toast.error(data.error || 'Failed to grant admin privileges');
      }
    } catch (error) {
      console.error('Failed to make admin:', error);
      toast.error('Failed to grant admin privileges');
    }
  };

  // Don't show banner if loading, already admin, or dismissed
  if (adminStatus.loading || adminStatus.isAdmin || dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Get Admin Access
              </h3>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Unlock powerful admin features to manage users, view analytics, and moderate content.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleMakeAdmin}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Crown className="h-4 w-4 mr-1" />
              Get Admin Access
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

