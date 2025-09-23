"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminStatus {
  isAdmin: boolean;
  role: string;
  userEmail: string;
  loading: boolean;
}

export function AdminAccessButton() {
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    role: 'user',
    userEmail: '',
    loading: true
  });

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
        toast.success('Admin privileges granted!');
        checkAdminStatus(); // Refresh status
      } else {
        toast.error(data.error || 'Failed to grant admin privileges');
      }
    } catch (error) {
      console.error('Failed to make admin:', error);
      toast.error('Failed to grant admin privileges');
    }
  };

  if (adminStatus.loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (adminStatus.isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          ADMIN
        </Badge>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Admin Panel
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-1">
        <Settings className="h-3 w-3" />
        {adminStatus.role.toUpperCase()}
      </Badge>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleMakeAdmin}
        className="flex items-center gap-1"
      >
        <Crown className="h-4 w-4" />
        Get Admin Access
      </Button>
    </div>
  );
}

