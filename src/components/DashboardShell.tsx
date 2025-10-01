import { ReactElement, ReactNode } from 'react';
import HeaderBar, { type HeaderBarProps } from './HeaderBar';
import Sidebar from './Sidebar';

export type DashboardHeader = HeaderBarProps;

export type DashboardShellProps = {
  children: ReactNode;
  header?: DashboardHeader;
};

export function withDashboardHeader<T extends ReactElement>(
  element: T,
  header: DashboardHeader,
): T & { header: DashboardHeader } {
  const clone = Object.create(
    Object.getPrototypeOf(element),
    Object.getOwnPropertyDescriptors(element),
  ) as T & { header?: DashboardHeader };

  Object.defineProperty(clone, 'header', {
    value: header,
    enumerable: false,
    configurable: true,
  });

  return clone as T & { header: DashboardHeader };
}

export default function DashboardShell({ children, header }: DashboardShellProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[256px_1fr] md:items-start">
      <Sidebar />
      <div className="space-y-6">
        {header ? <HeaderBar {...header} /> : null}
        {children}
      </div>
    </div>
  );
}
