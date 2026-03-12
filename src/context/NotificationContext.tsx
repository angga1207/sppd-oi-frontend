'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { AppNotification } from '@/lib/types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fcmInitialized = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.get('/notifications?per_page=50');
      if (res.data.success) {
        setNotifications(res.data.data.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id);
        if (notif && !notif.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch {
      // silently fail
    }
  }, []);

  // Initialize FCM and save token
  useEffect(() => {
    if (!isAuthenticated || !token || fcmInitialized.current) return;

    const initFCM = async () => {
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          await api.post('/notifications/fcm-token', { fcm_token: fcmToken });
          fcmInitialized.current = true;
        }
      } catch {
        // FCM not supported or permission denied
      }
    };

    initFCM();
  }, [isAuthenticated, token]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isAuthenticated) return;

    onForegroundMessage(() => {
      // When a foreground push notification arrives, refresh data
      refreshUnreadCount();
      fetchNotifications();
    });
  }, [isAuthenticated, refreshUnreadCount, fetchNotifications]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshUnreadCount();
    fetchNotifications();

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
