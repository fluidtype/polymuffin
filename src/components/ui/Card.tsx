import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border',
        'border-line-subtle/10',
        'bg-bg-surface/80',
        'backdrop-blur-md',
        'shadow-glowSm',
        className
      )}
      {...props}
    />
  );
}
