"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { deletePollAction } from "@/app/dashboard/real-time/actions";

interface DeletePollDialogProps {
  pollId: string;
  pollTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePollDialog({
  pollId,
  pollTitle,
  isOpen,
  onClose,
  onSuccess,
}: DeletePollDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deletePollAction(pollId);
        
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error || 'Failed to delete poll');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Delete poll error:', err);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Poll
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the poll <strong>&quot;{pollTitle}&quot;</strong>? 
            This action cannot be undone and will permanently remove the poll and all its votes.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isPending ? "Deleting..." : "Delete Poll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
