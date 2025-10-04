'use client';
import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)] backdrop-blur-xl relative">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between relative">
        <Link href="/" className="text-xl font-bold text-[var(--accent)] tracking-tight hover:text-[var(--accent-glow)] transition-all relative group">
          <span className="relative z-10">STAKESMITH</span>
          <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity blur-xl"></div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/forge" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative group">
            <span className="relative z-10">Factory</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </Link>
          <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative group">
            <span className="relative z-10">Dashboard</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </Link>
          <Link href="/subscribe" className="text-sm font-semibold bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white px-5 py-2 hover:shadow-lg hover:shadow-[var(--accent)]/30 transition-all relative overflow-hidden group">
            <span className="relative z-10">Subscribe</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
