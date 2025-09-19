import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { QRCodeShare } from '@/components/polls/QRCodeShare';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, Share2 } from 'lucide-react';

type PageProps = {
  params: { id: string };
};

export default async function PollSharePage({ params }: PageProps) {
  const { id } = params;

  const supabase = await getSupabaseServerClient();

  // Fetch poll data from Supabase
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      owner_id,
      is_public,
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

  // Check if poll is public or user has access
  if (!poll.is_public) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== poll.owner_id) {
      notFound();
    }
  }

  // Sort options by position
  const sortedOptions = poll.poll_options?.sort((a, b) => a.position - b.position) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/polls/${id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Poll
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 className="h-8 w-8" />
          Share Poll
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Share this poll with others so they can vote
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Poll Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Poll Preview</CardTitle>
            <CardDescription>
              This is how your poll will appear to others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {poll.question}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created {new Date(poll.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Options:
                </p>
                <ul className="space-y-1">
                  {sortedOptions.map((option) => (
                    <li
                      key={option.id}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      {option.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Link href={`/polls/${id}`}>
                  <Button className="w-full">
                    View Full Poll
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sharing Options */}
        <QRCodeShare
          pollId={poll.id}
          pollTitle={poll.question}
          pollDescription={`Vote on: ${poll.question}`}
        />
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">How to Share</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold">Generate QR Code</h3>
              <p className="text-sm text-gray-600">
                Click "Generate QR Code" to create a scannable code
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold">Share or Download</h3>
              <p className="text-sm text-gray-600">
                Share the QR code or copy the link to share anywhere
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold">Others Vote</h3>
              <p className="text-sm text-gray-600">
                People can scan the QR code or click the link to vote
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
