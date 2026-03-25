'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiShield, FiSearch, FiUnlock, FiAlertTriangle, FiClock,
    FiChevronLeft, FiChevronRight, FiRefreshCw, FiSlash, FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface LoginAttemptItem {
    id: number;
    username: string;
    ip_address: string;
    attempts: number;
    is_blocked: boolean;
    blocked_until: string | null;
    last_attempt_at: string | null;
    created_at: string;
}

type FilterStatus = '' | 'blocked' | 'warning';

export default function LoginAttemptsPage() {
    const router = useRouter();
    const { user } = useAuth();

    const isSuperAdmin = user?.role?.slug === 'super-admin';

    const [items, setItems] = useState<LoginAttemptItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
    const [unblocking, setUnblocking] = useState<number | null>(null);
    const [unblockingAll, setUnblockingAll] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page };
            if (search) params.search = search;
            if (filterStatus) params.status = filterStatus;

            const res = await api.get('/login-attempts', { params });
            const data = res.data.data;
            setItems(data.data);
            setLastPage(data.last_page);
            setTotal(data.total);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus]);

    useEffect(() => {
        if (!isSuperAdmin) {
            router.replace('/dashboard');
            return;
        }
        fetchData();
    }, [fetchData, isSuperAdmin, router]);

    const handleUnblock = async (id: number) => {
        setUnblocking(id);
        try {
            await api.post(`/login-attempts/${id}/unblock`);
            fetchData();
        } catch {
            // ignore
        } finally {
            setUnblocking(null);
        }
    };

    const handleUnblockAll = async () => {
        if (!confirm('Unblock semua user yang diblokir?')) return;
        setUnblockingAll(true);
        try {
            await api.post('/login-attempts/unblock-all');
            fetchData();
        } catch {
            // ignore
        } finally {
            setUnblockingAll(false);
        }
    };

    const isCurrentlyBlocked = (item: LoginAttemptItem) => {
        return item.is_blocked && item.blocked_until && new Date(item.blocked_until) > new Date();
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getRemainingTime = (blockedUntil: string) => {
        const diff = Math.max(0, Math.floor((new Date(blockedUntil).getTime() - Date.now()) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${m}m ${s}s`;
    };

    if (!isSuperAdmin) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-bubblegum-900 flex items-center gap-2">
                        <FiShield className="text-bubblegum-600" />
                        Keamanan Login
                    </h1>
                    <p className="text-sm text-bubblegum-500 mt-1">
                        Kelola percobaan login gagal dan blokir pengguna
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bubblegum-100 text-bubblegum-700 hover:bg-bubblegum-200 transition-colors text-sm font-medium"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleUnblockAll}
                        disabled={unblockingAll}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <FiUnlock />
                        {unblockingAll ? 'Memproses...' : 'Unblock Semua'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-bubblegum-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-bubblegum-100 flex items-center justify-center">
                            <FiSlash className="text-bubblegum-600" />
                        </div>
                        <div>
                            <p className="text-xs text-bubblegum-400">Total Record</p>
                            <p className="text-xl font-bold text-bubblegum-900">{total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <FiAlertTriangle className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-red-400">Diblokir</p>
                            <p className="text-xl font-bold text-red-600">
                                {items.filter(isCurrentlyBlocked).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-amber-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <FiShield className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-400">Perlu Captcha</p>
                            <p className="text-xl font-bold text-amber-600">
                                {items.filter((i) => i.attempts >= 5 && !isCurrentlyBlocked(i)).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-bubblegum-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-bubblegum-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Cari username atau IP..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-bubblegum-200 text-sm focus:border-bubblegum-500 focus:ring-2 focus:ring-bubblegum-100 outline-none"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }}
                        className="px-4 py-2.5 rounded-xl border border-bubblegum-200 text-sm focus:border-bubblegum-500 focus:ring-2 focus:ring-bubblegum-100 outline-none bg-white"
                    >
                        <option value="">Semua Status</option>
                        <option value="blocked">Diblokir</option>
                        <option value="warning">Perlu Captcha</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-bubblegum-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <FiRefreshCw className="text-2xl text-bubblegum-400 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-bubblegum-400">
                        <FiCheckCircle className="text-4xl mb-2 text-emerald-400" />
                        <p className="text-sm">Tidak ada percobaan login gagal</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-bubblegum-50/50 border-b border-bubblegum-100">
                                    <th className="text-left px-4 py-3 font-semibold text-bubblegum-700">Username</th>
                                    <th className="text-left px-4 py-3 font-semibold text-bubblegum-700">IP Address</th>
                                    <th className="text-center px-4 py-3 font-semibold text-bubblegum-700">Percobaan</th>
                                    <th className="text-center px-4 py-3 font-semibold text-bubblegum-700">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-bubblegum-700">Percobaan Terakhir</th>
                                    <th className="text-center px-4 py-3 font-semibold text-bubblegum-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const blocked = isCurrentlyBlocked(item);
                                    const needsCaptcha = item.attempts >= 5 && !blocked;

                                    return (
                                        <tr key={item.id} className="border-b border-bubblegum-50 hover:bg-bubblegum-50/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-bubblegum-900">{item.username}</td>
                                            <td className="px-4 py-3 text-bubblegum-600 font-mono text-xs">{item.ip_address}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    item.attempts >= 10 ? 'bg-red-100 text-red-700' :
                                                    item.attempts >= 5 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-bubblegum-100 text-bubblegum-700'
                                                }`}>
                                                    {item.attempts}x
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {blocked ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                            <FiAlertTriangle className="text-[10px]" />
                                                            Diblokir
                                                        </span>
                                                        <p className="text-[10px] text-red-400 mt-1 flex items-center justify-center gap-1">
                                                            <FiClock className="text-[9px]" />
                                                            {getRemainingTime(item.blocked_until!)}
                                                        </p>
                                                    </div>
                                                ) : needsCaptcha ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                        <FiShield className="text-[10px]" />
                                                        Captcha
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-bubblegum-100 text-bubblegum-600">
                                                        Percobaan
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-bubblegum-500">
                                                {formatDate(item.last_attempt_at)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleUnblock(item.id)}
                                                    disabled={unblocking === item.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                                >
                                                    <FiUnlock className="text-xs" />
                                                    {unblocking === item.id ? '...' : 'Unblock'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-bubblegum-100 bg-bubblegum-50/30">
                        <p className="text-xs text-bubblegum-500">
                            Halaman {page} dari {lastPage} ({total} record)
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg hover:bg-bubblegum-100 disabled:opacity-30 transition-colors"
                            >
                                <FiChevronLeft className="text-sm" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                disabled={page >= lastPage}
                                className="p-2 rounded-lg hover:bg-bubblegum-100 disabled:opacity-30 transition-colors"
                            >
                                <FiChevronRight className="text-sm" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
