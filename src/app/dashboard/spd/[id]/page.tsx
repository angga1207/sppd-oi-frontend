'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { SuratPerjalananDinas } from '@/lib/types';
import {
  FiArrowLeft,
  FiSave,
  FiFileText,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiHash,
  FiDownload,
  FiTruck,
  FiCheck,
  FiEdit3,
  FiX,
  FiExternalLink,
  FiClipboard,
  FiBriefcase,
  FiPlus,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';
import { swalError, swalSuccess, swalWarning } from '@/lib/swal';
import type { SpdPengikutFormItem } from '@/lib/types';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  draft: { label: 'Draft', color: 'text-bubblegum-600', bg: 'bg-bubblegum-50', border: 'border-bubblegum-200', dot: 'bg-bubblegum-400' },
  dikirim: { label: 'Dikirim', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-400' },
  ditandatangani: { label: 'Ditandatangani', color: 'text-mint-600', bg: 'bg-mint-50', border: 'border-mint-200', dot: 'bg-mint-400' },
  ditolak: { label: 'Ditolak', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
  selesai: { label: 'Selesai', color: 'text-grape-600', bg: 'bg-grape-50', border: 'border-grape-200', dot: 'bg-grape-400' },
};

export default function SpdDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<SuratPerjalananDinas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editingNomor, setEditingNomor] = useState(false);
  const [nomorSpd, setNomorSpd] = useState('');

  // Tingkat Biaya state
  const [editingTingkat, setEditingTingkat] = useState(false);
  const [tingkatBiaya, setTingkatBiaya] = useState('');
  const [savingTingkat, setSavingTingkat] = useState(false);
  const [tingkatOptions, setTingkatOptions] = useState<{ value: string; label: string }[]>([]);

  // Pengikut state
  const [editingPengikut, setEditingPengikut] = useState(false);
  const [pengikutList, setPengikutList] = useState<SpdPengikutFormItem[]>([]);
  const [savingPengikut, setSavingPengikut] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTingkatOptions();
  }, [id]);

  const fetchTingkatOptions = async () => {
    try {
      const res = await api.get('/spd/tingkat-options');
      if (res.data.success) {
        setTingkatOptions(res.data.data);
      }
    } catch { /* */ }
  };

  const fetchData = async () => {
    try {
      const res = await api.get(`/spd/${id}`);
      if (res.data.success) {
        setData(res.data.data);
        setNomorSpd(res.data.data.nomor_spd || '');
        setTingkatBiaya(res.data.data.tingkat_biaya || '');
      }
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const handleSaveNomor = async () => {
    if (!nomorSpd.trim()) {
      swalWarning('Perhatian', 'Nomor SPD tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/spd/${id}`, { nomor_spd: nomorSpd.trim() });
      if (res.data.success) {
        setData(res.data.data);
        setEditingNomor(false);
        swalSuccess('Tersimpan!', 'Nomor SPD berhasil disimpan.');
      } else {
        swalError('Gagal', res.data.message || 'Gagal menyimpan.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      swalError('Gagal', error?.response?.data?.message || 'Gagal menyimpan nomor SPD.');
    } finally { setSaving(false); }
  };

  const handleSaveTingkat = async () => {
    if (!tingkatBiaya) {
      swalWarning('Perhatian', 'Tingkat biaya harus dipilih.');
      return;
    }
    setSavingTingkat(true);
    try {
      const res = await api.put(`/spd/${id}`, { tingkat_biaya: tingkatBiaya });
      if (res.data.success) {
        setData(res.data.data);
        setEditingTingkat(false);
        swalSuccess('Tersimpan!', 'Tingkat biaya berhasil disimpan.');
      } else {
        swalError('Gagal', res.data.message || 'Gagal menyimpan.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      swalError('Gagal', error?.response?.data?.message || 'Gagal menyimpan tingkat biaya.');
    } finally { setSavingTingkat(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/spd/${id}/download`, { responseType: 'blob' });
      const contentType = res.headers['content-type'] || '';
      const ext = contentType.includes('pdf') ? 'pdf' : 'docx';
      const filename = `SPD_${id}.${ext}`;
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      swalError('Gagal Mengunduh', 'Gagal mengunduh dokumen SPD.');
    } finally { setDownloading(false); }
  };

  // ========== Pengikut Handlers ==========

  const startEditPengikut = () => {
    const existing = (data?.pengikut || []).map((p) => ({
      nama: p.nama,
      tanggal_lahir: p.tanggal_lahir ? p.tanggal_lahir.split('T')[0] : '',
      keterangan: p.keterangan || '',
    }));
    setPengikutList(existing.length > 0 ? existing : []);
    setEditingPengikut(true);
  };

  const addPengikut = () => {
    setPengikutList((prev) => [...prev, { nama: '', tanggal_lahir: '', keterangan: '' }]);
  };

  const removePengikut = (idx: number) => {
    setPengikutList((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePengikut = (idx: number, field: keyof SpdPengikutFormItem, value: string) => {
    setPengikutList((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSavePengikut = async () => {
    // Validate: all pengikut must have nama
    const invalid = pengikutList.some((p) => !p.nama.trim());
    if (invalid) {
      swalWarning('Perhatian', 'Nama pengikut tidak boleh kosong.');
      return;
    }
    setSavingPengikut(true);
    try {
      const res = await api.put(`/spd/${id}/pengikut`, {
        pengikut: pengikutList.map((p) => ({
          nama: p.nama.trim(),
          tanggal_lahir: p.tanggal_lahir || null,
          keterangan: p.keterangan.trim() || null,
        })),
      });
      if (res.data.success) {
        setEditingPengikut(false);
        fetchData();
        swalSuccess('Tersimpan!', 'Data pengikut berhasil disimpan.');
      } else {
        swalError('Gagal', res.data.message || 'Gagal menyimpan.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      swalError('Gagal', error?.response?.data?.message || 'Gagal menyimpan data pengikut.');
    } finally { setSavingPengikut(false); }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (val: string | null | undefined) => {
    if (!val) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(val));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-bubblegum-300">
        <FiFileText className="text-5xl mb-3" />
        <p className="text-sm font-medium">SPD tidak ditemukan</p>
        <Link href="/dashboard/spd-saya" className="mt-3 text-bubblegum-500 text-sm hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const status = statusConfig[data.status];
  const st = data.surat_tugas;
  const pegawai = data.surat_tugas_pegawai;
  const isDraft = st?.status === 'draft';

  const spdTourSteps: TourStep[] = [
    {
      targetSelector: '#spd-header',
      title: 'Halaman Detail SPD',
      description: 'Ini adalah halaman detail Surat Perjalanan Dinas (SPD). Di sini Anda bisa melengkapi data SPD seperti nomor, tingkat biaya, dan pengikut.',
      position: 'bottom',
    },
    {
      targetSelector: '#spd-nomor',
      title: 'Nomor SPD',
      description: 'Masukkan nomor SPD dengan mengklik tombol Edit. Nomor SPD wajib diisi sebelum surat bisa ditandatangani.',
      position: 'bottom',
    },
    {
      targetSelector: '#spd-tingkat',
      title: 'Tingkat Biaya Perjalanan',
      description: 'Pilih tingkat biaya perjalanan dinas sesuai ketentuan yang berlaku (A, B, C, atau D).',
      position: 'bottom',
    },
    {
      targetSelector: '#spd-pegawai',
      title: 'Data Pegawai',
      description: 'Informasi pegawai yang ditugaskan untuk perjalanan dinas ini.',
      position: 'bottom',
    },
    {
      targetSelector: '#spd-pengikut',
      title: 'Pengikut',
      description: 'Tambahkan data keluarga/pengikut yang ikut dalam perjalanan dinas jika ada.',
      position: 'top',
    },
    {
      targetSelector: '#spd-perjalanan',
      title: 'Informasi Perjalanan',
      description: 'Detail perjalanan termasuk tujuan, tanggal berangkat/kembali, alat angkut, biaya, dan mata anggaran.',
      position: 'top',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Onboarding Tour */}
      <OnboardingTour steps={spdTourSteps} storageKey="onboarding_spd_detail" />

      {/* Header Card */}
      <div id="spd-header" className="glass-card rounded-3xl p-6 border border-bubblegum-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              className="mt-1 p-2.5 rounded-2xl text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-100 transition-all"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            <div>
              <p className="text-xs text-bubblegum-400 uppercase tracking-wider font-semibold mb-1">Surat Perjalanan Dinas</p>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-grape-600 to-bubblegum-600 bg-clip-text text-transparent">
                {data.nomor_spd || 'Belum Ada Nomor SPD'}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-semibold border ${status.bg} ${status.color} ${status.border}`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                {st && (
                  <Link
                    href={`/dashboard/surat-tugas/${st.id}`}
                    className="inline-flex items-center gap-1 text-xs text-grape-500 hover:text-grape-700 font-medium transition-colors"
                  >
                    <FiExternalLink className="text-[10px]" /> ST: {st.nomor_surat || 'Draft'}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:mt-1 flex-wrap">
            {data.file_spd && (st?.status === 'ditandatangani' || st?.status === 'selesai') && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-sky-200 text-sky-600 text-sm font-semibold hover:bg-sky-50 transition-all disabled:opacity-50"
              >
                <FiDownload className="text-base" />
                {downloading ? 'Mengunduh...' : 'Download'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nomor SPD Card */}
          <div id="spd-nomor" className="glass-card rounded-3xl p-6 border border-bubblegum-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                <FiHash className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Nomor SPD</h3>
              {isDraft && !editingNomor && (
                <button
                  onClick={() => setEditingNomor(true)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-candy-600 bg-candy-50 hover:bg-candy-100 border border-candy-200 transition-colors"
                >
                  <FiEdit3 className="text-xs" /> Edit
                </button>
              )}
            </div>
            {editingNomor ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={nomorSpd}
                  onChange={(e) => setNomorSpd(e.target.value)}
                  placeholder="Masukkan nomor SPD..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-bubblegum-200 bg-white/80 text-bubblegum-800 text-sm font-medium placeholder:text-bubblegum-300 focus:outline-none focus:ring-2 focus:ring-grape-300 focus:border-grape-400 transition-all"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNomor}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-grape-500 to-bubblegum-500 text-white text-sm font-semibold shadow-lg shadow-grape-300/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <FiSave className="text-base" />
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => { setEditingNomor(false); setNomorSpd(data.nomor_spd || ''); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-bubblegum-200 text-bubblegum-500 text-sm font-semibold hover:bg-bubblegum-50 transition-all"
                  >
                    <FiX className="text-base" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-bubblegum-50/50 border border-bubblegum-100">
                {data.nomor_spd ? (
                  <p className="text-lg font-bold text-bubblegum-800">{data.nomor_spd}</p>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <FiClipboard className="text-base" />
                    <p className="text-sm font-medium italic">Belum ada nomor SPD — klik Edit untuk mengisi</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tingkat Biaya Card */}
          <div id="spd-tingkat" className="glass-card rounded-3xl p-6 border border-bubblegum-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                <FiTruck className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Tingkat Biaya Perjalanan Dinas</h3>
              {isDraft && !editingTingkat && (
                <button
                  onClick={() => { setTingkatBiaya(data.tingkat_biaya || ''); setEditingTingkat(true); }}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-candy-600 bg-candy-50 hover:bg-candy-100 border border-candy-200 transition-colors"
                >
                  <FiEdit3 className="text-xs" /> Edit
                </button>
              )}
            </div>
            {editingTingkat ? (
              <div className="space-y-3">
                <select
                  value={tingkatBiaya}
                  onChange={(e) => setTingkatBiaya(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-bubblegum-200 bg-white/80 text-bubblegum-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-grape-300 focus:border-grape-400 transition-all"
                >
                  <option value="">— Pilih Tingkat Biaya —</option>
                  {tingkatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveTingkat}
                    disabled={savingTingkat}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-grape-500 to-bubblegum-500 text-white text-sm font-semibold shadow-lg shadow-grape-300/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <FiSave className="text-base" />
                    {savingTingkat ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => { setEditingTingkat(false); setTingkatBiaya(data.tingkat_biaya || ''); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-bubblegum-200 text-bubblegum-500 text-sm font-semibold hover:bg-bubblegum-50 transition-all"
                  >
                    <FiX className="text-base" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-bubblegum-50/50 border border-bubblegum-100">
                {data.tingkat_biaya ? (
                  <p className="text-base font-bold text-bubblegum-800">{data.tingkat_biaya_label}</p>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <FiClipboard className="text-base" />
                    <p className="text-sm font-medium italic">Belum ada tingkat biaya — klik Edit untuk mengisi</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pegawai Info */}
          {pegawai && (
            <div id="spd-pegawai" className="glass-card rounded-3xl p-6 border border-bubblegum-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-500 to-candy-500 text-white flex items-center justify-center shadow-md">
                  <FiUser className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Pegawai</h3>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-bubblegum-50/50 border border-bubblegum-100">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-grape-400 to-bubblegum-500 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                  {pegawai.nama_lengkap?.charAt(0) || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-bubblegum-800 truncate">{pegawai.nama_lengkap}</p>
                  <p className="text-xs text-bubblegum-500 mt-0.5">
                    NIP: {pegawai.nip}
                    {pegawai.jabatan && <> &bull; {pegawai.jabatan}</>}
                  </p>
                  {(pegawai.pangkat || pegawai.golongan) && (
                    <p className="text-xs text-bubblegum-400 mt-0.5">
                      {[pegawai.pangkat, pegawai.golongan].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pengikut (Keluarga) Section */}
          <div id="spd-pengikut" className="glass-card rounded-3xl p-6 border border-bubblegum-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-500 to-grape-500 text-white flex items-center justify-center shadow-md">
                <FiUsers className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">
                Pengikut
              </h3>
              {data.pengikut && data.pengikut.length > 0 && !editingPengikut && (
                <span className="px-2 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-600 text-xs font-bold">
                  {data.pengikut.length}
                </span>
              )}
              {isDraft && !editingPengikut && (
                <button
                  onClick={startEditPengikut}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-candy-600 bg-candy-50 hover:bg-candy-100 border border-candy-200 transition-colors"
                >
                  <FiEdit3 className="text-xs" /> {data.pengikut && data.pengikut.length > 0 ? 'Edit' : 'Tambah'}
                </button>
              )}
            </div>

            {editingPengikut ? (
              <div className="space-y-3">
                <p className="text-xs text-bubblegum-400">Keluarga pegawai yang mengikuti perjalanan dinas.</p>
                {pengikutList.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border-2 border-bubblegum-100 bg-bubblegum-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-bubblegum-500">Pengikut {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePengikut(idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Hapus pengikut"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-bubblegum-600 mb-1">Nama *</label>
                        <input
                          type="text"
                          value={p.nama}
                          onChange={(e) => updatePengikut(idx, 'nama', e.target.value)}
                          placeholder="Nama lengkap..."
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-bubblegum-600 mb-1">Tanggal Lahir</label>
                        <input
                          type="date"
                          value={p.tanggal_lahir}
                          onChange={(e) => updatePengikut(idx, 'tanggal_lahir', e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-bubblegum-600 mb-1">Keterangan</label>
                        <input
                          type="text"
                          value={p.keterangan}
                          onChange={(e) => updatePengikut(idx, 'keterangan', e.target.value)}
                          placeholder="Hubungan, dll..."
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPengikut}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-bubblegum-200 text-bubblegum-400 text-sm font-semibold hover:border-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-50/50 transition-all"
                >
                  <FiPlus className="text-base" /> Tambah Pengikut
                </button>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSavePengikut}
                    disabled={savingPengikut}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-grape-500 to-bubblegum-500 text-white text-sm font-semibold shadow-lg shadow-grape-300/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <FiSave className="text-base" />
                    {savingPengikut ? 'Menyimpan...' : 'Simpan Pengikut'}
                  </button>
                  <button
                    onClick={() => setEditingPengikut(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-bubblegum-200 text-bubblegum-500 text-sm font-semibold hover:bg-bubblegum-50 transition-all"
                  >
                    <FiX className="text-base" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <>
                {data.pengikut && data.pengikut.length > 0 ? (
                  <div className="space-y-2">
                    {data.pengikut.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-bubblegum-50/50 border border-bubblegum-100">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-400 to-grape-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-bubblegum-800">{p.nama}</p>
                          <p className="text-xs text-bubblegum-500 mt-0.5">
                            {p.tanggal_lahir && <>Lahir: {new Date(p.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</>}
                            {p.tanggal_lahir && p.keterangan && <> &bull; </>}
                            {p.keterangan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-bubblegum-300 text-center py-4">Belum ada pengikut</p>
                )}
              </>
            )}
          </div>

          {/* Laporan Perjalanan Dinas */}
          {data.laporan_perjalanan_dinas && (
            <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint-400 to-grape-500 text-white flex items-center justify-center shadow-md">
                  <FiClipboard className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Laporan Perjalanan</h3>
              </div>
              <div className="rich-text-content text-sm text-bubblegum-800 bg-bubblegum-50/50 rounded-2xl p-4 border border-bubblegum-100" dangerouslySetInnerHTML={{ __html: data.laporan_perjalanan_dinas.laporan }} />
            </div>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-500 to-grape-500 text-white flex items-center justify-center shadow-md">
                <FiCheck className="text-sm" />
              </span>
              <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-bubblegum-50/50 border border-bubblegum-100">
                <span className={`w-3 h-3 rounded-full ${status.dot}`} />
                <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
              </div>
              {data.file_spd && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-mint-50 border border-mint-200">
                  <FiFileText className="text-mint-500 text-sm" />
                  <span className="text-xs font-medium text-mint-700">Dokumen tersedia</span>
                </div>
              )}
            </div>
          </div>

          {/* Surat Tugas Info */}
          {st && (
            <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-400 to-grape-500 text-white flex items-center justify-center shadow-md">
                  <FiBriefcase className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Surat Tugas</h3>
              </div>
              <div className="space-y-3">
                <InfoRow label="Nomor ST" value={st.nomor_surat || 'Belum ada nomor'} />
                {st.klasifikasi && (
                  <InfoRow label="Klasifikasi" value={`${st.klasifikasi.kode} — ${st.klasifikasi.klasifikasi}`} />
                )}
                <InfoRow label="Instansi" value={st.instance?.name || '-'} />
                <div className="pt-2">
                  <Link
                    href={`/dashboard/surat-tugas/${st.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-grape-50 text-grape-600 text-sm font-semibold hover:bg-grape-100 transition-colors border border-grape-200"
                  >
                    <FiExternalLink className="text-sm" /> Lihat Surat Tugas
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Perjalanan Info */}
          {st && (
            <div id="spd-perjalanan" className="glass-card rounded-3xl p-5 border border-bubblegum-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-candy-500 text-white flex items-center justify-center shadow-md">
                  <FiMapPin className="text-sm" />
                </span>
                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Perjalanan</h3>
              </div>
              <div className="space-y-3">
                <InfoRow label="Tujuan" value={[st.lokasi_tujuan, st.tujuan_kecamatan_nama, st.tujuan_kabupaten_nama, st.tujuan_provinsi_nama].filter(Boolean).join(', ') || '-'} />
                <InfoRow label="Berangkat" value={formatDate(st.tanggal_berangkat)} />
                <InfoRow label="Lama" value={st.lama_perjalanan ? `${st.lama_perjalanan} hari` : '-'} />
                <InfoRow label="Kembali" value={formatDate(st.tanggal_kembali)} />
                <InfoRow label="Alat Angkut" value={st.alat_angkut || '-'} />
                <InfoRow label="Biaya" value={formatCurrency(st.biaya)} />
                {st.sub_kegiatan_kode && (
                  <InfoRow label="Sub Kegiatan" value={`${st.sub_kegiatan_kode} — ${st.sub_kegiatan_nama || ''}`} />
                )}
                {st.kode_rekening && (
                  <InfoRow label="Kode Rekening" value={`${st.kode_rekening} — ${st.uraian_rekening || ''}`} />
                )}
                {data.signed_at && (
                  <InfoRow label="Tgl Ditandatangani" value={formatDate(data.signed_at)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-bubblegum-50 pb-2.5 last:border-0 last:pb-0">
      <p className="text-[10px] text-bubblegum-400 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-sm text-bubblegum-800 font-medium mt-0.5">{value}</p>
    </div>
  );
}
