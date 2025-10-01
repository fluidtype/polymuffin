import Sidebar from '@/components/Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-0 min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-20 pt-8 text-white lg:flex-row lg:px-8">
        <Sidebar />
        <div className="flex-1">
          <div className="mx-auto flex w-full flex-col gap-6 lg:max-w-none">
            <header className="flex flex-col gap-4 rounded-3xl border border-glass bg-brand-panel/90 px-5 py-6 shadow-glowMd backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-brand-ember">Realtime intelligence</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Prediction Market Command</h1>
              </div>
              <div className="text-sm text-white/60">
                <span className="font-medium text-white">Status:</span> Signals nominal · <span className="text-brand-ember">Redline glow</span>
              </div>
            </header>
            <section className="rounded-3xl border border-glass bg-brand-panel/80 p-6 shadow-glowSm backdrop-blur-xl">
              {children}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
