'use client';

import { useActionState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { createPollAction } from '../actions';

interface FormState {
  success?: boolean;
  error?: string;
  pollId?: string;
}

const initialState: FormState = {};

export function CreatePollForm() {
  const [isPending, startTransition] = useTransition();
  const [state, action, isActionPending] = useActionState(createPollAction, initialState);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Poll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="What's your question?"
              required
              disabled={isPending || isActionPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add more context..."
              rows={3}
              disabled={isPending || isActionPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option1">Option 1</Label>
            <Input
              id="option1"
              name="option1"
              placeholder="First choice"
              required
              disabled={isPending || isActionPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option2">Option 2</Label>
            <Input
              id="option2"
              name="option2"
              placeholder="Second choice"
              required
              disabled={isPending || isActionPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option3">Option 3 (Optional)</Label>
            <Input
              id="option3"
              name="option3"
              placeholder="Third choice"
              disabled={isPending || isActionPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="option4">Option 4 (Optional)</Label>
            <Input
              id="option4"
              name="option4"
              placeholder="Fourth choice"
              disabled={isPending || isActionPending}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isPending || isActionPending}
          >
            {(isPending || isActionPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Poll...
              </>
            ) : (
              'Create Poll'
            )}
          </Button>

          {state?.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              Poll created successfully! 
              {state.pollId && (
                <span className="block mt-1">
                  Poll ID: {state.pollId}
                </span>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
