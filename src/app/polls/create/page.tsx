import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { createPollAction } from './actions';

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

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              Fill in the details for your new poll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={createPollAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input 
                id="title" 
                placeholder="Enter your poll question or title"
                name="title"
                className="w-full"
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="option2">Option 2</Label>
              <Input 
                id="option2" 
                placeholder="Second choice"
                name="option2"
                className="w-full"
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
      </div>
    </div>
  );
}
