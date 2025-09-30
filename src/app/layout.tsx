import './globals.css';
import type { Metadata } from 'next';
import ShaderBg from '@/components/ShaderBgClient';

export const metadata: Metadata = {
  title: 'Polymuffin',
  description: 'Market-prediction dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-transparent text-white">
        <ShaderBg />
        <div className="min-h-screen bg-black/30 backdrop-blur-sm">
          <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* LOGO placeholder */}
              <div className="h-8 w-8 rounded-xl bg-emerald-400/80 blur-[1px]" />
              <span className="font-semibold tracking-wide">Polymuffin</span>
            </div>
            {/* nav placeholder */}
          </header>
          <main className="max-w-6xl mx-auto px-6 pb-20">{children}</main>
        </div>
      </body>
    </html>
  );
}
