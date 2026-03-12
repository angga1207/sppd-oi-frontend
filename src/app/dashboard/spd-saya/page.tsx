'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { SuratPerjalananDinas, SuratTugasStatus, PaginatedResponse } from '@/lib/types';
import { FiSearch, FiEye, FiFilter, FiSend } from 'react-icons/fi';

const statusConfig: Record<SuratTugasStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  dikirim: { label: 'Dikirim', color: 'bg-candy-100 text-candy-700' },
  ditandatangani: { label: 'Ditandatangani', color: 'bg-mint-100 text-mint-700' },
  ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
  selesai: { label: 'Selesai', color: 'bg-grape-100 text-grape-700' },
};

export default function SpdSayaPage() {
  const [data, setData] = useState<PaginatedResponse<SuratPerjalananDinas> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/spd/saya', { params });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bubblegum-800">SPD Saya</h1>
        <p className="text-sm text-bubblegum-500 mt-1">Daftar Surat Perjalanan Dinas yang Anda ditugaskan</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-bubblegum-400" />
          <input
            type="text"
            placeholder="Cari nomor SPD, tujuan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-bubblegum-200 bg-white/50 text-sm text-bubblegum-800 placeholder:text-bubblegum-300 focus:outline-none focus:border-bubblegum-400 transition-colors"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-bubblegum-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2.5 rounded-2xl border-2 border-bubblegum-200 bg-white/50 text-sm text-bubblegum-700 focus:outline-none focus:border-bubblegum-400 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="dikirim">Dikirim</option>
            <option value="ditandatangani">Ditandatangani</option>
            <option value="ditolak">Ditolak</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-bubblegum-300">
            <FiSend className="text-5xl mb-3" />
            <p className="text-sm font-medium">Belum ada SPD untuk Anda</p>
            <p className="text-xs mt-1">SPD akan muncul di sini setelah Anda ditugaskan dalam surat tugas yang memiliki SPD</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bubblegum-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">No</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">Nomor SPD</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">Surat Tugas</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">Tujuan</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">Tanggal</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bubblegum-50">
                  {data.data.map((spd, idx) => {
                    const no = (data.current_page - 1) * data.per_page + idx + 1;
                    const status = statusConfig[spd.status];
                    return (
                      <tr key={spd.id} className="hover:bg-bubblegum-50/50 transition-colors">
                        <td className="px-6 py-3 text-bubblegum-600">{no}</td>
                        <td className="px-6 py-3 font-medium text-bubblegum-800">
                          {spd.nomor_spd || <span className="text-bubblegum-300 italic">Belum ada</span>}
                        </td>
                        <td className="px-6 py-3 text-bubblegum-600">
                          {spd.surat_tugas?.nomor_surat || '-'}
                        </td>
                        <td className="px-6 py-3 text-bubblegum-600 max-w-[150px] truncate">
                          {spd.surat_tugas?.lokasi_tujuan || '-'}
                        </td>
                        <td className="px-6 py-3 text-bubblegum-600 whitespace-nowrap">
                          {formatDate(spd.surat_tugas?.tanggal_berangkat ?? null)}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          {spd.signed_at && (
                            <p className="text-[10px] text-bubblegum-400 mt-1 whitespace-nowrap">Ditandatangani: {formatDate(spd.signed_at)}</p>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/dashboard/surat-tugas/${spd.surat_tugas_id}`}
                              className="p-2 rounded-xl text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-100 transition-colors"
                              title="Lihat Surat Tugas"
                            >
                              <FiEye className="text-base" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-bubblegum-100">
                <p className="text-xs text-bubblegum-400">
                  Menampilkan {(data.current_page - 1) * data.per_page + 1} — {Math.min(data.current_page * data.per_page, data.total)} dari {data.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-bubblegum-600 hover:bg-bubblegum-100 disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                    disabled={page === data.last_page}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-bubblegum-600 hover:bg-bubblegum-100 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
