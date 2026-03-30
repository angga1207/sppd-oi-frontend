'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { SuratTugas, SuratTugasStatus, PaginatedResponse } from '@/lib/types';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiSend, FiFileText, FiCheckCircle, FiXCircle, FiFlag } from 'react-icons/fi'; import type { ReactNode } from 'react';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';
import SearchableSelect from '@/components/SearchableSelect';
import type { SelectOption } from '@/components/SearchableSelect';

const statusConfig: Record<SuratTugasStatus, { label: string; color: string; icon: ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <FiFileText /> },
  dikirim: { label: 'Menunggu Tandatangan', color: 'bg-candy-100 text-candy-700', icon: <FiSend /> },
  ditandatangani: { label: 'Ditandatangani', color: 'bg-mint-100 text-mint-700', icon: <FiCheckCircle /> },
  ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: <FiXCircle /> },
  selesai: { label: 'Selesai', color: 'bg-grape-100 text-grape-700', icon: <FiFlag /> },
};

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2025; y--) {
    years.push(y);
  }
  return years;
}

const statusOptions: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'dikirim', label: 'Menunggu Tandatangan' },
  { value: 'ditandatangani', label: 'Ditandatangani' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'selesai', label: 'Selesai' },
];

const monthOptions: SelectOption[] = MONTHS.map((m) => ({ value: m.value, label: m.label }));

function getYearSelectOptions(): SelectOption[] {
  return getYearOptions().map((y) => ({ value: String(y), label: String(y) }));
}

