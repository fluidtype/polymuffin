import Sidebar from './Sidebar';
export default function DashboardShell({ children }:{ children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[256px_1fr] gap-4">
      <Sidebar />
      <div className="space-y-4">{children}</div>
    </div>
  );
}
