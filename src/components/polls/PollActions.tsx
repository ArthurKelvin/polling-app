"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { DeletePollDialog } from "./DeletePollDialog";
import { EditPollDialog } from "./EditPollDialog";
import { deletePollAction, editPollAction } from "@/app/dashboard/real-time/actions";
import { useRouter } from "next/navigation";

interface PollActionsProps {
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
  isOwner: boolean;
}

export function PollActions({ 
  pollId, 
  pollTitle, 
  pollDescription, 
  isOwner 
}: PollActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const router = useRouter();

  if (!isOwner) {
    return null;
  }

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    router.push('/polls');
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditDialog(true)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditPollDialog
          pollId={pollId}
          currentTitle={pollTitle}
          currentDescription={pollDescription || ''}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <DeletePollDialog
          pollId={pollId}
          pollTitle={pollTitle}
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}
