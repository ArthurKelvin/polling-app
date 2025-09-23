import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard - Polling Platform',
  description: 'Administrative dashboard for managing the polling platform',
};

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || userRole?.role !== 'admin') {
    redirect('/dashboard/real-time?error=Access denied. Admin privileges required.');
  }

  return <AdminDashboard />;
}
