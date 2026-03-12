'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiChevronDown, FiLogOut, FiMenu } from 'react-icons/fi';
import NotificationDropdown from '@/components/NotificationDropdown';
import GlobalSearchPalette from '@/components/GlobalSearchPalette';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <header className="app-header h-16 glass-card border-b border-bubblegum-100 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                {/* Sidebar toggle button (always visible) */}
                <button onClick={onToggleSidebar} className="sidebar-toggle-btn">
                    <FiMenu className="text-xl" />
                </button>

                {/* Search */}
                <GlobalSearchPalette />
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationDropdown />

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-bubblegum-50 transition-all duration-300"
                    >
                        {/* <div className="w-9 h-9 rounded-full bg-bubblegum-gradient flex items-center justify-center text-white font-bold text-sm shadow-md shadow-bubblegum-300/30">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div> */}
                        <img
                            src={user?.image || '/logo-oi.png'}
                            onError={(e) => (e.currentTarget.src = '/logo-oi.png')}
                            alt="User Avatar"
                            className="w-9 h-9 rounded-full object-cover shadow-md shadow-bubblegum-300/30"
                        />
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-semibold text-bubblegum-800 leading-tight">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-[10px] text-bubblegum-400 leading-tight">
                                {user?.role?.name || 'Staff'}
                            </p>
                        </div>
                        <FiChevronDown
                            className={`text-bubblegum-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl border border-bubblegum-100 shadow-xl shadow-bubblegum-200/30 py-2 animate-bubble-pop">
                            <div className="px-4 py-3 border-b border-bubblegum-100">
                                <p className="text-sm font-semibold text-bubblegum-800">{user?.name}</p>
                                <p className="text-xs text-bubblegum-400">{user?.username}</p>
                            </div>

                            <div className="py-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <FiLogOut className="text-base" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
