'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Desktop: toggle collapse. Mobile: toggle open/close
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => setMobileOpen(false), []);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bubblegum-gradient-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-bubblegum-gradient animate-bubble-float shadow-lg shadow-bubblegum-300/50" />
          <p className="text-bubblegum-600 font-medium animate-pulse">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className={`flex min-h-screen bg-bubblegum-gradient-soft ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Overlay backdrop for mobile */}
        <div
          className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
          onClick={closeMobileSidebar}
        />
        <Sidebar isOpen={mobileOpen} collapsed={collapsed} onClose={closeMobileSidebar} />
        <div className="app-main flex-1 flex flex-col">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
