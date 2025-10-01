'use client';
import * as React from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';

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
              <Command.Item onSelect={() => navigate('/')}>Overview</Command.Item>
              <Command.Item onSelect={() => navigate('/search')}>Search</Command.Item>
              <Command.Item onSelect={() => navigate('/markets')}>Markets</Command.Item>
            </Command.Group>
            <Command.Group heading="Quick queries">
              <Command.Item onSelect={() => navigate('/search?q=bitcoin')}>Search: bitcoin</Command.Item>
              <Command.Item onSelect={() => navigate('/search?q=USA')}>Search: USA</Command.Item>
              <Command.Item onSelect={() => navigate('/search?q=USA→CHN')}>Search: USA→CHN</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
