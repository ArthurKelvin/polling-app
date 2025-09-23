import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreatePollForm } from '@/components/create-poll-form';
import { CSRFProvider } from '@/components/csrf-token-provider';

export default function CreatePollPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/polls">
            <Button variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Poll</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a new poll to gather opinions from your audience
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <CSRFProvider>
            <CreatePollForm />
          </CSRFProvider>
        </div>
      </div>
    </div>
  );
}
