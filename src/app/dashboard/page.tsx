'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FiFileText, FiCheckCircle, FiClock, FiSend, FiPlus,
  FiMapPin, FiUsers, FiBarChart2, FiDollarSign,
  FiNavigation, FiCalendar, FiActivity, FiPieChart,
  FiTrendingUp, FiXCircle, FiEdit3
} from 'react-icons/fi';
import api from '@/lib/api';
import Link from 'next/link';
import type { DashboardData, ActiveTripItem } from '@/lib/types';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function currentMonthName(): string {
  return MONTHS_ID[new Date().getMonth()];
}

// ─── Skeleton Loaders ───────────────────────────────
function SkeletonCard() {
  return <div className="glass-card rounded-3xl p-5 animate-pulse"><div className="h-12 w-12 rounded-2xl bg-bubblegum-200 mb-3" /><div className="h-8 w-20 rounded bg-bubblegum-100 mb-1" /><div className="h-4 w-32 rounded bg-bubblegum-100" /></div>;
}

function SkeletonChart() {
  return <div className="glass-card rounded-3xl p-6 animate-pulse"><div className="h-5 w-48 rounded bg-bubblegum-100 mb-4" /><div className="h-64 rounded-2xl bg-bubblegum-50" /></div>;
}

// ─── Custom Tooltip ─────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-bubblegum-100 p-3 text-sm">
      <p className="font-semibold text-bubblegum-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard', { params: { year } });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const s = data?.summary;
  const bulanIni = currentMonthName();

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2025; y--) yearOptions.push(y);

  // ─── Derived narrative helpers ─────────────────
  const totalST = s?.tahun_ini.total_st ?? 0;
  const totalSPD = s?.tahun_ini.total_spd ?? 0;
  const signed = s?.tahun_ini.ditandatangani ?? 0;
  const waiting = s?.tahun_ini.dikirim ?? 0;
  const draft = s?.tahun_ini.draft ?? 0;
  const rejected = s?.tahun_ini.ditolak ?? 0;
  const done = s?.tahun_ini.selesai ?? 0;
  const spdActive = s?.spd_aktif ?? 0;

  // Surat selesai sudah pasti ditandatangani, jadi hitung keduanya
  const totalSigned = signed + done;

  const stBulanIni = s?.bulan_ini.total_st ?? 0;
  const spdBulanIni = s?.bulan_ini.total_spd ?? 0;
  const draftBulan = s?.bulan_ini.draft ?? 0;
  const waitBulan = s?.bulan_ini.dikirim ?? 0;
  const signedBulan = s?.bulan_ini.ditandatangani ?? 0;
  const rejectedBulan = s?.bulan_ini.ditolak ?? 0;
  const doneBulan = s?.bulan_ini.selesai ?? 0;
  const totalSignedBulan = signedBulan + doneBulan;

  const completionRate = totalST > 0 ? Math.round((done / totalST) * 100) : 0;
  const signRate = totalST > 0 ? Math.round((totalSigned / totalST) * 100) : 0;

  // ─── Dashboard Onboarding Tour Steps ───────────
  const dashboardTourSteps = useMemo<TourStep[]>(() => [
    {
      targetSelector: '#dashboard-header',
      title: 'Selamat Datang di Dashboard',
      description: 'Ini adalah halaman utama Dashboard e-SPD. Di sini Anda bisa melihat ringkasan seluruh aktivitas surat tugas dan perjalanan dinas. Gunakan filter tahun di kanan atas untuk melihat data tahun sebelumnya.',
      position: 'bottom',
    },
    {
      targetSelector: '#dashboard-highlight-cards',
      title: 'Kartu Ringkasan',
      description: 'Empat kartu ini menampilkan jumlah Surat Tugas diterbitkan, SPD diterbitkan, surat yang telah ditandatangani, dan surat yang menunggu tanda tangan pimpinan.',
      position: 'bottom',
    },
    {
      targetSelector: '#dashboard-status-flow',
      title: 'Alur Status Surat Tugas',
      description: 'Lihat setiap tahapan Surat Tugas: Draft → Dikirim → Ditandatangani / Ditolak → Selesai. Bagian ini membantu Anda memantau progress setiap surat.',
      position: 'top',
    },
    {
      targetSelector: '#dashboard-spd-summary',
      title: 'Ringkasan Perjalanan Dinas',
      description: 'Informasi tentang SPD yang diterbitkan bulan ini, perjalanan dinas yang sedang berlangsung, dan jumlah Surat Tugas bulan ini.',
      position: 'top',
    },
    {
      targetSelector: '#dashboard-monthly',
      title: 'Aktivitas Bulan Ini',
      description: 'Rekap lengkap aktivitas bulan berjalan: jumlah surat, status draft, menunggu TTD, ditandatangani, dan yang ditolak. Pantau produktivitas tim Anda.',
      position: 'top',
    },
    {
      targetSelector: '#dashboard-quick-actions',
      title: 'Aksi Cepat',
      description: 'Pintasan ke halaman yang paling sering digunakan: Buat Surat Tugas baru, lihat SPD Anda, Verifikasi surat masuk, atau lihat Riwayat Surat.',
      position: 'top',
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Dashboard Onboarding Tour */}
      <OnboardingTour steps={dashboardTourSteps} storageKey="onboarding_dashboard" />

      {/* ═══════════════════════════════════════════════
          Header + Year Filter
          ═══════════════════════════════════════════════ */}
      <div id="dashboard-header" className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bubblegum-800">Dashboard e-SPD</h1>
          <p className="text-bubblegum-500 mt-1">
            Selamat Datang, {user?.name}
            {user?.jabatan && <span> — {user.jabatan}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-bubblegum-600 font-medium">Tahun:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-bubblegum-200 bg-white px-3 py-2 text-sm text-bubblegum-800 focus:border-bubblegum-500 focus:ring-1 focus:ring-bubblegum-500 outline-none"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          Narrative Summary — Ikhtisar Tahun
          ═══════════════════════════════════════════════ */}
      {!loading && s && (
        <div className="glass-card rounded-3xl p-6 border-l-4 border-bubblegum-500">
          <h3 className="text-lg font-bold text-bubblegum-800 mb-2 flex items-center gap-2">
            <FiTrendingUp className="text-bubblegum-500" /> Ikhtisar Tahun {year}
          </h3>
          <p className="text-sm text-bubblegum-700 leading-relaxed">
            Sepanjang tahun <strong>{year}</strong>, telah diterbitkan{' '}
            <strong className="text-bubblegum-800">{totalST} Surat Tugas</strong> dan{' '}
            <strong className="text-grape-700">{totalSPD} Surat Perjalanan Dinas (SPD)</strong>.
            {totalSigned > 0 && (
              <> Dari keseluruhan Surat Tugas, <strong className="text-green-700">{totalSigned} surat ({signRate}%)</strong> telah ditandatangani oleh pimpinan.</>
            )}
            {waiting > 0 && (
              <> Saat ini masih terdapat <strong className="text-amber-700">{waiting} surat</strong> yang menunggu tanda tangan pimpinan.</>
            )}
            {draft > 0 && (
              <> Sebanyak <strong className="text-gray-600">{draft} surat</strong> masih berstatus draft dan belum dikirimkan untuk verifikasi.</>
            )}
            {rejected > 0 && (
              <> Terdapat <strong className="text-red-600">{rejected} surat</strong> yang ditolak dan perlu diperbaiki.</>
            )}
            {done > 0 && (
              <> Tingkat penyelesaian surat tugas mencapai <strong className="text-bubblegum-700">{completionRate}%</strong> ({done} dari {totalST} surat selesai).</>
            )}
            {spdActive > 0 && (
              <> Saat ini ada <strong className="text-mint-700">{spdActive} perjalanan dinas</strong> yang sedang berjalan (aktif).</>
            )}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Highlight Cards — Surat Tugas & SPD Tahun Ini
          ═══════════════════════════════════════════════ */}
      <div id="dashboard-highlight-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : ([
            {
              title: 'Surat Tugas Diterbitkan',
              subtitle: `Sepanjang tahun ${year}`,
              value: totalST,
              icon: FiFileText,
              color: 'from-bubblegum-400 to-bubblegum-600',
              shadow: 'shadow-bubblegum-300/40',
            },
            {
              title: 'SPD Diterbitkan',
              subtitle: 'Mengikuti ST yang sudah ditandatangani',
              value: totalSPD,
              icon: FiNavigation,
              color: 'from-grape-400 to-grape-600',
              shadow: 'shadow-grape-300/40',
            },
            {
              title: 'Ditandatangani Pimpinan',
              subtitle: `${signRate}% dari total Surat Tugas`,
              value: totalSigned,
              icon: FiCheckCircle,
              color: 'from-mint-400 to-mint-500',
              shadow: 'shadow-mint-300/40',
            },
            {
              title: 'Menunggu Tanda Tangan',
              subtitle: 'ST sudah dikirim, belum ditandatangani',
              value: waiting,
              icon: FiClock,
              color: 'from-candy-400 to-candy-600',
              shadow: 'shadow-candy-300/40',
            },
          ]).map((card, i) => (
            <div key={i} className={`glass-card rounded-3xl p-5 hover:scale-[1.03] transition-all duration-300 ${card.shadow}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${card.color} flex items-center justify-center shadow-lg ${card.shadow}`}>
                  <card.icon className="text-white text-xl" />
                </div>
              </div>
              <p className="text-3xl font-bold text-bubblegum-800">{card.value}</p>
              <p className="text-sm font-medium text-bubblegum-700 mt-1">{card.title}</p>
              <p className="text-[11px] text-bubblegum-400 mt-0.5 leading-tight">{card.subtitle}</p>
            </div>
          ))}
      </div>

      {/* ═══════════════════════════════════════════════
          Alur Status Surat Tugas — Tahun Ini
          ═══════════════════════════════════════════════ */}
      {!loading && s && (
        <div id="dashboard-status-flow" className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-bubblegum-700 mb-2">Alur Status Surat Tugas — Tahun {year}</h3>
          <p className="text-xs text-bubblegum-400 mb-4">
            Setiap Surat Tugas melewati beberapa tahap: <em>Draft</em> (dibuat tapi belum dikirim) &rarr;{' '}
            <em>Dikirim</em> (menunggu tanda tangan pimpinan) &rarr;{' '}
            <em>Ditandatangani / Ditolak</em> &rarr;{' '}
            <em>Selesai</em> (SPD telah diterbitkan dan perjalanan dinas diselesaikan).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Draft (Belum Dikirim)', value: draft, icon: FiEdit3, cls: 'text-gray-600 bg-gray-50 border-gray-200', desc: 'Surat masih disimpan oleh pembuat' },
              { label: 'Menunggu Tanda Tangan', value: waiting, icon: FiClock, cls: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Sudah dikirim ke pimpinan' },
              { label: 'Ditandatangani', value: signed, icon: FiCheckCircle, cls: 'text-green-600 bg-green-50 border-green-200', desc: 'Telah disetujui pimpinan' },
              { label: 'Ditolak', value: rejected, icon: FiXCircle, cls: 'text-red-600 bg-red-50 border-red-200', desc: 'Perlu diperbaiki & dikirim ulang' },
              { label: 'Selesai', value: done, icon: FiCheckCircle, cls: 'text-bubblegum-600 bg-bubblegum-50 border-bubblegum-200', desc: 'Perjalanan dinas tuntas' },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl border p-4 text-center ${item.cls}`}>
                <item.icon className="mx-auto text-xl mb-1.5" />
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-semibold mt-1">{item.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Perjalanan Dinas Summary
          ═══════════════════════════════════════════════ */}
      <div id="dashboard-spd-summary" className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
          <FiNavigation /> Ringkasan Perjalanan Dinas (SPD)
        </h3>
        <p className="text-xs text-bubblegum-400 mb-4">
          SPD diterbitkan setelah Surat Tugas ditandatangani oleh pimpinan. Data di bawah menunjukkan volume perjalanan dinas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : ([
              { title: 'SPD Bulan Ini', subtitle: `Diterbitkan di bulan ${bulanIni}`, value: spdBulanIni, icon: FiCalendar, color: 'from-bubblegum-400 to-bubblegum-600', shadow: 'shadow-bubblegum-300/40', comingSoon: false },
              { title: 'Perjalanan Dinas Aktif', subtitle: 'Sedang dalam perjalanan (belum kembali)', value: spdActive, icon: FiActivity, color: 'from-mint-400 to-mint-500', shadow: 'shadow-mint-300/40', comingSoon: false },
              { title: 'ST Bulan Ini', subtitle: `Surat Tugas dibuat di ${bulanIni}`, value: stBulanIni, icon: FiFileText, color: 'from-grape-400 to-grape-600', shadow: 'shadow-grape-300/40', comingSoon: false },
              { title: 'Total Anggaran', subtitle: 'Fitur dalam pengembangan', value: null, icon: FiDollarSign, color: 'from-candy-400 to-candy-600', shadow: 'shadow-candy-300/40', comingSoon: true },
              { title: 'Realisasi Anggaran', subtitle: 'Fitur dalam pengembangan', value: null, icon: FiPieChart, color: 'from-grape-500 to-bubblegum-500', shadow: 'shadow-grape-300/40', comingSoon: true },
            ]).map((card, i) => (
              <div key={i} className={`relative glass-card rounded-2xl p-5 hover:scale-[1.03] transition-all duration-300 ${card.shadow} ${card.comingSoon ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${card.color} flex items-center justify-center shadow-lg ${card.shadow}`}>
                    <card.icon className="text-white text-lg" />
                  </div>
                  {card.comingSoon && (
                    <span className="px-2 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-500 text-[10px] font-bold uppercase tracking-wider">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-bubblegum-800">{card.comingSoon ? '—' : (card.value ?? 0)}</p>
                <p className="text-xs font-medium text-bubblegum-700 mt-1">{card.title}</p>
                <p className="text-[10px] text-bubblegum-400 mt-0.5 leading-tight">{card.subtitle}</p>
              </div>
            ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          Perjalanan Dinas Aktif — Daftar
          ═══════════════════════════════════════════════ */}
      {!loading && data?.active_trips && data.active_trips.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
            <FiActivity className="text-mint-500" /> Perjalanan Dinas Sedang Berlangsung
          </h3>
          <p className="text-xs text-bubblegum-400 mb-4">
            Daftar Surat Tugas yang sudah ditandatangani dan sedang dalam perjalanan dinas (tanggal berangkat s.d. tanggal kembali mencakup hari ini).
          </p>
          <div className="space-y-3">
            {data.active_trips.map((trip: ActiveTripItem) => {
              const daysLeft = trip.tanggal_kembali
                ? Math.max(0, Math.ceil((new Date(trip.tanggal_kembali).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <Link
                  key={trip.id}
                  href={`/dashboard/surat-tugas/${trip.id}`}
                  className="block rounded-2xl border border-mint-200 bg-mint-50/40 p-4 hover:border-mint-400 hover:shadow-lg hover:shadow-mint-100/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-linear-to-br from-mint-400 to-mint-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <FiNavigation />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-bubblegum-800 group-hover:text-mint-700 transition-colors">
                          {trip.nomor_surat || 'Belum bernomor'}
                        </h4>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                          Sedang Berlangsung
                        </span>
                        {daysLeft !== null && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {daysLeft === 0 ? 'Kembali hari ini' : `${daysLeft} hari lagi`}
                          </span>
                        )}
                      </div>
                      {trip.untuk && (
                        <p className="text-sm text-bubblegum-500 mt-1 line-clamp-1" dangerouslySetInnerHTML={{ __html: trip.untuk }} />
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-bubblegum-400 flex-wrap">
                        {trip.tujuan_kabupaten_nama && (
                          <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {trip.tujuan_kabupaten_nama}</span>
                        )}
                        {trip.tanggal_berangkat && (
                          <span className="flex items-center gap-1">
                            <FiCalendar className="text-[10px]" />
                            {new Date(trip.tanggal_berangkat).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            {trip.tanggal_kembali ? ` — ${new Date(trip.tanggal_kembali).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                          </span>
                        )}
                        {trip.instance && (
                          <span className="flex items-center gap-1"><FiUsers className="text-[10px]" /> {trip.instance.alias || trip.instance.name}</span>
                        )}
                      </div>
                      {trip.pegawai && trip.pegawai.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {trip.pegawai.slice(0, 3).map((p) => (
                            <span key={p.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white border border-bubblegum-100 text-bubblegum-600">
                              {p.nama_lengkap}
                            </span>
                          ))}
                          {trip.pegawai.length > 3 && (
                            <span className="text-[10px] text-bubblegum-400">+{trip.pegawai.length - 3} lainnya</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          SPD Berdasarkan Jenis Perjalanan Dinas
          ═══════════════════════════════════════════════ */}
      {!loading && data?.chart_jenis_perjalanan && data.chart_jenis_perjalanan.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
            <FiMapPin /> Data SPD Berdasarkan Jenis Perjalanan Dinas — Tahun {year}
          </h3>
          <p className="text-xs text-bubblegum-400 mb-4">
            Perbandingan jumlah Surat Tugas dan SPD berdasarkan jenis perjalanan dinas: PD Biasa (Luar Kabupaten) dan PD Dalam Kota.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.chart_jenis_perjalanan.map((item, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${i === 0 ? 'border-bubblegum-200 bg-bubblegum-50/50' : 'border-grape-200 bg-grape-50/50'}`}>
                <p className={`text-sm font-bold ${i === 0 ? 'text-bubblegum-700' : 'text-grape-700'}`}>{item.jenis}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-bold text-bubblegum-800">{item.total_st}</p>
                    <p className="text-[11px] text-bubblegum-500 font-medium">Surat Tugas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-grape-700">{item.total_spd}</p>
                    <p className="text-[11px] text-grape-500 font-medium">SPD</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Ringkasan Bulan Ini (dengan narasi)
          ═══════════════════════════════════════════════ */}
      <div id="dashboard-monthly" className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
          <FiCalendar /> Aktivitas Bulan {bulanIni} {year}
        </h3>
        <p className="text-xs text-bubblegum-400 mb-4">
          Rekap aktivitas surat tugas selama bulan {bulanIni}. Data ini membantu memantau produktivitas dan surat yang perlu ditindaklanjuti.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-bubblegum-50 p-4"><div className="h-6 w-10 bg-bubblegum-200 rounded mb-1" /><div className="h-3 w-20 bg-bubblegum-100 rounded" /></div>
            ))
            : ([
              { label: 'ST Dibuat', value: stBulanIni, desc: 'Surat Tugas baru dibuat' },
              { label: 'SPD Diterbitkan', value: spdBulanIni, desc: 'SPD diterbitkan bulan ini' },
              { label: 'Masih Draft', value: draftBulan, desc: 'ST belum dikirim ke pimpinan' },
              { label: 'Menunggu TTD', value: waitBulan, desc: 'ST sudah dikirim, belum ditandatangani' },
              { label: 'Ditandatangani', value: totalSignedBulan, desc: 'ST disetujui pimpinan (termasuk selesai)' },
              { label: 'Ditolak', value: rejectedBulan, desc: 'ST ditolak, perlu revisi' },
            ]).map((c, i) => (
              <div key={i} className="rounded-2xl bg-bubblegum-gradient-soft border border-bubblegum-100 p-4 text-center">
                <p className="text-2xl font-bold text-bubblegum-800">{c.value ?? 0}</p>
                <p className="text-xs font-medium text-bubblegum-600 mt-1">{c.label}</p>
                <p className="text-[10px] text-bubblegum-400 mt-0.5 leading-tight">{c.desc}</p>
              </div>
            ))}
        </div>

        {/* Narrative for month */}
        {!loading && s && (
          <div className="mt-4 p-3 rounded-xl bg-bubblegum-50/70 border border-bubblegum-100 text-xs text-bubblegum-600 leading-relaxed">
            <strong>Catatan:</strong>{' '}
            {stBulanIni === 0 && spdBulanIni === 0 ? (
              <>Belum ada aktivitas surat tugas maupun perjalanan dinas di bulan {bulanIni}.</>
            ) : (
              <>
                Di bulan {bulanIni}, telah dibuat <strong>{stBulanIni} Surat Tugas</strong> dan diterbitkan <strong>{spdBulanIni} SPD</strong>.
                {draftBulan > 0 && <> Masih ada <strong>{draftBulan} surat draft</strong> yang belum dikirimkan — segera kirim agar bisa diproses pimpinan.</>}
                {waitBulan > 0 && <> Terdapat <strong>{waitBulan} surat</strong> yang sedang menunggu tanda tangan pimpinan.</>}
                {rejectedBulan > 0 && <> Perhatian: <strong>{rejectedBulan} surat ditolak</strong> — segera perbaiki dan kirim ulang.</>}
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          Kategori Surat Chart
          ═══════════════════════════════════════════════ */}
      {loading ? <SkeletonChart /> : (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
            <FiPieChart /> Distribusi Surat Tugas Berdasarkan Kategori — Tahun {year}
          </h3>
          <p className="text-xs text-bubblegum-400 mb-4">
            Menunjukkan kategori kegiatan mana yang paling banyak menghasilkan Surat Tugas. Berguna untuk menganalisis pola kegiatan dan kebutuhan anggaran.
          </p>
          {data?.chart_kategori && data.chart_kategori.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.chart_kategori} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="nama" type="category" width={200} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total Surat Tugas" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* List View */}
              <div className="space-y-3">
                {data.chart_kategori.map((k, i) => {
                  const maxTotal = data.chart_kategori[0].total || 1;
                  return (
                    <div key={k.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-bubblegum-400 w-5 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-bubblegum-700 font-medium truncate max-w-[70%]">{k.nama}</span>
                          <span className="text-xs font-semibold text-grape-600">{k.total} surat</span>
                        </div>
                        <div className="h-2 bg-grape-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-grape-400 to-bubblegum-500 rounded-full transition-all duration-500"
                            style={{ width: `${(k.total / maxTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState text="Belum ada data kategori surat — mulai buat Surat Tugas dengan memilih kategori" />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Perangkat Daerah Chart
          ═══════════════════════════════════════════════ */}
      {loading ? <SkeletonChart /> : (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
            <FiUsers /> Surat Tugas per Perangkat Daerah (Top 10)
          </h3>
          <p className="text-xs text-bubblegum-400 mb-4">
            Menampilkan 10 OPD yang paling banyak menerbitkan Surat Tugas di tahun {year}.
          </p>
          {data?.chart_perangkat_daerah && data.chart_perangkat_daerah.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.chart_perangkat_daerah} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="nama" type="category" width={180} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Surat Tugas" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Belum ada data perangkat daerah" />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Top Tables Row
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pegawai */}
        {loading ? <SkeletonChart /> : (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
              <FiUsers /> Pegawai Paling Sering Ditugaskan
            </h3>
            <p className="text-xs text-bubblegum-400 mb-4">
              Daftar pegawai yang paling banyak tercantum dalam Surat Tugas selama tahun {year}. Berguna untuk memastikan distribusi penugasan merata.
            </p>
            {data?.top_pegawai && data.top_pegawai.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-bubblegum-500 border-b border-bubblegum-100">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Nama Pegawai</th>
                      <th className="pb-2 pr-3">Jabatan</th>
                      <th className="pb-2 text-right">Jumlah Tugas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_pegawai.map((p, i) => (
                      <tr key={p.nip} className="border-b border-bubblegum-50 hover:bg-bubblegum-50/50">
                        <td className="py-2 pr-3 text-bubblegum-400 font-mono">{i + 1}</td>
                        <td className="py-2 pr-3">
                          <p className="font-medium text-bubblegum-800">{p.nama_lengkap}</p>
                          <p className="text-xs text-bubblegum-400">{p.nip}</p>
                        </td>
                        <td className="py-2 pr-3 text-bubblegum-600 text-xs">{p.jabatan || '-'}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-700 text-xs font-semibold">
                            {p.total_tugas} penugasan
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="Belum ada data penugasan pegawai" />
            )}
          </div>
        )}

        {/* Top Provinsi & Kabupaten Tujuan */}
        {loading ? <SkeletonChart /> : (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
              <FiMapPin /> Tujuan Perjalanan Dinas Terpopuler
            </h3>
            <p className="text-xs text-bubblegum-400 mb-4">
              Provinsi, kabupaten/kota, dan kecamatan yang paling sering menjadi tujuan perjalanan dinas.
              <span className="italic"> (Kab. Ogan Ilir tidak ditampilkan karena termasuk dalam kota)</span>
            </p>
            <div className="space-y-4">
              {/* Provinsi */}
              <div>
                <h4 className="text-sm font-semibold text-bubblegum-600 mb-2">Top 5 Provinsi Tujuan</h4>
                {data?.top_provinsi && data.top_provinsi.length > 0 ? (
                  <div className="space-y-2">
                    {data.top_provinsi.slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-bubblegum-700">{p.tujuan_provinsi_nama}</span>
                        <ProgressBadge value={p.total} max={data.top_provinsi[0].total} color="bubblegum" label="perjalanan" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-bubblegum-400">Belum ada data tujuan provinsi</p>
                )}
              </div>
              <hr className="border-bubblegum-100" />
              {/* Kabupaten */}
              <div>
                <h4 className="text-sm font-semibold text-bubblegum-600 mb-2">Top 5 Kabupaten/Kota Tujuan</h4>
                {data?.top_kabupaten && data.top_kabupaten.length > 0 ? (
                  <div className="space-y-2">
                    {data.top_kabupaten.slice(0, 5).map((k, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-bubblegum-700">{k.tujuan_kabupaten_nama}</span>
                        <ProgressBadge value={k.total} max={data.top_kabupaten[0].total} color="grape" label="perjalanan" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-bubblegum-400">Belum ada data tujuan kabupaten/kota</p>
                )}
              </div>
              {/* Kecamatan */}
              {data?.top_kecamatan && data.top_kecamatan.length > 0 && (
                <>
                  <hr className="border-bubblegum-100" />
                  <div>
                    <h4 className="text-sm font-semibold text-bubblegum-600 mb-2">Top 5 Kecamatan Tujuan</h4>
                    <div className="space-y-2">
                      {data.top_kecamatan.slice(0, 5).map((kec, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-bubblegum-700">{kec.tujuan_kecamatan_nama}</span>
                          <ProgressBadge value={kec.total} max={data.top_kecamatan[0].total} color="mint" label="perjalanan" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          OPD Charts Row
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPD paling sering Perjalanan Dinas */}
        {loading ? <SkeletonChart /> : (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
              <FiSend /> OPD dengan Perjalanan Dinas Terbanyak
            </h3>
            <p className="text-xs text-bubblegum-400 mb-4">
              OPD yang paling sering menerbitkan SPD. Membantu analisis kebutuhan perjalanan per instansi.
            </p>
            {data?.top_opd_perjalanan && data.top_opd_perjalanan.length > 0 ? (
              <div className="space-y-3">
                {data.top_opd_perjalanan.map((opd, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-bubblegum-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-bubblegum-700 font-medium truncate max-w-[70%]">{opd.nama}</span>
                        <span className="text-xs font-semibold text-bubblegum-600">{opd.total} SPD</span>
                      </div>
                      <div className="h-2 bg-bubblegum-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-bubblegum-400 to-grape-500 rounded-full transition-all duration-500"
                          style={{ width: `${(opd.total / data.top_opd_perjalanan[0].total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Belum ada data perjalanan dinas per OPD" />
            )}
          </div>
        )}

        {/* OPD dengan Biaya Terbesar */}
        {loading ? <SkeletonChart /> : (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-bubblegum-700 mb-2 flex items-center gap-2">
              <FiDollarSign /> OPD dengan Biaya Perjalanan Terbesar
            </h3>
            <p className="text-xs text-bubblegum-400 mb-4">
              Peringkat OPD berdasarkan total biaya perjalanan dinas yang dikeluarkan di tahun {year}.
            </p>
            {data?.top_opd_biaya && data.top_opd_biaya.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-bubblegum-500 border-b border-bubblegum-100">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Nama OPD</th>
                      <th className="pb-2 text-right pr-3">Jumlah SPD</th>
                      <th className="pb-2 text-right">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_opd_biaya.map((opd, i) => (
                      <tr key={i} className="border-b border-bubblegum-50 hover:bg-bubblegum-50/50">
                        <td className="py-2 pr-3 text-bubblegum-400 font-mono">{i + 1}</td>
                        <td className="py-2 pr-3 text-bubblegum-700 font-medium text-xs">{opd.nama}</td>
                        <td className="py-2 pr-3 text-right text-bubblegum-600">{opd.total_spd}</td>
                        <td className="py-2 text-right font-semibold text-bubblegum-800 text-xs">{formatRupiah(opd.total_biaya)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="Belum ada data biaya perjalanan dinas" />
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          Aksi Cepat
          ═══════════════════════════════════════════════ */}
      <div id="dashboard-quick-actions" className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-bubblegum-700 mb-2">Aksi Cepat</h3>
        <p className="text-xs text-bubblegum-400 mb-4">Pintasan ke halaman yang sering digunakan.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/dashboard/surat-tugas/create" className="p-4 rounded-2xl bg-bubblegum-gradient-soft border-2 border-bubblegum-200 hover:border-bubblegum-400 hover:shadow-lg hover:shadow-bubblegum-200/50 transition-all duration-300 text-left group">
            <FiPlus className="text-bubblegum-500 text-xl mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-bubblegum-700">Buat Surat Tugas</p>
            <p className="text-xs text-bubblegum-400 mt-0.5">Buat ST & SPD baru</p>
          </Link>
          <Link href="/dashboard/spd-saya" className="p-4 rounded-2xl bg-bubblegum-gradient-soft border-2 border-grape-200 hover:border-grape-400 hover:shadow-lg hover:shadow-grape-200/50 transition-all duration-300 text-left group">
            <FiSend className="text-grape-500 text-xl mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-grape-700">SPD Saya</p>
            <p className="text-xs text-grape-400 mt-0.5">Lihat perjalanan dinas Anda</p>
          </Link>
          <Link href="/dashboard/surat-tugas" className="p-4 rounded-2xl bg-bubblegum-gradient-soft border-2 border-mint-200 hover:border-mint-400 hover:shadow-lg hover:shadow-mint-200/50 transition-all duration-300 text-left group">
            <FiFileText className="text-mint-500 text-xl mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-bubblegum-700">Riwayat Surat</p>
            <p className="text-xs text-bubblegum-400 mt-0.5">Semua surat tugas & SPD</p>
          </Link>
          <Link href="/dashboard/aktivitas" className="p-4 rounded-2xl bg-bubblegum-gradient-soft border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/50 transition-all duration-300 text-left group">
            <FiActivity className="text-amber-500 text-xl mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-amber-700">Aktivitas</p>
            <p className="text-xs text-amber-400 mt-0.5">Lacak aktivitas surat Anda</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-bubblegum-300">
      <FiBarChart2 className="text-4xl mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function ProgressBadge({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-24 h-2 bg-${color}-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold text-${color}-700 min-w-8 text-right`}>{value}{label ? ` ${label}` : ''}</span>
    </div>
  );
}
