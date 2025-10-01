'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, LineChart, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/markets', label: 'Markets', icon: LineChart },
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
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'relative flex items-center gap-3 rounded-lg pr-3 pl-6 py-2 text-sm transition before:absolute before:left-2 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-brand-red before:opacity-0 before:transition before:content-[""]',
                  isActive
                    ? 'bg-white/10 text-white before:opacity-100'
                    : 'text-text-secondary hover:bg-white/5 hover:text-white before:bg-brand-red/40'
                )}
              >
                <span
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.07] transition',
                    isActive ? 'border-white/20 text-white' : 'text-white/80'
                  )}
                >
                  <Icon I={item.icon} className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </Card>
      <Card className="p-4 text-sm text-text-secondary">
        <div className="font-medium text-white mb-1">Signals</div>
        Stay on top of narratives and prediction markets.
      </Card>
    </aside>
  );
}
