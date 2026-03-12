'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiExternalLink, FiSend, FiXCircle } from 'react-icons/fi';import type { ReactNode } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { AppNotification, NOTIFICATION_TYPE_COLORS } from '@/lib/types';

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTypeIcon(type: string): ReactNode {
  const base = 'text-lg';
  switch (type) {
    case 'surat_dikirim': return <FiSend className={`${base} text-sky-500`} />;
    case 'surat_ditandatangani': return <FiCheckCircle className={`${base} text-emerald-500`} />;
    case 'surat_ditolak': return <FiXCircle className={`${base} text-red-500`} />;
    default: return <FiBell className={`${base} text-bubblegum-400`} />;
  }
}

function getTypeColorClass(type: string): string {
  const color = NOTIFICATION_TYPE_COLORS[type] || 'gray';
  const colorMap: Record<string, string> = {
    candy: 'bg-sky-50 border-sky-200',
    mint: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200',
  };
  return colorMap[color] || colorMap.gray;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.data?.url) {
      router.push(notification.data.url);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-2xl hover:bg-bubblegum-50 transition-colors"
      >
        <FiBell className="text-xl text-bubblegum-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-bubblegum-gradient text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[70vh] glass-card rounded-2xl border border-bubblegum-100 shadow-xl shadow-bubblegum-200/30 flex flex-col animate-bubble-pop z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-bubblegum-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-bubblegum-800">Notifikasi</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-bubblegum-400">{unreadCount} belum dibaca</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-bubblegum-500 hover:text-bubblegum-700 transition-colors"
                title="Tandai semua sudah dibaca"
              >
                <FiCheckCircle className="text-sm" />
                <span>Baca semua</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-bubblegum-300 border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-bubblegum-400">
                <FiBell className="text-3xl mb-2 opacity-30" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group relative px-4 py-3 hover:bg-bubblegum-50/50 transition-colors cursor-pointer border-l-4 ${
                      notif.is_read ? 'border-transparent opacity-70' : getTypeColorClass(notif.type)
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <span className="shrink-0 mt-0.5">{getTypeIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-tight ${notif.is_read ? 'text-bubblegum-600' : 'text-bubblegum-800'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-bubblegum-500 mt-0.5 leading-snug line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-bubblegum-300 mt-1">{getTimeAgo(notif.created_at)}</p>
                      </div>
                      {/* Action buttons */}
                      <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="p-1 rounded-lg hover:bg-bubblegum-100 text-bubblegum-400"
                            title="Tandai dibaca"
                          >
                            <FiCheck className="text-xs" />
                          </button>
                        )}
                        {notif.data?.url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            className="p-1 rounded-lg hover:bg-bubblegum-100 text-bubblegum-400"
                            title="Lihat detail"
                          >
                            <FiExternalLink className="text-xs" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1 rounded-lg hover:bg-red-100 text-red-400"
                          title="Hapus"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
