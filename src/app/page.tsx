import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const cookieStore = cookies();
  const session = cookieStore.get('clientflow_session');

  if (!session?.value) {
    redirect('/login');
  }

  redirect('/pipeline');
}

