'use client';
import * as React from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LineChart, Search } from 'lucide-react';
import Icon from './ui/Icon';

export default function CommandPalette() {
  const r = useRouter();
  const [open, setOpen] = React.useState(false);
  const navigate = React.useCallback((href: string) => {
    setOpen(false);
    r.push(href);
  }, [r]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const navigationCommands = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Markets', href: '/markets', icon: LineChart },
  ];
  const quickQueries = [
    { label: 'Search: bitcoin', href: '/search?q=bitcoin', icon: Search },
    { label: 'Search: USA', href: '/search?q=USA', icon: Search },
    { label: 'Search: USA→CHN', href: '/search?q=USA→CHN', icon: Search },
  ];

  return (
    <div className={open ? '' : 'hidden'}>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-50 w-[90%] max-w-xl">
        <Command
          label="Command Menu"
          className="rounded-2xl border border-line-subtle/10 bg-bg-surface/95 backdrop-blur-md p-2 text-sm text-white"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <Command.Input
            ref={inputRef}
            placeholder="Type a command or search…"
            className="w-full bg-transparent p-2 outline-none"
          />
          <Command.List className="max-h-[50vh] overflow-y-auto">
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group heading="Navigation">
              {navigationCommands.map((cmd) => (
                <Command.Item
                  key={cmd.href}
                  onSelect={() => navigate(cmd.href)}
                  className="flex items-center gap-3 data-[selected]:bg-white/10 data-[selected]:text-white"
                >
                  <Icon I={cmd.icon} className="h-4 w-4 text-white/80" />
                  <span>{cmd.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Quick queries">
              {quickQueries.map((cmd) => (
                <Command.Item
                  key={cmd.href}
                  onSelect={() => navigate(cmd.href)}
                  className="flex items-center gap-3 data-[selected]:bg-white/10 data-[selected]:text-white"
                >
                  <Icon I={cmd.icon} className="h-4 w-4 text-brand-red/80" />
                  <span>{cmd.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
