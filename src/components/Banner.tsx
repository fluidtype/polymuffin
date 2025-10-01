import clsx from 'clsx';
import type { ReactNode } from 'react';

const KIND_STYLES: Record<'info' | 'warn' | 'error', string> = {
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
  warn: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
};

type BannerProps = {
  children: ReactNode;
  kind?: 'info' | 'warn' | 'error';
  className?: string;
};

export default function Banner({ children, kind = 'info', className }: BannerProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border px-4 py-3 text-sm shadow-glow backdrop-blur',
        KIND_STYLES[kind],
        className,
      )}
    >
      {children}
    </div>
  );
}