export default function SuratTugasListPage() {
  const [data, setData] = useState<PaginatedResponse<SuratTugas> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (yearFilter) params.year = yearFilter;
      if (monthFilter) params.month = monthFilter;

      const res = await api.get('/surat-tugas', { params });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, yearFilter, monthFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    const confirmed = await swalConfirm(
      'Hapus Surat Tugas?',
      'Surat tugas yang dihapus tidak dapat dikembalikan.',
      { confirmText: 'Ya, Hapus', icon: 'warning', isDanger: true }
    );
    if (!confirmed) return;
    setDeleting(id);
    try {
      const res = await api.delete(`/surat-tugas/${id}`);
      if (res.data.success) {
        swalSuccess('Terhapus!', 'Surat tugas berhasil dihapus.');
        fetchData();
      } else {
        swalError('Gagal', res.data.message || 'Gagal menghapus.');
      }
    } catch {
      swalError('Gagal', 'Gagal menghapus surat tugas.');
    } finally {
      setDeleting(null);
    }
  };

  const handleKirim = async (id: number) => {
    const confirmed = await swalConfirm(
      'Kirim Surat Tugas?',
      'Surat tugas akan dikirim untuk ditandatangani.',
      { confirmText: 'Ya, Kirim', icon: 'question' }
    );
    if (!confirmed) return;
    try {
      const res = await api.post(`/surat-tugas/${id}/kirim`, {});
      if (res.data.success) {
        swalSuccess('Terkirim!', 'Surat tugas berhasil dikirim.');
        fetchData();
      } else {
        swalError('Gagal', res.data.message || 'Gagal mengirim.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      swalError('Gagal', error?.response?.data?.message || 'Gagal mengirim surat tugas.');
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bubblegum-800">Surat Tugas</h1>
          <p className="text-sm text-bubblegum-500 mt-1">Kelola surat tugas & perjalanan dinas</p>
        </div>
        <Link
          href="/dashboard/surat-tugas/create"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-bubblegum-500 to-grape-500 text-white font-medium text-sm shadow-lg shadow-bubblegum-300/40 hover:shadow-xl hover:shadow-bubblegum-400/40 transition-all duration-300 hover:scale-105"
        >
          <FiPlus className="text-lg" />
          Buat Surat Tugas
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-bubblegum-400" />
          <input
            type="text"
            placeholder="Cari nomor surat, penandatangan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-bubblegum-200 bg-white/50 text-sm text-bubblegum-800 placeholder:text-bubblegum-300 focus:outline-none focus:border-bubblegum-400 transition-colors"
          />
        </div>
        <div className="w-full sm:w-48">
          <SearchableSelect
            options={statusOptions}
            value={statusFilter ? statusOptions.find(o => o.value === statusFilter) || null : null}
            onChange={(opt) => { setStatusFilter(opt ? String(opt.value) : ''); setPage(1); }}
            placeholder="Semua Status"
          />
        </div>
        <div className="w-full sm:w-36">
          <SearchableSelect
            options={getYearSelectOptions()}
            value={yearFilter ? { value: yearFilter, label: yearFilter } : null}
            onChange={(opt) => { setYearFilter(opt ? String(opt.value) : ''); setPage(1); }}
            placeholder="Tahun"
            isClearable={false}
          />
        </div>
        <div className="w-full sm:w-40">
          <SearchableSelect
            options={monthOptions}
            value={monthFilter ? monthOptions.find(o => o.value === monthFilter) || null : null}
            onChange={(opt) => { setMonthFilter(opt ? String(opt.value) : ''); setPage(1); }}
            placeholder="Semua Bulan"
          />
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
            <FiSearch className="text-5xl mb-3" />
            <p className="text-sm font-medium">Belum ada surat tugas</p>
            <p className="text-xs mt-1">Klik tombol &quot;Buat Surat Tugas&quot; untuk mulai</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-bubblegum-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider" rowSpan={2}>No</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider border-b border-x border-bubblegum-100" colSpan={2}>Nomor Surat</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider border-b border-x border-bubblegum-100" colSpan={3}>Waktu Perjalanan</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider border-b border-x border-bubblegum-100" colSpan={2}>Tujuan</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider border-b border-x border-bubblegum-100" colSpan={2}>Penandatangan</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider border-r border-bubblegum-100" rowSpan={2}>Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-bubblegum-500 uppercase tracking-wider" rowSpan={2}>Aksi</th>
                  </tr>
                  <tr className="border-b border-bubblegum-100">
                    {/* Nomor Surat sub */}
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-l border-bubblegum-100">
                      Nomor
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-r border-bubblegum-100">
                      OPD Pembuat
                    </th>
                    {/* Waktu Perjalanan sub */}
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-l border-bubblegum-100">
                      Berangkat
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase">
                      Kembali
                    </th>
                    <th className="text-center px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-r border-bubblegum-100">
                      Hari
                    </th>
                    {/* Tujuan sub */}
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-l border-bubblegum-100">
                      Provinsi / Kab.
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-r border-bubblegum-100">
                      Lokasi & Alat Angkut
                    </th>
                    {/* Penandatangan sub */}
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-l border-bubblegum-100">
                      Nama / NIP
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-bubblegum-400 uppercase border-r border-bubblegum-100">
                      Pangkat / Gol.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bubblegum-50">
                  {data.data.map((st, idx) => {
                    const no = (data.current_page - 1) * data.per_page + idx + 1;
                    const status = statusConfig[st.status];
                    return (
                      <tr key={st.id} className="hover:bg-bubblegum-50/50 transition-colors">
                        {/* No */}
                        <td className="px-4 py-3 text-bubblegum-500 text-xs border-r border-bubblegum-100">{no}</td>

                        {/* Nomor Surat */}
                        <td className="px-4 py-3 border-l border-bubblegum-100">
                          <span className="font-semibold text-bubblegum-800 text-xs">
                            {st.nomor_surat || <span className="text-bubblegum-300 italic font-normal">Belum ada</span>}
                          </span>
                        </td>

                        {/* OPD Pembuat */}
                        <td className="px-4 py-3 border-r border-bubblegum-100">
                          <p className="text-bubblegum-700 text-xs font-medium truncate max-w-40">
                            {st.instance?.alias || st.instance?.name || '-'}
                          </p>
                        </td>

                        {/* Tgl Berangkat */}
                        <td className="px-4 py-3 text-bubblegum-600 text-xs whitespace-nowrap border-l border-bubblegum-100">
                          {formatDate(st.tanggal_berangkat)}
                        </td>

                        {/* Tgl Kembali */}
                        <td className="px-4 py-3 text-bubblegum-600 text-xs whitespace-nowrap">
                          {formatDate(st.tanggal_kembali)}
                        </td>

                        {/* Lama Hari */}
                        <td className="px-4 py-3 text-center border-r border-bubblegum-100">
                          {st.lama_perjalanan ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-700 text-xs font-semibold whitespace-nowrap">
                              {st.lama_perjalanan} hari
                            </span>
                          ) : (
                            <span className="text-bubblegum-300 text-xs">-</span>
                          )}
                        </td>

                        {/* Provinsi / Kabupaten / Kecamatan */}
                        <td className="px-4 py-3 border-l border-bubblegum-100">
                          <div className="max-w-40">
                            {st.tujuan_provinsi_nama && (
                              <p className="text-bubblegum-800 text-xs font-medium truncate">{st.tujuan_provinsi_nama}</p>
                            )}
                            {st.tujuan_kabupaten_nama && (
                              <p className="text-bubblegum-500 text-[11px] truncate">{st.tujuan_kabupaten_nama}</p>
                            )}
                            {st.tujuan_kecamatan_nama && (
                              <p className="text-bubblegum-400 text-[11px] truncate">{st.tujuan_kecamatan_nama}</p>
                            )}
                            {!st.tujuan_provinsi_nama && !st.tujuan_kabupaten_nama && (
                              <span className="text-bubblegum-300 text-xs">-</span>
                            )}
                          </div>
                        </td>

                        {/* Lokasi + Alat Angkut */}
                        <td className="px-4 py-3 border-r border-bubblegum-100">
                          <div className="max-w-45">
                            <p className="text-bubblegum-700 text-xs truncate">{st.lokasi_tujuan || '-'}</p>
                            {st.alat_angkut && (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-grape-50 text-grape-600 text-[10px] font-medium whitespace-nowrap">
                                <FiSend className="text-[9px]" />
                                {st.alat_angkut}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Penandatangan Nama / NIP */}
                        <td className="px-4 py-3 border-l border-bubblegum-100">
                          <div className="max-w-40">
                            <p className="text-bubblegum-800 text-xs font-medium truncate">{st.penandatangan_nama || '-'}</p>
                            {st.penandatangan_nip && (
                              <p className="text-bubblegum-400 text-[11px]">{st.penandatangan_nip}</p>
                            )}
                          </div>
                        </td>

                        {/* Penandatangan Pangkat / Golongan */}
                        <td className="px-4 py-3 border-r border-bubblegum-100">
                          <div className="max-w-35">
                            {st.penandatangan_instance ? (
                              <p className="text-bubblegum-600 text-[11px] truncate">{st.penandatangan_instance.alias || st.penandatangan_instance.name}</p>
                            ) : (
                              <span className="text-bubblegum-300 text-xs">-</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 border-l border-bubblegum-100">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          {st.signed_at && (
                            <p className="text-[10px] text-bubblegum-400 mt-1 whitespace-nowrap">Ditandatangani: {formatDate(st.signed_at)}</p>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3 border-l border-bubblegum-100">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/surat-tugas/${st.id}`}
                              className="p-2 rounded-xl text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-100 transition-colors"
                              title="Lihat Detail"
                            >
                              <FiEye className="text-base" />
                            </Link>
                            {st.status === 'draft' && (
                              <>
                                <Link
                                  href={`/dashboard/surat-tugas/${st.id}/edit`}
                                  className="p-2 rounded-xl text-candy-400 hover:text-candy-600 hover:bg-candy-100 transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit2 className="text-base" />
                                </Link>
                                <button
                                  onClick={() => handleKirim(st.id)}
                                  className="p-2 rounded-xl text-mint-400 hover:text-mint-600 hover:bg-mint-100 transition-colors"
                                  title="Kirim"
                                >
                                  <FiSend className="text-base" />
                                </button>
                                <button
                                  onClick={() => handleDelete(st.id)}
                                  disabled={deleting === st.id}
                                  className="p-2 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Hapus"
                                >
                                  <FiTrash2 className="text-base" />
                                </button>
                              </>
                            )}
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
                  {Array.from({ length: data.last_page }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === data.last_page || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-bubblegum-300">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${p === page
                            ? 'bg-bubblegum-500 text-white'
                            : 'text-bubblegum-600 hover:bg-bubblegum-100'
                            }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
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
