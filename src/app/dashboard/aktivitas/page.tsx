'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FiActivity, FiFilter, FiCalendar, FiChevronLeft, FiChevronRight, FiInfo,
  FiLogIn, FiLogOut, FiFilePlus, FiEdit, FiTrash2, FiSend,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiFlag, FiDownload, FiClipboard, FiMapPin,
  FiMonitor, FiSmartphone, FiGlobe,
} from 'react-icons/fi';
import type { ReactNode } from 'react';
import api from '@/lib/api';
import { ActivityLogItem, ACTIVITY_LOG_ACTION_LABELS, ACTIVITY_LOG_ACTION_COLORS } from '@/lib/types';

interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

function parseUserAgent(ua: string | null): ParsedUserAgent | null {
  if (!ua) return null;

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match?.[1]?.split('.')[0] || ''}`.trim();
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    const match = ua.match(/OPR\/([\d.]+)/);
    browser = `Opera ${match?.[1]?.split('.')[0] || ''}`.trim();
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match?.[1]?.split('.')[0] || ''}`.trim();
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${match?.[1]?.split('.')[0] || ''}`.trim();
  } else if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match?.[1]?.split('.')[0] || ''}`.trim();
  }

  // OS detection
  let os = 'Unknown';
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X ([\d_]+)/);
    os = `macOS ${match?.[1]?.replace(/_/g, '.') || ''}`.trim();
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android ([\d.]+)/);
    os = `Android ${match?.[1] || ''}`.trim();
  } else if (ua.includes('iPhone OS') || ua.includes('iPad')) {
    const match = ua.match(/OS ([\d_]+)/);
    os = `iOS ${match?.[1]?.replace(/_/g, '.') || ''}`.trim();
  } else if (ua.includes('Linux')) os = 'Linux';

  // Device detection
  let device = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    device = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}

function getColorClasses(color: string): string {
  const map: Record<string, string> = {
    mint: 'bg-emerald-100 text-emerald-700',
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    candy: 'bg-sky-100 text-sky-700',
    orange: 'bg-orange-100 text-orange-700',
    grape: 'bg-purple-100 text-purple-700',
    sky: 'bg-cyan-100 text-cyan-700',
  };
  return map[color] || map.gray;
}

function getActionIcon(action: string): ReactNode {
  const base = 'text-xl';
  const map: Record<string, ReactNode> = {
    login: <FiLogIn className={`${base} text-emerald-500`} />,
    logout: <FiLogOut className={`${base} text-gray-500`} />,
    create_surat: <FiFilePlus className={`${base} text-blue-500`} />,
    update_surat: <FiEdit className={`${base} text-amber-500`} />,
    delete_surat: <FiTrash2 className={`${base} text-red-500`} />,
    kirim_surat: <FiSend className={`${base} text-sky-500`} />,
    tandatangani_surat: <FiCheckCircle className={`${base} text-emerald-500`} />,
    tolak_surat: <FiXCircle className={`${base} text-red-500`} />,
    revisi_surat: <FiRefreshCw className={`${base} text-orange-500`} />,
    selesai_surat: <FiFlag className={`${base} text-purple-500`} />,
    download_surat: <FiDownload className={`${base} text-cyan-500`} />,
    submit_laporan: <FiClipboard className={`${base} text-purple-500`} />,
    update_spd: <FiEdit className={`${base} text-amber-500`} />,
  };
  return map[action] || <FiMapPin className={`${base} text-gray-400`} />;
}

