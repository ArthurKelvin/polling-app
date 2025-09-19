# Vote Prevention Schema Design

## Overview

This document outlines a comprehensive database schema design to prevent users from submitting multiple votes for the same poll. The design uses multiple layers of protection to ensure data integrity and prevent vote manipulation.

## Key Prevention Mechanisms

### 1. **Primary Constraint: Unique Index**
```sql
-- The most important constraint - prevents duplicate votes at database level
constraint votes_unique_per_user_per_poll unique (poll_id, user_id)
```

**How it works:**
- Database-level constraint that prevents duplicate entries
- Automatically rejects any attempt to insert a second vote for the same user-poll combination
- Provides immediate feedback with a unique constraint violation error

### 2. **Application-Level Checks**
```sql
-- Function to check if user has already voted
create or replace function public.user_has_voted(p_poll_id uuid, p_user_id uuid)
returns boolean
```

**Benefits:**
- Allows UI to show appropriate messaging before vote submission
- Prevents unnecessary database operations
- Provides better user experience

### 3. **Enhanced Vote Casting Function**
```sql
create or replace function public.cast_vote_enhanced(
  p_poll_id uuid, 
  p_option_id uuid,
  p_allow_update boolean default false
)
returns json
```

**Features:**
- Comprehensive validation before vote insertion
- Option to allow vote updates (change vote)
- Detailed error messages and codes
- JSON response for better API integration

## Schema Components

### Core Tables

#### 1. **Polls Table**
```sql
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  is_public boolean not null default true,
  total_votes integer not null default 0, -- Denormalized for performance
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### 2. **Poll Options Table**
```sql
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  votes integer not null default 0, -- Denormalized for performance
  created_at timestamptz not null default now()
);
```

#### 3. **Votes Table (Key Table)**
```sql
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  
  -- THE KEY CONSTRAINT: Prevents multiple votes per user per poll
  constraint votes_unique_per_user_per_poll unique (poll_id, user_id)
);
```

### Indexes for Performance

```sql
-- Unique constraint index (automatically created)
create unique index votes_unique_user_poll_idx 
on public.votes (poll_id, user_id);

-- Additional indexes for query performance
create index votes_poll_id_idx on public.votes(poll_id);
create index votes_option_id_idx on public.votes(option_id);
create index votes_user_id_idx on public.votes(user_id);
```

## Prevention Strategies

### 1. **Database Level (Strongest)**
- **Unique Constraint**: `(poll_id, user_id)` combination must be unique
- **Foreign Key Constraints**: Ensure referential integrity
- **Check Constraints**: Validate data before insertion

### 2. **Application Level**
- **Pre-vote Check**: Query database before allowing vote submission
- **UI State Management**: Disable vote buttons after voting
- **Error Handling**: Graceful handling of constraint violations

### 3. **API Level**
- **Validation Functions**: Server-side validation before database operations
- **Atomic Operations**: Use transactions for vote casting
- **Error Codes**: Structured error responses for different scenarios

## Usage Examples

### 1. **Check if User Can Vote**
```sql
-- Check if user has already voted
select public.user_has_voted('poll-uuid', 'user-uuid');
```

### 2. **Cast a Vote Safely**
```sql
-- Cast vote with comprehensive validation
select public.cast_vote_enhanced('poll-uuid', 'option-uuid', false);
```

### 3. **Get Poll Results with User Vote Info**
```sql
-- Get poll results including user's vote status
select * from public.poll_results_with_user_vote 
where poll_id = 'poll-uuid';
```

### 4. **Get Complete Poll Statistics**
```sql
-- Get comprehensive poll statistics
select public.get_poll_stats('poll-uuid');
```

## Error Handling

### Common Error Scenarios

1. **User Already Voted**
   ```json
   {
     "success": false,
     "error": "You have already voted on this poll",
     "error_code": "ALREADY_VOTED",
     "can_update": true
   }
   ```

2. **Not Authenticated**
   ```json
   {
     "success": false,
     "error": "Not authenticated",
     "error_code": "AUTH_REQUIRED"
   }
   ```

3. **Invalid Option**
   ```json
   {
     "success": false,
     "error": "Option does not belong to poll",
     "error_code": "INVALID_OPTION"
   }
   ```

## Row Level Security (RLS)

### Vote Policies
```sql
-- Users can only insert their own votes
create policy "votes_insert_authenticated_once"
on public.votes for insert
with check (
  user_id = auth.uid() and
  not exists (
    select 1 from public.votes v2 
    where v2.poll_id = poll_id and v2.user_id = auth.uid()
  )
);

-- Users can update their own votes
create policy "votes_update_own_vote"
on public.votes for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

## Performance Considerations

### 1. **Denormalized Counts**
- Store vote counts in polls and poll_options tables
- Update via triggers for consistency
- Improves query performance for results

### 2. **Efficient Indexes**
- Unique index on (poll_id, user_id) for fast duplicate checks
- Separate indexes for common query patterns
- Covering indexes where possible

### 3. **Batch Operations**
- Use functions for complex operations
- Minimize round trips to database
- Atomic operations for data consistency

## Migration Strategy

### 1. **Apply the Migration**
```bash
supabase db push
```

### 2. **Update Application Code**
- Use the new `cast_vote_enhanced` function
- Implement proper error handling
- Update UI to show vote status

### 3. **Test Scenarios**
- Test duplicate vote prevention
- Test vote updates (if allowed)
- Test error handling
- Test performance with large datasets

## Security Considerations

### 1. **Authentication Required**
- All vote operations require authentication
- User ID is automatically set from auth context
- No way to vote without being logged in

### 2. **Data Integrity**
- Foreign key constraints prevent orphaned votes
- Cascade deletes maintain consistency
- Unique constraints prevent duplicates

### 3. **Audit Trail**
- All votes are timestamped
- Vote history is preserved
- Can track when votes were cast

## Monitoring and Analytics

### 1. **Vote Statistics**
- Total votes per poll
- Votes per option
- User participation rates
- Vote timing patterns

### 2. **Error Tracking**
- Monitor constraint violations
- Track failed vote attempts
- Analyze user behavior patterns

### 3. **Performance Metrics**
- Query execution times
- Index usage statistics
- Database connection patterns

This schema design provides multiple layers of protection against duplicate votes while maintaining good performance and user experience. The combination of database constraints, application-level checks, and proper error handling ensures data integrity and prevents vote manipulation.
