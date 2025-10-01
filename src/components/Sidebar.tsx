'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const items = [
  { href: '/', label: 'Dashboard' },
  { href: '/search?q=markets', label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-60 p-4 gap-4 text-white">
      <div className="bg-brand-panel border border-glass rounded-2xl p-4 shadow-glowSm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-xl"
            style={{ background: 'radial-gradient(circle,#ff2d2d,#8b0000)' }}
          />
          <div className="font-semibold tracking-wide">Polymuffin</div>
        </div>
      </div>
      <nav className="bg-brand-panel border border-glass rounded-2xl p-3 backdrop-blur-md">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'block px-3 py-2 rounded-xl transition-colors',
                  pathname === item.href
                    ? 'bg-white/10 text-white shadow-glow'
                    : 'text-white/80 hover:bg-white/5'
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="bg-brand-panel border border-glass rounded-2xl p-4 text-sm text-white/80 backdrop-blur-md">
        <div className="font-medium mb-2 text-white">Upgrade</div>
        <p className="opacity-80">
          Unlock predictive signals and tailor-made forecasting dashboards.
        </p>
        <button className="mt-3 w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-glass text-white transition-colors">
          Upgrade Now
        </button>
      </div>
    </aside>
  );
}
