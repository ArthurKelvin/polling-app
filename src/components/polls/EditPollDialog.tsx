'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { editPollAction } from '@/app/dashboard/real-time/actions';
import { Edit, X } from 'lucide-react';

interface EditPollDialogProps {
  pollId: string;
  currentTitle: string;
  currentDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPollDialog({
  pollId,
  currentTitle,
  currentDescription = '',
  isOpen,
  onClose,
  onSuccess,
}: EditPollDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [error, setError] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Poll title is required');
      return;
    }

    startTransition(async () => {
      const result = await editPollAction(pollId, title.trim(), description.trim());
      
      if (result.success) {
        onSuccess();
        onClose();
        setError('');
      } else {
        setError(result.error || 'Failed to update poll');
      }
    });
  };

  const handleClose = () => {
    setTitle(currentTitle);
    setDescription(currentDescription);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Poll
          </DialogTitle>
          <DialogDescription>
            Update your poll title and description. Changes will be visible to all users.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter poll title"
              disabled={isPending}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your poll"
              rows={3}
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Edit className="h-4 w-4 mr-2" />
              {isPending ? 'Updating...' : 'Update Poll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
