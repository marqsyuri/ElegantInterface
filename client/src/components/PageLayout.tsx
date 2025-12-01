import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Mobile top padding to account for mobile menu button */}
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} pt-16 lg:pt-0 min-h-screen transition-all duration-300 overflow-x-hidden`}>
        {children}
      </main>
    </div>
  );
}