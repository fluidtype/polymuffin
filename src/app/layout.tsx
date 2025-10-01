import './globals.css';
import { isValidElement } from 'react';
import type { Metadata } from 'next';
import DashboardShell, { type DashboardHeader } from '@/components/DashboardShell';
import ShaderBg from '@/components/ShaderBgClient';
import CommandPalette from '@/components/CommandPaletteProvider';

export const metadata: Metadata = {
  title: 'Polymuffin',
  description: 'Market-prediction dashboard',
};

const DEFAULT_HEADER: DashboardHeader = {
  title: 'Polymuffin',
  subtitle: 'Market intelligence workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const header = isValidElement(children) && 'header' in children
    ? ((children as React.ReactElement & { header?: DashboardHeader }).header ?? DEFAULT_HEADER)
    : DEFAULT_HEADER;

  return (
    <html lang="it">
      <body className="min-h-screen bg-bg-base font-sans text-white antialiased">
        <ShaderBg />
        <main className="relative z-10 min-h-screen py-6 md:py-10">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-10">
            <DashboardShell header={header}>{children}</DashboardShell>
          </div>
        </main>
        <CommandPalette />
      </body>
    </html>
  );
}
