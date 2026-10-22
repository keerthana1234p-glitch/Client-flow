'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teamflow');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300 text-xs">
      Redirecting to OJIX TeamFlow...
    </div>
  );
}
