import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ACE — AI Codebase Explainer',
  description: 'Analyze GitHub repositories, build dependency graphs, and understand codebases with AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
