import type { Metadata } from 'next';
import './globals.css';
import { HeaderNav } from '@/components/HeaderNav';

export const metadata: Metadata = {
  title: 'OJIX • ClientFlow',
  description: 'Lightweight, trustworthy CRM pipeline and follow-up operating system in IST.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="shortcut icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* Clean, Calm Top Navigation with 4 Roles & Live IST Clock */}
        <HeaderNav />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
