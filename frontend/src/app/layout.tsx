import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Brightloop | Subscription Management & Recurring Billing Platform',
  description:
    'Production-grade Subscription Management, Automated Billing Engine, and Finance Operating System.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
