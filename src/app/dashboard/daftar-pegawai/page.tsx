'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiUsers, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
    FiClock, FiCheckCircle, FiXCircle, FiLoader, FiUser, FiBriefcase,
    FiHash, FiDatabase, FiAlertTriangle,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import SearchableSelect from '@/components/SearchableSelect';
import type { SelectOption } from '@/components/SearchableSelect';
import api from '@/lib/api';
import type { Instance } from '@/lib/types';

interface EmployeeItem {
    id: number;
    semesta_id: number;
    nama_lengkap: string;
    nip: string;
    jenis_pegawai: string | null;
    instance_id: number | null;
    jabatan: string | null;
    foto_pegawai: string | null;
    eselon: string | null;
    golongan: string | null;
    pangkat: string | null;
    kepala_skpd: string | null;
    instance?: { id: number; name: string; alias: string | null } | null;
}

interface SyncLogItem {
    id: number;
    instance_id: number | null;
    instance_name: string | null;
    id_skpd: number | null;
    status: 'running' | 'success' | 'failed';
    total_fetched: number;
    total_created: number;
    total_updated: number;
    total_deleted: number;
    error_message: string | null;
    duration_seconds: number | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
    instance?: { id: number; name: string; alias: string | null } | null;
}

interface Stats {
    total_employees: number;
    total_instances: number;
    last_sync_at: string | null;
    last_sync_status: string | null;
}

type Tab = 'employees' | 'sync-logs';

