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
          <Link href="/duels" className="text-sm hover:text-[var(--accent)]">
            Duels
          </Link>
          <Link href="/history" className="text-sm hover:text-[var(--accent)]">
            History
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
