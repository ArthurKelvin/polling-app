import { getSupabaseServerClient } from '@/lib/auth/server';

export default async function TestFixesPage() {
  const supabase = await getSupabaseServerClient();
  
  try {
    // Test 1: Check if we can query polls without errors
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          label,
          votes
        )
      `)
      .limit(5);

    // Test 2: Check if we can query user_roles without recursion
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Fix Verification Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h2 className="text-lg font-semibold">Polls Query Test</h2>
            {pollsError ? (
              <p className="text-red-500">Error: {pollsError.message}</p>
            ) : (
              <p className="text-green-500">✅ Success: Found {polls?.length || 0} polls</p>
            )}
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-lg font-semibold">User Roles Query Test</h2>
            {rolesError ? (
              <p className="text-red-500">Error: {rolesError.message}</p>
            ) : (
              <p className="text-green-500">✅ Success: Found {userRoles?.length || 0} user roles</p>
            )}
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-lg font-semibold">Sample Data</h2>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify({ polls: polls?.slice(0, 2), userRoles: userRoles?.slice(0, 2) }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Fix Verification Test</h1>
        <div className="p-4 border rounded bg-red-50">
          <h2 className="text-lg font-semibold text-red-600">Error</h2>
          <p className="text-red-500">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