export default function DaftarPegawaiPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Check role
    const isSuperAdmin = user?.role?.slug === 'super-admin';

    // Employees state
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [empLoading, setEmpLoading] = useState(true);
    const [empPage, setEmpPage] = useState(1);
    const [empLastPage, setEmpLastPage] = useState(1);
    const [empTotal, setEmpTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterInstance, setFilterInstance] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync logs state
    const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
    const [logLoading, setLogLoading] = useState(false);
    const [logPage, setLogPage] = useState(1);
    const [logLastPage, setLogLastPage] = useState(1);
    const [logTotal, setLogTotal] = useState(0);

    // Stats
    const [stats, setStats] = useState<Stats | null>(null);
    const [instances, setInstances] = useState<Instance[]>([]);
    const [syncing, setSyncing] = useState(false);

    // Tab
    const [activeTab, setActiveTab] = useState<Tab>('employees');

    // Debounce search input
    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
        }, 500);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setDebouncedSearch(search);
        }
    };

    // Fetch employees
    const fetchEmployees = useCallback(async (page = 1) => {
        setEmpLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), per_page: '20' });
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (filterInstance) params.set('instance_id', filterInstance);

            const res = await api.get(`/employees?${params.toString()}`);
            if (res.data.success) {
                setEmployees(res.data.data);
                setEmpPage(res.data.meta.current_page);
                setEmpLastPage(res.data.meta.last_page);
                setEmpTotal(res.data.meta.total);
            }
        } catch {
            // silently fail
        } finally {
            setEmpLoading(false);
        }
    }, [debouncedSearch, filterInstance]);

    // Fetch sync logs
    const fetchSyncLogs = useCallback(async (page = 1) => {
        setLogLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page) });
            const res = await api.get(`/employees/sync-logs?${params.toString()}`);
            if (res.data.success) {
                setSyncLogs(res.data.data);
                setLogPage(res.data.meta.current_page);
                setLogLastPage(res.data.meta.last_page);
                setLogTotal(res.data.meta.total);
            }
        } catch {
            // silently fail
        } finally {
            setLogLoading(false);
        }
    }, []);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/employees/stats');
            if (res.data.success) setStats(res.data.data);
        } catch {
            // silently fail
        }
    }, []);

    // Fetch instances for filter
    const fetchInstances = useCallback(async () => {
        try {
            const res = await api.get('/instances');
            if (res.data.success) setInstances(res.data.data || []);
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        if (!isSuperAdmin) return;
        fetchStats();
        fetchInstances();
    }, [isSuperAdmin, fetchStats, fetchInstances]);

    useEffect(() => {
        if (!isSuperAdmin) return;
        if (activeTab === 'employees') {
            fetchEmployees(1);
        } else {
            fetchSyncLogs(1);
        }
    }, [isSuperAdmin, activeTab, fetchEmployees, fetchSyncLogs]);

    // Trigger sync
    const handleSync = async (instanceId?: number) => {
        if (syncing) return;
        setSyncing(true);
        try {
            const body = instanceId ? { instance_id: instanceId } : {};
            await api.post('/employees/sync', body);
            // Refresh stats and logs after short delay
            setTimeout(() => {
                fetchStats();
                if (activeTab === 'sync-logs') fetchSyncLogs(logPage);
            }, 2000);
        } catch {
            // silently fail
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Not super admin
    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-bubblegum-400">
                <FiAlertTriangle className="text-5xl mb-4 opacity-40" />
                <h2 className="text-lg font-semibold text-bubblegum-600">Akses Ditolak</h2>
                <p className="text-sm mt-1">Halaman ini hanya dapat diakses oleh Super Admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-bubblegum-800 flex items-center gap-2">
                        <FiUsers className="text-bubblegum-500" />
                        Daftar Pegawai
                    </h1>
                    <p className="text-sm text-bubblegum-400 mt-1">
                        Data pegawai dari Semesta API (sinkronisasi otomatis setiap 6 jam)
                    </p>
                </div>
                <button
                    onClick={() => handleSync()}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-bubblegum-gradient shadow-lg shadow-bubblegum-300/30 hover:shadow-bubblegum-300/50 transition-all disabled:opacity-60"
                >
                    <FiRefreshCw className={`text-base ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Menyinkronkan...' : 'Sync Sekarang'}
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card rounded-2xl border border-bubblegum-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-bubblegum-100 flex items-center justify-center">
                                <FiUsers className="text-bubblegum-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-bubblegum-800">{stats.total_employees.toLocaleString()}</p>
                                <p className="text-xs text-bubblegum-400">Total Pegawai</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl border border-bubblegum-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FiBriefcase className="text-blue-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-bubblegum-800">{stats.total_instances}</p>
                                <p className="text-xs text-bubblegum-400">OPD Tercatat</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl border border-bubblegum-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.last_sync_status === 'success' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                <FiClock className={`text-lg ${stats.last_sync_status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-bubblegum-800">{formatDate(stats.last_sync_at)}</p>
                                <p className="text-xs text-bubblegum-400">Sync Terakhir</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-bubblegum-50 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'employees'
                        ? 'bg-white text-bubblegum-700 shadow-sm'
                        : 'text-bubblegum-400 hover:text-bubblegum-600'
                        }`}
                >
                    <FiUsers className="inline mr-1.5 -mt-0.5" />
                    Pegawai ({empTotal.toLocaleString()})
                </button>
                <button
                    onClick={() => setActiveTab('sync-logs')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'sync-logs'
                        ? 'bg-white text-bubblegum-700 shadow-sm'
                        : 'text-bubblegum-400 hover:text-bubblegum-600'
                        }`}
                >
                    <FiDatabase className="inline mr-1.5 -mt-0.5" />
                    Log Sync ({logTotal})
                </button>
            </div>

            {/* Employees Tab */}
            {activeTab === 'employees' && (
                <>
                    {/* Filters */}
                    <div className="glass-card rounded-2xl border border-bubblegum-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="flex items-center gap-2 flex-1">
                                <FiSearch className="text-bubblegum-400 shrink-0" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Cari nama, NIP, atau jabatan... (Enter)"
                                    className="w-full px-3 py-2 rounded-xl border-2 border-bubblegum-100 bg-white/60 text-sm text-bubblegum-700 focus:border-bubblegum-300 focus:ring-2 focus:ring-bubblegum-100 outline-none transition-all"
                                />
                            </div>

                            {/* Instance Filter */}
                            <div className="w-full sm:w-64">
                                <SearchableSelect
                                    options={instances.map((inst) => ({
                                        value: String(inst.id),
                                        label: inst.name,
                                    }))}
                                    value={filterInstance ? {
                                        value: filterInstance,
                                        label: instances.find(i => String(i.id) === filterInstance)?.name
                                            || filterInstance,
                                    } : null}
                                    onChange={(opt) => setFilterInstance(opt ? String(opt.value) : '')}
                                    placeholder="Semua OPD"
                                />
                            </div>

                            {/* Reset */}
                            {(search || filterInstance) && (
                                <button
                                    onClick={() => { setSearch(''); setDebouncedSearch(''); setFilterInstance(''); }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-bubblegum-500 hover:bg-bubblegum-50 border-2 border-bubblegum-200 transition-all"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Employee Table */}
                    <div className="glass-card rounded-2xl border border-bubblegum-100 overflow-hidden">
                        {empLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-3 border-bubblegum-300 border-t-transparent animate-spin" />
                                    <p className="text-sm text-bubblegum-400">Memuat data pegawai...</p>
                                </div>
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-bubblegum-400">
                                <FiUsers className="text-4xl mb-3 opacity-30" />
                                <p className="text-sm font-medium">Belum ada data pegawai</p>
                                <p className="text-xs mt-1">Jalankan sync untuk menarik data dari Semesta</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-bubblegum-100 bg-bubblegum-50/50">
                                            <th className="text-left px-4 py-3 font-semibold text-bubblegum-600">Pegawai</th>
                                            <th className="text-left px-4 py-3 font-semibold text-bubblegum-600 hidden md:table-cell">NIP</th>
                                            <th className="text-left px-4 py-3 font-semibold text-bubblegum-600 hidden lg:table-cell">Jabatan</th>
                                            <th className="text-left px-4 py-3 font-semibold text-bubblegum-600 hidden xl:table-cell">OPD</th>
                                            <th className="text-left px-4 py-3 font-semibold text-bubblegum-600 hidden sm:table-cell">Jenis</th>
                                            <th className="text-left px-4 py-3 font-semibold text-bubblegum-600 hidden lg:table-cell">Gol.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bubblegum-50">
                                        {employees.map((emp) => (
                                            <tr
                                                key={emp.id}
                                                onClick={() => router.push(`/dashboard/pegawai/${emp.id}`)}
                                                className="hover:bg-bubblegum-50/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-bubblegum-100 flex items-center justify-center shrink-0">
                                                            {/* <FiUser className="text-bubblegum-500 text-sm" /> */}
                                                            <img
                                                                src={emp.foto_pegawai || '/logo-oi.png'}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/logo-oi.png';
                                                                }}
                                                                alt={emp.nama_lengkap}
                                                                className="w-8 h-8 p-1 rounded-2xl object-cover shadow-lg shadow-blue-200/50 shrink-0" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-bubblegum-800 truncate">{emp.nama_lengkap}</p>
                                                            <p className="text-xs text-bubblegum-400 md:hidden">{emp.nip}</p>
                                                        </div>
                                                        {emp.kepala_skpd === 'Y' && (
                                                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">
                                                                Kepala
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-bubblegum-600 hidden md:table-cell font-mono text-xs">
                                                    {emp.nip}
                                                </td>
                                                <td className="px-4 py-3 text-bubblegum-600 hidden lg:table-cell">
                                                    <span className="line-clamp-1 text-xs">{emp.jabatan || '-'}</span>
                                                </td>
                                                <td className="px-4 py-3 hidden xl:table-cell">
                                                    <span className="text-xs text-bubblegum-500 line-clamp-1">
                                                        {emp.instance?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    {emp.jenis_pegawai && (
                                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-semibold ${emp.jenis_pegawai === 'PNS' ? 'bg-blue-100 text-blue-700' :
                                                            emp.jenis_pegawai === 'PPPK' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {emp.jenis_pegawai}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-bubblegum-600 hidden lg:table-cell text-xs">
                                                    {emp.golongan || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {empLastPage > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-bubblegum-100">
                                <p className="text-xs text-bubblegum-400">
                                    Halaman {empPage} dari {empLastPage} ({empTotal.toLocaleString()} pegawai)
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => fetchEmployees(empPage - 1)}
                                        disabled={empPage <= 1}
                                        className="p-2 rounded-xl text-bubblegum-400 hover:bg-bubblegum-50 disabled:opacity-30 transition-all"
                                    >
                                        <FiChevronLeft />
                                    </button>
                                    {Array.from({ length: Math.min(5, empLastPage) }, (_, i) => {
                                        let page: number;
                                        if (empLastPage <= 5) {
                                            page = i + 1;
                                        } else if (empPage <= 3) {
                                            page = i + 1;
                                        } else if (empPage >= empLastPage - 2) {
                                            page = empLastPage - 4 + i;
                                        } else {
                                            page = empPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => fetchEmployees(page)}
                                                className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${page === empPage
                                                    ? 'bg-bubblegum-gradient text-white shadow-sm'
                                                    : 'text-bubblegum-400 hover:bg-bubblegum-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => fetchEmployees(empPage + 1)}
                                        disabled={empPage >= empLastPage}
                                        className="p-2 rounded-xl text-bubblegum-400 hover:bg-bubblegum-50 disabled:opacity-30 transition-all"
                                    >
                                        <FiChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Sync Logs Tab */}
            {activeTab === 'sync-logs' && (
                <div className="glass-card rounded-2xl border border-bubblegum-100 overflow-hidden">
                    {logLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 rounded-full border-3 border-bubblegum-300 border-t-transparent animate-spin" />
                                <p className="text-sm text-bubblegum-400">Memuat log sync...</p>
                            </div>
                        </div>
                    ) : syncLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-bubblegum-400">
                            <FiDatabase className="text-4xl mb-3 opacity-30" />
                            <p className="text-sm font-medium">Belum ada log sync</p>
                            <p className="text-xs mt-1">Jalankan sync untuk melihat log</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-bubblegum-50">
                            {syncLogs.map((log) => (
                                <div key={log.id} className="px-5 py-4 hover:bg-bubblegum-50/30 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Status Icon */}
                                        <div className="shrink-0 mt-0.5">
                                            {log.status === 'success' ? (
                                                <FiCheckCircle className="text-xl text-emerald-500" />
                                            ) : log.status === 'failed' ? (
                                                <FiXCircle className="text-xl text-red-500" />
                                            ) : (
                                                <FiLoader className="text-xl text-amber-500 animate-spin" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm text-bubblegum-800">
                                                    {log.instance_name || 'Semua OPD'}
                                                </span>
                                                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-semibold ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {log.status === 'success' ? 'Berhasil' : log.status === 'failed' ? 'Gagal' : 'Berjalan'}
                                                </span>
                                                <span className="text-[11px] text-bubblegum-300">{formatDate(log.created_at)}</span>
                                            </div>

                                            {log.status === 'success' && (
                                                <div className="flex flex-wrap gap-3 mt-1.5">
                                                    <span className="text-xs text-bubblegum-500">
                                                        <FiHash className="inline -mt-0.5 mr-0.5" />Fetched: <strong>{log.total_fetched}</strong>
                                                    </span>
                                                    <span className="text-xs text-emerald-600">
                                                        +{log.total_created} baru
                                                    </span>
                                                    <span className="text-xs text-amber-600">
                                                        ~{log.total_updated} diupdate
                                                    </span>
                                                    {log.total_deleted > 0 && (
                                                        <span className="text-xs text-red-500">
                                                            -{log.total_deleted} dihapus
                                                        </span>
                                                    )}
                                                    {log.duration_seconds != null && (
                                                        <span className="text-xs text-bubblegum-400">
                                                            ({log.duration_seconds}s)
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {log.status === 'failed' && log.error_message && (
                                                <p className="text-xs text-red-500 mt-1 line-clamp-2">{log.error_message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {logLastPage > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-bubblegum-100">
                            <p className="text-xs text-bubblegum-400">
                                Halaman {logPage} dari {logLastPage} ({logTotal} log)
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fetchSyncLogs(logPage - 1)}
                                    disabled={logPage <= 1}
                                    className="p-2 rounded-xl text-bubblegum-400 hover:bg-bubblegum-50 disabled:opacity-30 transition-all"
                                >
                                    <FiChevronLeft />
                                </button>
                                <button
                                    onClick={() => fetchSyncLogs(logPage + 1)}
                                    disabled={logPage >= logLastPage}
                                    className="p-2 rounded-xl text-bubblegum-400 hover:bg-bubblegum-50 disabled:opacity-30 transition-all"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
