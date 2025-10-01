'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navLinks = [
  { href: '/', label: 'Overview' },
  { href: '/search', label: 'Search' },
  { href: '/markets', label: 'Markets', disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 lg:flex">
      <div className="sticky top-8 flex h-[calc(100vh-4rem)] flex-col justify-between rounded-3xl border border-glass bg-brand-sidebar/80 p-6 shadow-glowMd backdrop-blur-xl">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-red/20 text-lg font-semibold text-brand-red shadow-glowSm">
              PM
            </span>
            <span className="text-lg font-semibold tracking-wide">Polymuffin</span>
          </Link>

          <nav className="space-y-2 text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center justify-between rounded-2xl border border-transparent px-4 py-2 transition',
                    link.disabled && 'pointer-events-none opacity-40',
                    isActive
                      ? 'border-brand-red/60 bg-brand-red/10 text-white shadow-glowSm'
                      : 'hover:border-brand-red/40 hover:bg-white/5 text-white/70'
                  )}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="text-[10px] uppercase tracking-widest text-brand-ember">Now</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 text-xs text-white/50">
          <div>
            <p className="font-semibold uppercase tracking-[0.2em] text-white/60">Signals</p>
            <p className="mt-1 leading-relaxed text-white/60">
              Stay on top of narratives and prediction markets with our redline intelligence feed.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-white/80 shadow-glowSm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-brand-ember">Beta access</p>
            <p className="mt-1 text-sm font-medium text-white">Drop us feedback anytime.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