interface AutoDeleteStatus {
  enabled: boolean;
  retention_days: number;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [autoDeleteStatus, setAutoDeleteStatus] = useState<AutoDeleteStatus | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await api.get(`/activity-log?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data.data || []);
        setCurrentPage(res.data.data.current_page);
        setLastPage(res.data.data.last_page);
        setTotal(res.data.data.total);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo]);

  const fetchAutoDeleteStatus = useCallback(async () => {
    try {
      const res = await api.get('/activity-log/auto-delete-status');
      if (res.data.success) {
        setAutoDeleteStatus(res.data.data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  useEffect(() => {
    fetchAutoDeleteStatus();
  }, [fetchAutoDeleteStatus]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= lastPage) {
      fetchLogs(page);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bubblegum-800 flex items-center gap-2">
            <FiActivity className="text-bubblegum-500" />
            Riwayat Aktivitas
          </h1>
          <p className="text-sm text-bubblegum-400 mt-1">
            Log aktivitas Anda di dalam aplikasi ({total} total)
          </p>
        </div>

        {/* Auto-delete status badge */}
        {autoDeleteStatus && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-medium ${
            autoDeleteStatus.enabled
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <FiInfo className="text-sm" />
            Auto-hapus: {autoDeleteStatus.enabled ? `Aktif (${autoDeleteStatus.retention_days} hari)` : 'Nonaktif'}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl border border-bubblegum-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Action Filter */}
          <div className="flex items-center gap-2 flex-1">
            <FiFilter className="text-bubblegum-400 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-bubblegum-100 bg-white/60 text-sm text-bubblegum-700 focus:border-bubblegum-300 focus:ring-2 focus:ring-bubblegum-100 outline-none transition-all"
            >
              <option value="">Semua Aktivitas</option>
              {Object.entries(ACTIVITY_LOG_ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <FiCalendar className="text-bubblegum-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-bubblegum-100 bg-white/60 text-sm text-bubblegum-700 focus:border-bubblegum-300 focus:ring-2 focus:ring-bubblegum-100 outline-none transition-all"
              placeholder="Dari tanggal"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <span className="text-bubblegum-400 text-sm">s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-bubblegum-100 bg-white/60 text-sm text-bubblegum-700 focus:border-bubblegum-300 focus:ring-2 focus:ring-bubblegum-100 outline-none transition-all"
              placeholder="Sampai tanggal"
            />
          </div>

          {/* Reset */}
          {(actionFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setActionFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-bubblegum-500 hover:bg-bubblegum-50 border-2 border-bubblegum-200 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Activity Log List */}
      <div className="glass-card rounded-2xl border border-bubblegum-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-3 border-bubblegum-300 border-t-transparent animate-spin" />
              <p className="text-sm text-bubblegum-400">Memuat riwayat...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-bubblegum-400">
            <FiActivity className="text-4xl mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada aktivitas</p>
            <p className="text-xs mt-1">Aktivitas Anda akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-bubblegum-50">
            {logs.map((log) => {
              const color = ACTIVITY_LOG_ACTION_COLORS[log.action] || 'gray';
              const parsed = parseUserAgent(log.user_agent);
              return (
                <div key={log.id} className="px-5 py-4 hover:bg-bubblegum-50/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold ${getColorClasses(color)}`}>
                          {log.label || ACTIVITY_LOG_ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className="text-[11px] text-bubblegum-300">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-sm text-bubblegum-700 mt-1">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {log.ip_address && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-bubblegum-300">
                            <FiGlobe className="text-[10px]" />
                            {log.ip_address}
                          </span>
                        )}
                        {parsed && (
                          <>
                            <span className="inline-flex items-center gap-1 text-[10px] text-bubblegum-300">
                              {parsed.device === 'Mobile' ? <FiSmartphone className="text-[10px]" /> : <FiMonitor className="text-[10px]" />}
                              {parsed.device}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-bubblegum-300">
                              {parsed.os}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-bubblegum-300">
                              {parsed.browser}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-bubblegum-100 bg-white/40">
            <p className="text-xs text-bubblegum-400">
              Halaman {currentPage} dari {lastPage}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-bubblegum-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="text-bubblegum-500" />
              </button>
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                let page: number;
                if (lastPage <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= lastPage - 2) {
                  page = lastPage - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-bubblegum-gradient text-white shadow-md shadow-bubblegum-300/30'
                        : 'text-bubblegum-500 hover:bg-bubblegum-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= lastPage}
                className="p-1.5 rounded-lg hover:bg-bubblegum-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight className="text-bubblegum-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
