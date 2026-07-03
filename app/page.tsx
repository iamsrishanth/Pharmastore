import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const profile = await getCurrentUser();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/employee/dashboard');
  }
}
