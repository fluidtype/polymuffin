import type { ReactNode } from 'react';

import Sidebar from './Sidebar';

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 text-white">
      <Sidebar />
      <div className="space-y-4">{children}</div>
    </div>
  );
}
