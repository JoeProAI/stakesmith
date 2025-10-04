'use client';
import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--accent)] tracking-tight">
          STAKESMITH
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/forge" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Factory
          </Link>
          <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Dashboard
          </Link>
          <Link href="/subscribe" className="text-sm font-semibold bg-[var(--accent)] text-white px-4 py-2 hover:bg-[var(--accent)]/90 transition-all">
            Subscribe
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
