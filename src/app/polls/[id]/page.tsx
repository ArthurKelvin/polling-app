import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VoteForm } from './vote-form';
import { PollResults } from './PollResults';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { id: string };
  searchParams: { voted?: string; error?: string };
};

export default async function PollDetailPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const hasVoted = searchParams.voted === '1';
  const error = searchParams.error;

  const supabase = await getSupabaseServerClient();

  // Check if user is authenticated (optional for public polls)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch poll data from Supabase
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      owner_id,
      created_at,
      poll_options (
        id,
        label,
        position
      )
    `)
    .eq('id', id)
    .single();

  if (pollError || !poll) {
    notFound();
  }

  // Sort options by position
  const sortedOptions = poll.poll_options?.sort((a, b) => a.position - b.position) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/polls/list">
            <Button variant="outline" size="sm">← Back to Polls</Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Poll Detail</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Created {new Date(poll.created_at).toLocaleDateString()}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
          Error: {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          <CardDescription>Select one option below</CardDescription>
        </CardHeader>
                <CardContent>
          {hasVoted ? (
            <PollResults pollId={id} />
          ) : user ? (
            <VoteForm pollId={id} options={sortedOptions} />
          ) : (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Login Required to Vote</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please log in to vote on this poll.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href={`/auth/login?redirectTo=/polls/${id}`}>
                  <Button>Login</Button>
                </Link>
                <Link href={`/auth/register?redirectTo=/polls/${id}`}>
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


