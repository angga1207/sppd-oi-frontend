'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FiCheckCircle, FiXCircle, FiFileText, FiUser, FiCalendar, FiMapPin, FiLoader, FiTruck } from 'react-icons/fi';

interface VerifyData {
    nomor_spd: string;
    nomor_surat_tugas: string;
    status: string;
    tingkat_biaya: string;
    instansi: string;
    penandatangan: string;
    pegawai: { nama: string; nip: string; jabatan: string };
    tujuan: string;
    tanggal_berangkat: string;
    tanggal_kembali: string;
    lama_perjalanan: string;
}

export default function ScanSpdPage() {
    const params = useParams();
    const id = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [message, setMessage] = useState('');
    const [data, setData] = useState<VerifyData | null>(null);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/scan/spd/${id}`, { headers: { Accept: 'application/json' } })
            .then(res => res.json())
            .then(result => {
                setValid(result.valid ?? false);
                setMessage(result.message ?? '');
                setData(result.data ?? null);
            })
            .catch(() => {
                setValid(false);
                setMessage('Gagal memverifikasi dokumen.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const formatDate = (d: string | null | undefined) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    };

    const statusLabel: Record<string, string> = {
        draft: 'Draft',
        dikirim: 'Dikirim',
        ditandatangani: 'Ditandatangani',
        ditolak: 'Ditolak',
        selesai: 'Selesai',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <FiLoader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Memverifikasi dokumen...</p>
                </div>
            </div>
        );
    }

    if (!valid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-red-50 p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                        <FiXCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-red-700 mb-2">Tidak Valid</h1>
                    <p className="text-slate-500">{message || 'Dokumen tidak ditemukan atau tidak valid.'}</p>
                    <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
                        e-SPD Kabupaten Ogan Ilir
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-green-50 p-4 py-8">
            <div className="max-w-lg mx-auto">
                {/* Verified Badge */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100 mb-4">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <FiCheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-green-700 mb-1">Terverifikasi</h1>
                        <p className="text-slate-500 text-sm">{message}</p>
                    </div>

                    {data && (
                        <div className="space-y-4">
                            {/* Document Info */}
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <FiTruck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Surat Perjalanan Dinas</p>
                                        <p className="text-sm font-bold text-slate-800">{data.nomor_spd || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FiFileText className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Nomor Surat Tugas</p>
                                        <p className="text-sm font-semibold text-slate-700">{data.nomor_surat_tugas || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${data.status === 'ditandatangani' || data.status === 'selesai' ? 'bg-green-400' : data.status === 'ditolak' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                    </span>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Status</p>
                                        <p className="text-sm font-semibold text-slate-700">{statusLabel[data.status] || data.status}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pegawai */}
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <FiUser className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Pegawai</p>
                                        <p className="text-sm font-bold text-slate-800">{data.pegawai?.nama || '-'}</p>
                                        <p className="text-xs text-slate-500">NIP: {data.pegawai?.nip || '-'}</p>
                                        <p className="text-xs text-slate-500">{data.pegawai?.jabatan || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FiUser className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Penandatangan</p>
                                        <p className="text-sm font-semibold text-slate-700">{data.penandatangan || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Travel Details */}
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <FiMapPin className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Instansi</p>
                                        <p className="text-sm font-semibold text-slate-700">{data.instansi || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FiMapPin className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tujuan</p>
                                        <p className="text-sm font-semibold text-slate-700">{data.tujuan || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FiCalendar className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Periode</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {formatDate(data.tanggal_berangkat)} — {formatDate(data.tanggal_kembali)}
                                        </p>
                                        <p className="text-xs text-slate-500">{data.lama_perjalanan || '-'} &bull; Tingkat: {data.tingkat_biaya || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                        e-SPD Kabupaten Ogan Ilir &mdash; Verifikasi Surat Perjalanan Dinas
                    </div>
                </div>
            </div>
        </div>
    );
}
