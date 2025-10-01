import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export default function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2',
        'px-3 py-2 rounded-xl',
        'bg-white/10 hover:bg-white/15',
        'border border-line-subtle/10',
        'text-white',
        'transition-colors',
        className
      )}
      {...props}
    />
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button
    {...props}
    className={clsx(
      'inline-flex items-center justify-center gap-2',
      'px-4 py-2 rounded-xl',
      'bg-brand-red/90 hover:bg-brand-red',
      'text-white shadow-glow border border-brand-red/20',
      'transition-colors',
      props.className
    )}
  />;
}
