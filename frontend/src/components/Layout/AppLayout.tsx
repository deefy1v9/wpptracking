import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/settings': 'Configurações',
  '/logs': 'Logs',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/leads/')) return 'Detalhes do Lead';
  return PAGE_TITLES[pathname] ?? 'CRM WhatsApp';
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-16 md:ml-56 flex flex-col min-h-screen">
        <TopBar title={getTitle(pathname)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
