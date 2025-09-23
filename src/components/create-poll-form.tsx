'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCSRF } from './csrf-token-provider';
import { createPollAction } from '@/app/polls/create/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function CreatePollForm() {
  const { token, loading, error } = useCSRF();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading form..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading form: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Poll Details</CardTitle>
        <CardDescription>
          Fill in the details for your new poll
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={createPollAction} className="space-y-6">
          <input type="hidden" name="csrf_token" value={token || ''} />
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input 
              id="title" 
              placeholder="Enter your poll question or title"
              name="title"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Add more context about your poll"
              className="w-full"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option1">Option 1</Label>
            <Input 
              id="option1" 
              placeholder="First choice"
              name="option1"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option2">Option 2</Label>
            <Input 
              id="option2" 
              placeholder="Second choice"
              name="option2"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option3">Option 3 (Optional)</Label>
            <Input 
              id="option3" 
              placeholder="Third choice"
              name="option3"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option4">Option 4 (Optional)</Label>
            <Input 
              id="option4" 
              placeholder="Fourth choice"
              name="option4"
              className="w-full"
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Create Poll
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

