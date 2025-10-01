import { LucideIcon } from 'lucide-react';
export default function Icon({ I, className }: { I: LucideIcon; className?: string }) {
  return <I className={className ?? 'w-4 h-4 text-white/80'} aria-hidden />;
}
