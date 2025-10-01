import { ReactNode } from 'react';

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-lg text-xs bg-brand-red/15 border border-brand-red/25 text-brand-red">
      {children}
    </span>
  );
}
