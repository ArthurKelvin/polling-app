import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { deletePollAction } from './actions';
import { redirect } from 'next/navigation';

export default async function PollsListPage() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Only show polls owned by the current user
  const { data: polls } = await supabase
    .from('polls')
    .select('id, question, owner_id, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Polls</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage your polls
        </p>
      </div>

      <div className="grid gap-6">
        {(polls ?? []).map((poll) => (
          <Card key={poll.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{poll.question}</CardTitle>
                  <CardDescription className="mt-2">
                    Created {new Date(poll.created_at).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mt-2">
                <Link href={`/polls/${poll.id}`}>
                  <Button size="sm">View Details</Button>
                </Link>
                <Link href={`/polls/results?poll=${poll.id}`}>
                  <Button variant="outline" size="sm">View Results</Button>
                </Link>
                {user?.id === poll.owner_id && (
                  <>
                    <Link href={`/polls/${poll.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <form action={deletePollAction}>
                      <input type="hidden" name="poll_id" value={poll.id} />
                      <Button variant="outline" size="sm">Delete</Button>
                    </form>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(polls ?? []).length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No polls found. Create your first poll to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
