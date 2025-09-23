"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, User, Shield } from 'lucide-react';

interface AdminStatus {
  isAdmin: boolean;
  role: string;
  loading: boolean;
}

export function AdminStatusIndicator() {
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    role: 'user',
    loading: true
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/check-admin');
      const data = await response.json();
      
      if (data.success) {
        setAdminStatus({
          isAdmin: data.isAdmin,
          role: data.role,
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

  if (adminStatus.loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <User className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (adminStatus.isAdmin) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Crown className="h-3 w-3" />
        ADMIN
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Shield className="h-3 w-3" />
      {adminStatus.role.toUpperCase()}
    </Badge>
  );
}

