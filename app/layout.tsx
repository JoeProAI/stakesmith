import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ReactQueryProvider } from '@/lib/queryClient';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'StakeSmith — NFL Bet Blueprint Forge',
  description: 'Forge personalized NFL bet blueprints with AI apprentices and live odds.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[oklch(20%_0.03_250)] text-white antialiased">
        <ReactQueryProvider>
          <Header />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
