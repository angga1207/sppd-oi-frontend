'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useSuratTugasDetail, statusConfig } from '../SuratTugasDetailContext';
import {
    FiTruck,
    FiUser,
    FiDownload,
    FiExternalLink,
    FiAlertTriangle,
    FiEdit3,
    FiSave,
    FiX,
    FiHash,
    FiCheck,
} from 'react-icons/fi';
import { swalError, swalSuccess, swalWarning } from '@/lib/swal';

export default function SuratTugasSpdPage() {
    const { data, actionLoading, handleDownload, fetchData } = useSuratTugasDetail();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editNomor, setEditNomor] = useState('');
    const [saving, setSaving] = useState(false);

    const spdList = data.surat_perjalanan_dinas || [];
    const isDraft = data.status === 'draft';

    const startEdit = (spdId: number, currentNomor: string | null) => {
        setEditingId(spdId);
        setEditNomor(currentNomor || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditNomor('');
    };

    const handleSaveNomor = async (spdId: number) => {
        if (!editNomor.trim()) {
            swalWarning('Perhatian', 'Nomor SPD tidak boleh kosong.');
            return;
        }
        setSaving(true);
        try {
            const res = await api.put(`/spd/${spdId}`, { nomor_spd: editNomor.trim() });
            if (res.data.success) {
                await fetchData();
                cancelEdit();
                swalSuccess('Tersimpan!', 'Nomor SPD berhasil disimpan.');
            } else {
                swalError('Gagal', res.data.message || 'Gagal menyimpan.');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            swalError('Gagal', error?.response?.data?.message || 'Gagal menyimpan nomor SPD.');
        } finally { setSaving(false); }
    };

    if (!data.has_spd || spdList.length === 0) {
        return (
            <div className="glass-card rounded-3xl p-12 border border-bubblegum-100 text-center">
                <FiTruck className="text-5xl text-bubblegum-200 mx-auto mb-4" />
                <p className="text-base font-semibold text-bubblegum-400">Tidak Ada SPD</p>
                <p className="text-sm text-bubblegum-300 mt-1">
                    Surat tugas ini tidak memiliki Surat Perjalanan Dinas.
                </p>
            </div>
        );
    }

    const filledCount = spdList.filter(s => !!s.nomor_spd).length;
    const totalCount = spdList.length;

    return (
        <div className="space-y-5">
            {/* Summary Card */}
            <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                            <FiTruck className="text-lg" />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-bubblegum-800">Surat Perjalanan Dinas</h2>
                            <p className="text-xs text-bubblegum-400 mt-0.5">
                                {filledCount} dari {totalCount} SPD sudah memiliki nomor
                            </p>
                        </div>
                    </div>
                    {/* Progress indicator */}
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-bubblegum-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${filledCount === totalCount ? 'bg-mint-500' : 'bg-amber-400'}`}
                                style={{ width: `${(filledCount / totalCount) * 100}%` }}
                            />
                        </div>
                        <span className={`text-xs font-bold ${filledCount === totalCount ? 'text-mint-600' : 'text-amber-600'}`}>
                            {filledCount === totalCount ? (
                                <span className="flex items-center gap-1"><FiCheck className="text-xs" /> Lengkap</span>
                            ) : (
                                `${totalCount - filledCount} belum diisi`
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* SPD Cards */}
            <div className="space-y-4">
                {spdList.map((spd, idx) => {
                    const spdStatus = statusConfig[spd.status];
                    const hasNomor = !!spd.nomor_spd;
                    const isEditing = editingId === spd.id;
                    const pegawai = spd.surat_tugas_pegawai;

                    return (
                        <div
                            key={spd.id}
                            className={`glass-card rounded-3xl border-2 overflow-hidden transition-all ${hasNomor ? 'border-bubblegum-100' : 'border-amber-200'
                                }`}
                        >
                            {/* Card Header */}
                            <div className={`px-5 py-3 border-b flex items-center justify-between ${hasNomor ? 'bg-bubblegum-50/50 border-bubblegum-100' : 'bg-amber-50/50 border-amber-200'
                                }`}>
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-grape-400 to-bubblegum-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {idx + 1}
                                    </span>
                                    <span className={`px-3 py-1 rounded-xl text-[11px] font-semibold border ${spdStatus.bg} ${spdStatus.color} ${spdStatus.border}`}>
                                        {spdStatus.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isDraft && !isEditing && (
                                        <button
                                            onClick={() => startEdit(spd.id, spd.nomor_spd)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-candy-600 bg-candy-50 hover:bg-candy-100 border border-candy-200 transition-colors"
                                        >
                                            <FiEdit3 className="text-[10px]" /> Edit Nomor
                                        </button>
                                    )}
                                    <Link
                                        href={`/dashboard/spd/${spd.id}`}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-grape-600 bg-grape-50 hover:bg-grape-100 border border-grape-200 transition-colors"
                                    >
                                        <FiExternalLink className="text-[10px]" /> Detail
                                    </Link>
                                    {spd.file_spd && (
                                        <button
                                            onClick={() => handleDownload('spd', spd.id)}
                                            disabled={!!actionLoading}
                                            className="p-1.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors border border-sky-200 disabled:opacity-50"
                                            title="Download SPD"
                                        >
                                            <FiDownload className="text-sm" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 space-y-4">
                                {/* Nomor SPD */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <FiHash className="text-xs text-bubblegum-400" />
                                        <span className="text-[10px] text-bubblegum-400 uppercase tracking-wide font-semibold">Nomor SPD</span>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editNomor}
                                                onChange={(e) => setEditNomor(e.target.value)}
                                                placeholder="Masukkan nomor SPD..."
                                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-bubblegum-200 bg-white/80 text-bubblegum-800 text-sm font-medium placeholder:text-bubblegum-300 focus:outline-none focus:ring-2 focus:ring-grape-300 focus:border-grape-400 transition-all"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveNomor(spd.id)}
                                            />
                                            <button
                                                onClick={() => handleSaveNomor(spd.id)}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-grape-500 to-bubblegum-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                            >
                                                <FiSave className="text-sm" />
                                                {saving ? '...' : 'Simpan'}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-2.5 rounded-xl bg-white border-2 border-bubblegum-200 text-bubblegum-400 hover:bg-bubblegum-50 transition-all"
                                            >
                                                <FiX className="text-sm" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`px-4 py-2.5 rounded-xl ${hasNomor
                                            ? 'bg-bubblegum-50/50 border border-bubblegum-100'
                                            : 'bg-amber-50 border border-amber-200'
                                            }`}>
                                            {hasNomor ? (
                                                <p className="text-sm font-bold text-bubblegum-800">{spd.nomor_spd}</p>
                                            ) : (
                                                <p className="text-sm font-medium text-amber-600 italic flex items-center gap-1.5">
                                                    <FiAlertTriangle className="text-xs" /> Belum ada nomor SPD
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Pegawai Info */}
                                {pegawai && (
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-bubblegum-50/30 border border-bubblegum-100">
                                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-bubblegum-400 to-grape-500 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
                                            <FiUser className="text-base" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-bubblegum-800 truncate">{pegawai.nama_lengkap}</p>
                                            <p className="text-xs text-bubblegum-500 mt-0.5">
                                                NIP: {pegawai.nip}
                                                {pegawai.jabatan && <> &bull; {pegawai.jabatan}</>}
                                                {(pegawai.pangkat || pegawai.golongan) && (
                                                    <> &bull; {[pegawai.pangkat, pegawai.golongan].filter(Boolean).join(' / ')}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
