"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Database,
  Shield,
  Mail,
  Bell,
  Globe,
  Lock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxPollsPerUser: number;
  maxOptionsPerPoll: number;
  pollExpirationDays: number;
  enableComments: boolean;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export function PlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: 'Polling Platform',
    siteDescription: 'Create and share polls with real-time results',
    allowRegistration: true,
    requireEmailVerification: true,
    maxPollsPerUser: 50,
    maxOptionsPerPoll: 10,
    pollExpirationDays: 30,
    enableComments: true,
    enableNotifications: true,
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back later.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof PlatformSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Platform Settings
          </h2>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSettings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="maxPollsPerUser">Max Polls Per User</Label>
              <Input
                id="maxPollsPerUser"
                type="number"
                value={settings.maxPollsPerUser}
                onChange={(e) => handleSettingChange('maxPollsPerUser', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
              placeholder="Enter site description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Settings
          </CardTitle>
          <CardDescription>User registration and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowRegistration">Allow User Registration</Label>
              <p className="text-sm text-gray-500">Allow new users to register accounts</p>
            </div>
            <Switch
              id="allowRegistration"
              checked={settings.allowRegistration}
              onCheckedChange={(checked) => handleSettingChange('allowRegistration', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
              <p className="text-sm text-gray-500">Require users to verify their email address</p>
            </div>
            <Switch
              id="requireEmailVerification"
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Poll Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Poll Settings
          </CardTitle>
          <CardDescription>Poll creation and management limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxOptionsPerPoll">Max Options Per Poll</Label>
              <Input
                id="maxOptionsPerPoll"
                type="number"
                value={settings.maxOptionsPerPoll}
                onChange={(e) => handleSettingChange('maxOptionsPerPoll', parseInt(e.target.value))}
                min="2"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="pollExpirationDays">Poll Expiration (Days)</Label>
              <Input
                id="pollExpirationDays"
                type="number"
                value={settings.pollExpirationDays}
                onChange={(e) => handleSettingChange('pollExpirationDays', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableComments">Enable Comments</Label>
              <p className="text-sm text-gray-500">Allow users to comment on polls</p>
            </div>
            <Switch
              id="enableComments"
              checked={settings.enableComments}
              onCheckedChange={(checked) => handleSettingChange('enableComments', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Email and push notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableNotifications">Enable Notifications</Label>
              <p className="text-sm text-gray-500">Send email notifications for poll updates</p>
            </div>
            <Switch
              id="enableNotifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Put the platform in maintenance mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
              <p className="text-sm text-gray-500">Temporarily disable public access to the platform</p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
            />
          </div>
          {settings.maintenanceMode && (
            <div>
              <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
                placeholder="Enter maintenance message"
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
