'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    FiUser, FiFileText, FiMapPin, FiCalendar, FiArrowLeft,
    FiExternalLink, FiBriefcase, FiHash, FiAward, FiLoader,
    FiAlertTriangle, FiUsers
} from 'react-icons/fi';
import api from '@/lib/api';
import type { Employee, Instance, SuratTugasStatus } from '@/lib/types';

interface EmployeeDetail extends Employee {
    instance?: Instance;
    email?: string | null;
    no_hp?: string | null;
    kepala_skpd?: string | null;
}

interface STItem {
    id: number;
    nomor_surat: string | null;
    untuk: string | null;
    status: SuratTugasStatus;
    kategori?: { id: number; nama: string } | null;
    instance?: { id: number; name: string; alias: string | null } | null;
    tujuan_kabupaten_nama: string | null;
    lokasi_tujuan: string | null;
    tanggal_berangkat: string | null;
    tanggal_kembali: string | null;
    penandatangan_nama: string | null;
    created_at: string;
}

interface SPDItem {
    id: number;
    nomor_spd: string | null;
    tingkat_biaya: string | null;
    surat_tugas_id: number;
    surat_tugas_pegawai_id: number;
    status: SuratTugasStatus;
    created_at: string;
    surat_tugas?: {
        id: number;
        nomor_surat: string | null;
        untuk: string | null;
        tujuan_kabupaten_nama: string | null;
        lokasi_tujuan: string | null;
        tanggal_berangkat: string | null;
        tanggal_kembali: string | null;
        instance?: { id: number; name: string; alias: string | null } | null;
    } | null;
    surat_tugas_pegawai?: { id: number; nama_lengkap: string; nip: string; jabatan: string | null } | null;
    laporan_perjalanan_dinas?: { id: number; laporan: string } | null;
}

interface Stats {
    total_surat_tugas: number;
    total_spd: number;
    active_trip_count: number;
    surat_tugas_by_status: Record<string, number>;
    spd_by_status: Record<string, number>;
}

