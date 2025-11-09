'use client';
import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)] backdrop-blur-xl relative">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between relative">
        <Link href="/" className="text-xl font-bold text-[var(--accent)] tracking-tight hover:text-[var(--accent-glow)] transition-all relative group">
          <span className="relative z-10">STAKESMITH</span>
          <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity blur-xl"></div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/forge" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative group">
            <span className="relative z-10">Forge</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </Link>
          <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative group">
            <span className="relative z-10">Dashboard</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </Link>
          <Link href="/forge" className="text-sm font-semibold bg-[var(--accent)] text-white px-5 py-2 hover:shadow-lg hover:shadow-[var(--accent)]/30 transition-all">
            Get Started Free
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
