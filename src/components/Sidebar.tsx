'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiFileText,
  FiBarChart2,
  FiActivity,
  FiSend,
  FiUsers,
  FiX,
  FiExternalLink,
  FiShield,
  FiUserCheck,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { APP_VERSION, APP_DEVELOPER } from '@/lib/version';

interface MenuItem {
  label: string;
  href: string;
  icon: typeof FiHome;
  superAdminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FiHome },
  { label: 'Surat Tugas', href: '/dashboard/surat-tugas', icon: FiFileText },
  { label: 'SPD Saya', href: '/dashboard/spd-saya', icon: FiSend },
  { label: 'Daftar Pegawai', href: '/dashboard/daftar-pegawai', icon: FiUsers, superAdminOnly: true },
  { label: 'Master PPK', href: '/dashboard/ppk', icon: FiUserCheck, superAdminOnly: true },
  { label: 'Keamanan Login', href: '/dashboard/keamanan-login', icon: FiShield, superAdminOnly: true },
  { label: 'Laporan', href: '/dashboard/laporan', icon: FiBarChart2 },
  { label: 'Aktivitas', href: '/dashboard/aktivitas', icon: FiActivity },
];

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, collapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isSuperAdmin = user?.role?.slug === 'super-admin';

  const visibleMenuItems = menuItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  const sidebarClasses = [
    'app-sidebar bg-bubblegum-gradient-vertical text-white flex flex-col',
    isOpen ? 'open' : '',
    collapsed ? 'collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      {/* Logo + Close button (mobile) */}
      <div className="sidebar-header p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
          <Image src="/logo-oi.png" alt="Logo Ogan Ilir" width={32} height={32} className="object-contain" />
        </div>
        <div className="sidebar-text flex-1 min-w-0">
          <h2 className="text-lg font-bold leading-tight">e-SPD</h2>
          <p className="text-[10px] text-white/70 leading-tight">Ogan Ilir</p>
        </div>
        {/* Close button — only shown on mobile */}
        <button onClick={onClose} className="sidebar-close-btn text-white/80 hover:text-white">
          <FiX className="text-xl" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/20" />

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${isActive
                ? 'bg-white/25 backdrop-blur-sm shadow-lg shadow-black/10 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              <item.icon className="text-lg flex-shrink-0" />
              <span className="sidebar-text">{item.label}</span>
              {isActive && (
                <div className="sidebar-text ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-2">
        {/* Semesta Link */}
        <a
          href="https://semesta.oganilirkab.go.id/"
          target="_blank"
          rel="noopener noreferrer"
          title="Buka Semesta"
          className="sidebar-bottom flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white transition-colors text-xs font-medium"
        >
          <FiExternalLink className="text-sm shrink-0" />
          <span className="sidebar-text">Semesta Ogan Ilir</span>
        </a>

        {/* Powered by + Version */}
        <div className="sidebar-bottom p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
          <p className="sidebar-text text-[10px] text-white/60">Powered by</p>
          <p className="sidebar-text text-xs font-semibold text-white/90 mt-0.5">
            {APP_DEVELOPER}
          </p>
          <p className="sidebar-text text-[10px] text-white/40 mt-1">v{APP_VERSION}</p>
        </div>
      </div>
    </aside>
  );
}
