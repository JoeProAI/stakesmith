'use client';
import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="border-b border-neutral-800 bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--accent)]">
          ⚒️ StakeSmith
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/forge" className="text-sm hover:text-[var(--accent)]">
            Forge
          </Link>
          <Link href="/dashboard" className="text-sm hover:text-[var(--accent)]">
            Dashboard
          </Link>
          <Link href="/subscribe" className="text-sm font-semibold bg-gradient-to-r from-[var(--accent)] to-purple-600 px-4 py-2 rounded-lg hover:opacity-90">
            💎 Subscribe
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