interface PegawaiDetailResponse {
    success: boolean;
    message?: string;
    data: {
        employee: EmployeeDetail;
        surat_tugas: STItem[];
        spd: SPDItem[];
        active_trips: STItem[];
        stats: Stats;
    };
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    menunggu: 'bg-amber-50 text-amber-700 border-amber-200',
    dikirim: 'bg-candy-50 text-candy-700 border-candy-200',
    diproses: 'bg-blue-50 text-blue-700 border-blue-200',
    ditandatangani: 'bg-green-50 text-green-700 border-green-200',
    ditolak: 'bg-red-50 text-red-700 border-red-200',
    revisi: 'bg-orange-50 text-orange-700 border-orange-200',
    selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

type Tab = 'surat_tugas' | 'spd';

export default function PegawaiDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<PegawaiDetailResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('surat_tugas');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/pegawai/${id}`);
                if (res.data.success) {
                    setData(res.data.data);
                } else {
                    setError(res.data.message || 'Gagal memuat data.');
                }
            } catch (err: unknown) {
                const axiosErr = err as { response?: { status: number; data?: { message?: string } } };
                if (axiosErr.response?.status === 403) {
                    setError('Anda tidak memiliki akses untuk melihat data pegawai ini.');
                } else if (axiosErr.response?.status === 404) {
                    setError('Data pegawai tidak ditemukan.');
                } else {
                    setError('Gagal memuat data pegawai.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-center py-32">
                    <div className="flex items-center gap-3 text-bubblegum-400">
                        <FiLoader className="animate-spin text-2xl" />
                        <span className="text-lg font-medium">Memuat data pegawai...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-bubblegum-400 hover:text-bubblegum-600 transition-colors mb-6"
                >
                    <FiArrowLeft className="text-xs" /> Kembali
                </button>
                <div className="glass-card rounded-3xl border border-red-200 p-12 text-center">
                    <FiAlertTriangle className="mx-auto text-4xl text-red-300 mb-4" />
                    <p className="text-lg font-semibold text-red-600">{error || 'Terjadi kesalahan'}</p>
                    <p className="text-sm text-bubblegum-300 mt-2">Silakan kembali ke halaman pencarian.</p>
                </div>
            </div>
        );
    }

    const { employee, surat_tugas, spd, active_trips, stats } = data;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-bubblegum-400 hover:text-bubblegum-600 transition-colors mb-6"
            >
                <FiArrowLeft className="text-xs" /> Kembali
            </button>

            {/* Header Card */}
            <div className="glass-card rounded-3xl border border-bubblegum-100 p-6 mb-6">
                <div className="flex items-start gap-5">
                    {/* <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200/50 shrink-0 text-2xl font-bold">
                        {employee.nama_lengkap?.charAt(0)?.toUpperCase() || <FiUser />}
                    </span> */}
                    <img
                        src={employee.foto_pegawai || '/logo-oi.png'}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo-oi.png';
                        }}
                        alt={employee.nama_lengkap}
                        className="w-16 h-16 p-1 rounded-2xl object-cover shadow-lg shadow-blue-200/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-bubblegum-800">{employee.nama_lengkap}</h1>
                        <p className="text-sm text-bubblegum-500 mt-0.5">{employee.jabatan || '-'}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-bubblegum-400 flex-wrap">
                            <span className="flex items-center gap-1"><FiHash className="text-[10px]" /> NIP: {employee.nip}</span>
                            {employee.instance && (
                                <span className="flex items-center gap-1"><FiBriefcase className="text-[10px]" /> {employee.instance.name}</span>
                            )}
                            {employee.pangkat && (
                                <span className="flex items-center gap-1"><FiAward className="text-[10px]" /> {employee.pangkat}{employee.golongan ? ` (${employee.golongan})` : ''}</span>
                            )}
                            {employee.eselon && (
                                <span>Eselon: {employee.eselon}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="glass-card rounded-2xl border border-bubblegum-100 p-4 text-center">
                    <p className="text-2xl font-bold text-bubblegum-700">{stats.total_surat_tugas}</p>
                    <p className="text-xs text-bubblegum-400 mt-1">Surat Tugas</p>
                </div>
                <div className="glass-card rounded-2xl border border-bubblegum-100 p-4 text-center">
                    <p className="text-2xl font-bold text-grape-700">{stats.total_spd}</p>
                    <p className="text-xs text-bubblegum-400 mt-1">SPD</p>
                </div>
                <div className="glass-card rounded-2xl border border-mint-200 bg-mint-50/50 p-4 text-center">
                    <p className="text-2xl font-bold text-mint-700">{stats.active_trip_count || 0}</p>
                    <p className="text-xs text-bubblegum-400 mt-1">Perjalanan Aktif</p>
                </div>
                <div className="glass-card rounded-2xl border border-green-100 p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{(stats.surat_tugas_by_status?.selesai || 0) + (stats.surat_tugas_by_status?.ditandatangani || 0)}</p>
                    <p className="text-xs text-bubblegum-400 mt-1">ST Selesai</p>
                </div>
                <div className="glass-card rounded-2xl border border-green-100 p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{(stats.spd_by_status?.selesai || 0) + (stats.spd_by_status?.ditandatangani || 0)}</p>
                    <p className="text-xs text-bubblegum-400 mt-1">SPD Selesai</p>
                </div>
            </div>

            {/* Active Trips */}
            {active_trips && active_trips.length > 0 && (
                <div className="glass-card rounded-2xl border-2 border-mint-200 bg-mint-50/30 p-5 mb-6">
                    <h3 className="text-sm font-bold text-mint-700 mb-3 flex items-center gap-2">
                        <FiMapPin className="text-mint-500" /> Sedang dalam Perjalanan Dinas ({active_trips.length})
                    </h3>
                    <div className="space-y-2">
                        {active_trips.map((trip: STItem) => {
                            const daysLeft = trip.tanggal_kembali
                                ? Math.max(0, Math.ceil((new Date(trip.tanggal_kembali).getTime() - Date.now()) / 86400000))
                                : null;
                            return (
                                <Link
                                    key={trip.id}
                                    href={`/dashboard/surat-tugas/${trip.id}`}
                                    className="block rounded-xl border border-mint-200 bg-white p-3 hover:border-mint-400 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-linear-to-br from-mint-400 to-mint-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                            <FiFileText className="text-xs" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-bubblegum-800 group-hover:text-mint-700 transition-colors">
                                                    {trip.nomor_surat || 'Belum bernomor'}
                                                </span>
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                                    Aktif
                                                </span>
                                                {daysLeft !== null && (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {daysLeft === 0 ? 'Kembali hari ini' : `${daysLeft} hari lagi`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-bubblegum-400 flex-wrap">
                                                {trip.tujuan_kabupaten_nama && (
                                                    <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {trip.tujuan_kabupaten_nama}</span>
                                                )}
                                                {trip.tanggal_berangkat && (
                                                    <span className="flex items-center gap-1">
                                                        <FiCalendar className="text-[10px]" />
                                                        {formatDate(trip.tanggal_berangkat)}{trip.tanggal_kembali ? ` — ${formatDate(trip.tanggal_kembali)}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <FiExternalLink className="text-bubblegum-200 group-hover:text-mint-400 transition-colors shrink-0" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 p-1 rounded-2xl bg-white/60 border border-bubblegum-100 w-fit">
                <button
                    onClick={() => setActiveTab('surat_tugas')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'surat_tugas'
                        ? 'bg-bubblegum-gradient text-white shadow-md shadow-bubblegum-300/30'
                        : 'text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-50'
                        }`}
                >
                    <FiFileText className="text-xs" />
                    Surat Tugas
                    {stats.total_surat_tugas > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'surat_tugas' ? 'bg-white/20 text-white' : 'bg-bubblegum-100 text-bubblegum-500'}`}>
                            {stats.total_surat_tugas}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('spd')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'spd'
                        ? 'bg-bubblegum-gradient text-white shadow-md shadow-bubblegum-300/30'
                        : 'text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-50'
                        }`}
                >
                    <FiMapPin className="text-xs" />
                    SPD
                    {stats.total_spd > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'spd' ? 'bg-white/20 text-white' : 'bg-bubblegum-100 text-bubblegum-500'}`}>
                            {stats.total_spd}
                        </span>
                    )}
                </button>
            </div>

            {/* Surat Tugas Tab */}
            {activeTab === 'surat_tugas' && (
                <div className="space-y-3">
                    {surat_tugas.length === 0 ? (
                        <div className="glass-card rounded-2xl border border-bubblegum-100 p-12 text-center">
                            <FiFileText className="mx-auto text-3xl text-bubblegum-200 mb-3" />
                            <p className="text-sm text-bubblegum-400">Belum ada surat tugas.</p>
                        </div>
                    ) : (
                        surat_tugas.map(st => (
                            <Link
                                key={st.id}
                                href={`/dashboard/surat-tugas/${st.id}`}
                                className="block glass-card rounded-2xl border border-bubblegum-100 p-5 hover:border-bubblegum-300 hover:shadow-lg hover:shadow-bubblegum-100/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-bubblegum-400 to-bubblegum-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <FiFileText />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-bubblegum-800 group-hover:text-bubblegum-600 transition-colors">
                                                {st.nomor_surat || 'Draft (belum bernomor)'}
                                            </h3>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${STATUS_COLORS[st.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {st.status}
                                            </span>
                                            {st.kategori && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bubblegum-50 text-bubblegum-500 border border-bubblegum-100">
                                                    {st.kategori.nama}
                                                </span>
                                            )}
                                        </div>
                                        {st.untuk && (
                                            <p className="text-sm text-bubblegum-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: st.untuk }} />
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-bubblegum-300 flex-wrap">
                                            {st.tujuan_kabupaten_nama && (
                                                <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {st.tujuan_kabupaten_nama}</span>
                                            )}
                                            {st.tanggal_berangkat && (
                                                <span className="flex items-center gap-1"><FiCalendar className="text-[10px]" /> {formatDate(st.tanggal_berangkat)}{st.tanggal_kembali ? ` — ${formatDate(st.tanggal_kembali)}` : ''}</span>
                                            )}
                                            {st.penandatangan_nama && (
                                                <span><FiUsers className="inline text-[10px] mr-1" />{st.penandatangan_nama}</span>
                                            )}
                                        </div>
                                    </div>
                                    <FiExternalLink className="text-bubblegum-200 group-hover:text-bubblegum-400 transition-colors shrink-0 mt-1" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* SPD Tab */}
            {activeTab === 'spd' && (
                <div className="space-y-3">
                    {spd.length === 0 ? (
                        <div className="glass-card rounded-2xl border border-bubblegum-100 p-12 text-center">
                            <FiMapPin className="mx-auto text-3xl text-bubblegum-200 mb-3" />
                            <p className="text-sm text-bubblegum-400">Belum ada SPD.</p>
                        </div>
                    ) : (
                        spd.map(s => (
                            <Link
                                key={s.id}
                                href={`/dashboard/spd/${s.id}`}
                                className="block glass-card rounded-2xl border border-bubblegum-100 p-5 hover:border-grape-300 hover:shadow-lg hover:shadow-grape-100/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-grape-400 to-grape-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <FiMapPin />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-bubblegum-800 group-hover:text-grape-600 transition-colors">
                                                {s.nomor_spd || 'SPD (belum bernomor)'}
                                            </h3>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {s.status}
                                            </span>
                                            {s.tingkat_biaya && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-grape-50 text-grape-500 border border-grape-100">
                                                    Tingkat {s.tingkat_biaya}
                                                </span>
                                            )}
                                        </div>
                                        {s.surat_tugas?.untuk && (
                                            <p className="text-sm text-bubblegum-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: s.surat_tugas.untuk }} />
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-bubblegum-300 flex-wrap">
                                            {s.surat_tugas?.tujuan_kabupaten_nama && (
                                                <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {s.surat_tugas.tujuan_kabupaten_nama}</span>
                                            )}
                                            {s.surat_tugas?.tanggal_berangkat && (
                                                <span className="flex items-center gap-1"><FiCalendar className="text-[10px]" /> {formatDate(s.surat_tugas.tanggal_berangkat)}{s.surat_tugas?.tanggal_kembali ? ` — ${formatDate(s.surat_tugas.tanggal_kembali)}` : ''}</span>
                                            )}
                                            {s.surat_tugas?.nomor_surat && (
                                                <span className="flex items-center gap-1"><FiFileText className="text-[10px]" /> ST: {s.surat_tugas.nomor_surat}</span>
                                            )}
                                        </div>
                                        {s.laporan_perjalanan_dinas && (
                                            <div className="mt-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">
                                                    Laporan tersedia
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <FiExternalLink className="text-bubblegum-200 group-hover:text-grape-400 transition-colors shrink-0 mt-1" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
