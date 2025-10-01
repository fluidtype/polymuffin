'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Card from '@/components/ui/Card';

const items = [
  { href: '/', label: 'Overview' },
  { href: '/search', label: 'Search' },
  { href: '/markets', label: 'Markets' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-64 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl" style={{ background: 'radial-gradient(circle,#ff2d2d,#8b0000)' }} />
          <div className="font-semibold">Polymuffin</div>
        </div>
      </Card>
      <Card className="p-2">
        <nav>
          {items.map(it => (
            <Link key={it.href}
              href={it.href}
              className={clsx(
                'block px-3 py-2 rounded-lg text-sm',
                pathname === it.href ? 'bg-white/10 text-white' : 'text-text-secondary hover:bg-white/5'
              )}
            >{it.label}</Link>
          ))}
        </nav>
      </Card>
      <Card className="p-4 text-sm text-text-secondary">
        <div className="font-medium text-white mb-1">Signals</div>
        Stay on top of narratives and prediction markets.
      </Card>
    </aside>
  );
}
