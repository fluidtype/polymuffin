import './globals.css';
import type { Metadata } from 'next';
import DashboardShell from '@/components/DashboardShell';
import ShaderBg from '@/components/ShaderBgClient';
import CommandPalette from '@/components/CommandPaletteProvider';

export const metadata: Metadata = {
  title: 'Polymuffin',
  description: 'Market-prediction dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-brand-body font-sans text-white antialiased">
        <ShaderBg />
        <main className="min-h-screen bg-black/30 backdrop-blur-sm">
          <DashboardShell>{children}</DashboardShell>
          <CommandPalette />
        </main>
      </body>
    </html>
  );
}
