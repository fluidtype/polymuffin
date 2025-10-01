import { ReactNode } from 'react';
import { Bell, User } from 'lucide-react';
import Card from './ui/Card';
import Button, { PrimaryButton } from './ui/Button';

export type HeaderBarProps = {
  title: string;
  subtitle?: string;
  filters?: ReactNode;
};

export default function HeaderBar({ title, subtitle, filters }: HeaderBarProps) {
  return (
    <Card className="flex flex-col gap-4 border-line-subtle/20 bg-bg-surface/70 p-4 backdrop-blur-xl md:flex-row md:items-center md:gap-6">
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-lg font-semibold text-white sm:text-xl">{title}</h1>
        {subtitle ? <p className="text-sm text-text-secondary">{subtitle}</p> : null}
      </div>

      {filters ? (
        <div className="flex w-full flex-1 items-center justify-center md:w-auto">
          <div className="w-full md:max-w-xl">{filters}</div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button aria-label="Notifications" className="h-10 w-10 rounded-full p-0">
          <Bell className="h-4 w-4 text-white" aria-hidden />
        </Button>
        <Button aria-label="Profile" className="h-10 w-10 rounded-full p-0">
          <User className="h-4 w-4 text-white" aria-hidden />
        </Button>
        <PrimaryButton className="px-4 py-2 text-sm font-semibold">New alert</PrimaryButton>
      </div>
    </Card>
  );
}
