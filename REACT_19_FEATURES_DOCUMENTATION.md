# React 19 Real-time Polling Dashboard

## Overview

This project demonstrates the latest React 19 features through a real-time polling dashboard. The dashboard showcases cutting-edge React patterns including Server Components, streaming data with the `use` hook, Server Actions, and real-time WebSocket updates.

## React 19 Features Demonstrated

### 1. Server Components with Data Fetching

**Location**: `src/app/dashboard/real-time/page.tsx`

```typescript
// Server Component - fetches initial data
async function DashboardContent() {
  const supabase = createClient();
  
  // Fetch polls data on the server
  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (
        id,
        text,
        votes
      )
    `)
    .order('created_at', { ascending: false });

  // Create a promise for real-time stats (not awaited - will stream)
  const statsPromise = supabase
    .from('polls')
    .select('id, total_votes')
    .then(({ data }) => ({
      totalPolls: data?.length || 0,
      totalVotes: data?.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) || 0,
    }));

  return (
    <div>
      {/* React 19 native metadata in component */}
      <title>Real-time Polling Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      <Suspense fallback={<StatsSkeleton />}>
        <RealTimeStats statsPromise={statsPromise} />
      </Suspense>
    </div>
  );
}
```

**Key Benefits**:
- Data fetched on the server, reducing client bundle size
- No API endpoints needed - direct database access
- Better SEO with server-rendered content
- Faster initial page loads

### 2. Streaming Data with the `use` Hook

**Location**: `src/app/dashboard/real-time/components/RealTimeStats.tsx`

```typescript
'use client';

import { use } from 'react';

// Client Component using React 19's `use` hook for streaming
export function RealTimeStats({ statsPromise }: RealTimeStatsProps) {
  // React 19's `use` hook - suspends until promise resolves
  const stats = use(statsPromise);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPolls}</div>
          <p className="text-xs text-blue-100">Active polling sessions</p>
        </CardContent>
      </Card>
      {/* More stats... */}
    </div>
  );
}
```

**Key Benefits**:
- Streams data as it becomes available
- Automatic Suspense integration
- Better user experience with progressive loading
- No need for useEffect or useState for async data

### 3. Server Actions with `useActionState`

**Location**: `src/app/dashboard/real-time/components/CreatePollForm.tsx`

```typescript
'use client';

import { useActionState, useTransition } from 'react';

export function CreatePollForm() {
  const [isPending, startTransition] = useTransition();
  const [state, action, isActionPending] = useActionState(createPollAction, initialState);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input name="title" placeholder="What's your question?" required />
      <Button type="submit" disabled={isPending || isActionPending}>
        {(isPending || isActionPending) ? 'Creating Poll...' : 'Create Poll'}
      </Button>
    </form>
  );
}
```

**Key Benefits**:
- Progressive enhancement - works without JavaScript
- Built-in pending states and error handling
- Type-safe form handling
- Automatic revalidation

### 4. Real-time Updates with WebSocket Integration

**Location**: `src/app/dashboard/real-time/components/PollsStreamingProvider.tsx`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PollsStreamingProvider({ initialPolls }: PollsStreamingProviderProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [isConnected, setIsConnected] = useState(false);

  const handlePollUpdate = useCallback((payload: any) => {
    setPolls(prevPolls => {
      // Update poll data in real-time
      const updatedPolls = [...prevPolls];
      const pollIndex = updatedPolls.findIndex(poll => poll.id === payload.new.poll_id);
      
      if (pollIndex !== -1) {
        const optionIndex = updatedPolls[pollIndex].poll_options.findIndex(
          option => option.id === payload.new.id
        );
        
        if (optionIndex !== -1) {
          updatedPolls[pollIndex].poll_options[optionIndex] = {
            ...updatedPolls[pollIndex].poll_options[optionIndex],
            votes: payload.new.votes
          };
        }
      }
      
      return updatedPolls;
    });
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates
    const pollOptionsChannel = supabase
      .channel('poll_options_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'poll_options',
      }, handlePollUpdate)
      .subscribe();

    return () => {
      pollOptionsChannel.unsubscribe();
    };
  }, [supabase, handlePollUpdate]);

  return <PollsList polls={polls} />;
}
```

**Key Benefits**:
- Real-time updates without page refresh
- Efficient WebSocket connection management
- Automatic reconnection handling
- Optimistic UI updates

### 5. Native Metadata Support

**Location**: `src/app/dashboard/real-time/page.tsx`

```typescript
// React 19 native metadata support
export const metadata: Metadata = {
  title: 'Real-time Polling Dashboard',
  description: 'Live polling dashboard with real-time updates',
  keywords: ['polls', 'real-time', 'dashboard', 'voting'],
  openGraph: {
    title: 'Real-time Polling Dashboard',
    description: 'Live polling dashboard with real-time updates',
    type: 'website',
  },
};

// Also supports inline metadata in components
function DashboardContent() {
  return (
    <div>
      {/* React 19 native metadata in component */}
      <title>Real-time Polling Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </div>
  );
}
```

**Key Benefits**:
- Automatic metadata management
- SEO optimization
- Social media sharing support
- No need for external libraries

### 6. Server Actions for Data Mutations

**Location**: `src/app/dashboard/real-time/actions.ts`

```typescript
'use server';

export async function createPollAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'You must be logged in to create a poll' };
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        user_id: user.id,
        total_votes: 0,
      })
      .select()
      .single();

    // Revalidate the dashboard page
    revalidatePath('/dashboard/real-time');

    return { success: true, pollId: poll.id };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}
```

**Key Benefits**:
- Server-side data mutations
- Automatic form handling
- Built-in error handling
- Cache revalidation

## Architecture Patterns

### 1. Server-First Approach
- Server Components handle data fetching
- Client Components only for interactivity
- Minimal JavaScript sent to client

### 2. Streaming Architecture
- Critical content loads first
- Non-critical content streams in
- Progressive enhancement

### 3. Real-time Updates
- WebSocket for live data
- Optimistic UI updates
- Connection status indicators

### 4. Form Handling
- Server Actions for mutations
- Progressive enhancement
- Built-in validation and error handling

## Performance Benefits

1. **Reduced Bundle Size**: Server Components don't contribute to client bundle
2. **Faster Initial Load**: Data fetched on server, not client
3. **Better SEO**: Server-rendered content
4. **Real-time Updates**: WebSocket integration for live data
5. **Progressive Enhancement**: Forms work without JavaScript

## Getting Started

1. Navigate to `/dashboard/real-time`
2. Create a new poll using the form
3. Watch real-time updates as votes come in
4. Experience the streaming data with the `use` hook

## Technical Requirements

- React 19+
- Next.js App Router
- Supabase for database and real-time
- TypeScript for type safety

This implementation showcases the future of React development with server-first architecture, streaming data, and real-time capabilities.
