'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import type { LogSurat } from '@/lib/types';
import {
    FiClock,
    FiPlus,
    FiEdit3,
    FiSend,
    FiCheck,
    FiX,
    FiRotateCcw,
    FiCheckCircle,
    FiDownload,
    FiRefreshCw,
} from 'react-icons/fi';

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    dibuat: FiPlus,
    diperbarui: FiEdit3,
    dikirim: FiSend,
    ditandatangani: FiCheck,
    ditolak: FiX,
    direvisi: FiRotateCcw,
    diselesaikan: FiCheckCircle,
    diunduh: FiDownload,
    digenerate_ulang: FiRefreshCw,
};

const actionColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    dibuat: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-400' },
    diperbarui: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-400' },
    dikirim: { bg: 'bg-candy-50', text: 'text-candy-600', border: 'border-candy-200', dot: 'bg-candy-400' },
    ditandatangani: { bg: 'bg-mint-50', text: 'text-mint-600', border: 'border-mint-200', dot: 'bg-mint-400' },
    ditolak: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-400' },
    direvisi: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-400' },
    diselesaikan: { bg: 'bg-grape-50', text: 'text-grape-600', border: 'border-grape-200', dot: 'bg-grape-400' },
    diunduh: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', dot: 'bg-sky-400' },
    digenerate_ulang: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-400' },
};

const defaultColors = { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };

export default function LogSuratPage() {
    const params = useParams();
    const id = params?.id as string;

    const [logs, setLogs] = useState<LogSurat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await api.get(`/surat-tugas/${id}/log`);
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }) + ', ' + date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 30) return `${diffDays} hari lalu`;
        return formatDateTime(dateStr);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-500 to-grape-500 text-white flex items-center justify-center shadow-md">
                    <FiClock className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Log Aktivitas Surat</h3>
                <span className="ml-1 px-2.5 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-600 text-xs font-bold">
                    {logs.length}
                </span>
            </div>

            {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-bubblegum-300">
                    <FiClock className="text-4xl mb-2" />
                    <p className="text-sm font-medium">Belum ada aktivitas</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-bubblegum-200 via-bubblegum-100 to-transparent" />

                    <div className="space-y-0">
                        {logs.map((log, idx) => {
                            const colors = actionColors[log.aksi] || defaultColors;
                            const Icon = actionIcons[log.aksi] || FiClock;
                            const isFirst = idx === 0;

                            return (
                                <div key={log.id} className="relative flex gap-4 pb-5 last:pb-0">
                                    {/* Timeline dot */}
                                    <div className={`relative z-10 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-sm ${isFirst ? 'scale-110' : ''} ${colors.bg} ${colors.border}`}>
                                        <Icon className={`text-sm ${colors.text}`} />
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 min-w-0 rounded-2xl p-4 border transition-all ${isFirst ? 'bg-white shadow-sm border-bubblegum-200' : 'bg-white/50 border-bubblegum-100 hover:bg-white hover:border-bubblegum-200'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold ${isFirst ? 'text-bubblegum-800' : 'text-bubblegum-700'}`}>
                                                    {log.label}
                                                </p>
                                                {log.user && (
                                                    <p className="text-xs text-bubblegum-500 mt-0.5">
                                                        oleh <span className="font-medium text-bubblegum-600">{log.user.name}</span>
                                                    </p>
                                                )}
                                                {log.keterangan && (
                                                    <p className="text-xs text-bubblegum-500 mt-1.5 bg-bubblegum-50/80 rounded-lg px-2.5 py-1.5 border border-bubblegum-100">
                                                        {log.keterangan}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] text-bubblegum-400 font-medium whitespace-nowrap">
                                                    {formatTimeAgo(log.created_at)}
                                                </p>
                                                <p className="text-[10px] text-bubblegum-300 mt-0.5 whitespace-nowrap">
                                                    {formatDateTime(log.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
