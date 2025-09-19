"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferences {
  emailNotifications: boolean;
  pollCreated: boolean;
  pollClosing: boolean;
  pollResults: boolean;
  newComments: boolean;
  closingReminderHours: number;
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pollCreated: true,
    pollClosing: true,
    pollResults: true,
    newComments: true,
    closingReminderHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user preferences
  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save user preferences
  const savePreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading preferences...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications about polls and activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Email Notifications Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-base font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Receive email notifications for poll activities
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>

          {/* Individual notification settings */}
          {preferences.emailNotifications && (
            <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="poll-created" className="text-sm font-medium">
                    New Polls
                  </Label>
                  <p className="text-xs text-gray-600">
                    Get notified when polls you follow are created
                  </p>
                </div>
                <Switch
                  id="poll-created"
                  checked={preferences.pollCreated}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pollCreated: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="poll-closing" className="text-sm font-medium">
                    Poll Closing Reminders
                  </Label>
                  <p className="text-xs text-gray-600">
                    Get reminded when polls are about to close
                  </p>
                </div>
                <Switch
                  id="poll-closing"
                  checked={preferences.pollClosing}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pollClosing: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="poll-results" className="text-sm font-medium">
                    Poll Results
                  </Label>
                  <p className="text-xs text-gray-600">
                    Get notified when poll results are available
                  </p>
                </div>
                <Switch
                  id="poll-results"
                  checked={preferences.pollResults}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pollResults: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-comments" className="text-sm font-medium">
                    New Comments
                  </Label>
                  <p className="text-xs text-gray-600">
                    Get notified when someone comments on your polls
                  </p>
                </div>
                <Switch
                  id="new-comments"
                  checked={preferences.newComments}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, newComments: checked }))
                  }
                />
              </div>

              {/* Closing reminder hours */}
              {preferences.pollClosing && (
                <div className="space-y-2">
                  <Label htmlFor="closing-hours" className="text-sm font-medium">
                    Reminder Time (hours before closing)
                  </Label>
                  <Input
                    id="closing-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={preferences.closingReminderHours}
                    onChange={(e) => 
                      setPreferences(prev => ({ 
                        ...prev, 
                        closingReminderHours: Math.max(1, parseInt(e.target.value) || 24)
                      }))
                    }
                    className="w-20"
                  />
                  <p className="text-xs text-gray-600">
                    How many hours before a poll closes should you be reminded?
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
