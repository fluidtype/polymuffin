import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl px-3 py-2',
        'bg-white/10 placeholder:text-muted/70',
        'border border-line-subtle/10',
        'focus:outline-none focus:ring-2 focus:ring-brand-red/40',
        className
      )}
      {...props}
    />
  );
}
