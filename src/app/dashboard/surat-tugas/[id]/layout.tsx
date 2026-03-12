'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { SuratTugas } from '@/lib/types';
import { SuratTugasDetailContext, statusConfig, type SuratTugasDetailContextType, type Permissions } from './SuratTugasDetailContext';
import {
    FiArrowLeft,
    FiSend,
    FiCheck,
    FiX,
    FiRotateCcw,
    FiFileText,
    FiTruck,
    FiAlertTriangle,
    FiDownload,
    FiRefreshCw,
    FiEye,
    FiBriefcase,
    FiEdit2,
    FiClock,
} from 'react-icons/fi';
import { swalConfirm, swalSuccess, swalError, swalWarning, BubbleGumSwal } from '@/lib/swal';
import ProcessingOverlay from '@/components/ProcessingOverlay';

export default function SuratTugasDetailLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const id = params?.id as string;

    const [data, setData] = useState<SuratTugas | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [signingOverlay, setSigningOverlay] = useState<{
        visible: boolean;
        title: string;
        subtitle: string;
        steps: { label: string; status: 'pending' | 'active' | 'done' | 'error' }[];
    }>({ visible: false, title: '', subtitle: '', steps: [] });
    const [permissions, setPermissions] = useState<Permissions>({
        can_edit: false,
        can_send: false,
        can_sign: false,
        can_reject: false,
        can_revise: false,
        can_complete: false,
        can_delete: false,
        is_creator: false,
        is_signer: false,
    });

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/surat-tugas/${id}`);
            if (res.data.success) {
                setData(res.data.data);
                if (res.data.permissions) {
                    setPermissions(res.data.permissions);
                }
            }
        } catch { /* */ }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = useCallback(async (action: string, confirmMsg: string) => {
        const confirmed = await swalConfirm('Konfirmasi', confirmMsg, {
            confirmText: 'Ya, Lanjutkan',
            icon: action === 'tolak' ? 'warning' : 'question',
            isDanger: action === 'tolak',
        });
        if (!confirmed) return;
        setActionLoading(action);
        try {
            const res = await api.post(`/surat-tugas/${id}/${action}`, {});
            if (res.data.success) {
                await swalSuccess('Berhasil!', `Surat tugas berhasil di-${action}.`);
                fetchData();
            } else {
                swalError('Gagal', res.data.message || 'Terjadi kesalahan.');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            swalError('Gagal', error?.response?.data?.message || 'Terjadi kesalahan.');
        } finally { setActionLoading(''); }
    }, [id, fetchData]);

    const handleDownload = useCallback(async (type: 'st' | 'spd', itemId: number | string) => {
        setActionLoading(`download-${type}-${itemId}`);
        try {
            const endpoint = type === 'st' ? `/surat-tugas/${itemId}/download` : `/spd/${itemId}/download`;
            const res = await api.get(endpoint, { responseType: 'blob' });
            const contentType = res.headers['content-type'] || '';
            const ext = contentType.includes('pdf') ? 'pdf' : 'docx';
            const filename = type === 'st' ? `Surat_Tugas_${itemId}.${ext}` : `SPD_${itemId}.${ext}`;
            const blob = new Blob([res.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            swalError('Gagal Mengunduh', error?.response?.data?.message || 'Gagal mengunduh dokumen.');
        } finally { setActionLoading(''); }
    }, []);

    const handleRegenerate = useCallback(async () => {
        const confirmed = await swalConfirm(
            'Generate Ulang Dokumen?',
            'Semua dokumen surat tugas dan SPD akan di-generate ulang.',
            { confirmText: 'Ya, Generate Ulang', icon: 'warning' }
        );
        if (!confirmed) return;

        setActionLoading('regenerate');
        setSigningOverlay({
            visible: true,
            title: 'Generating Ulang Dokumen',
            subtitle: 'Mohon tunggu, dokumen sedang di-generate ulang...',
            steps: [
                { label: 'Mempersiapkan data', status: 'active' },
                { label: 'Generate dokumen Surat Tugas (PDF)', status: 'pending' },
                { label: 'Generate dokumen SPD (PDF)', status: 'pending' },
                { label: 'Menyimpan dokumen', status: 'pending' },
            ],
        });

        try {
            await new Promise(r => setTimeout(r, 400));
            setSigningOverlay(prev => ({
                ...prev,
                steps: prev.steps.map((s, i) =>
                    i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s
                ),
            }));

            const res = await api.get(`/surat-tugas/${id}/regenerate`);

            if (res.data.success) {
                setSigningOverlay(prev => ({
                    ...prev,
                    steps: prev.steps.map(s => ({ ...s, status: 'done' as const })),
                }));
                await new Promise(r => setTimeout(r, 500));
                setSigningOverlay(prev => ({ ...prev, visible: false }));
                await swalSuccess('Berhasil!', 'Dokumen berhasil digenerate ulang.');
                fetchData();
            } else {
                setSigningOverlay(prev => ({ ...prev, visible: false }));
                swalError('Gagal', res.data.message || 'Terjadi kesalahan.');
            }
        } catch (err: unknown) {
            setSigningOverlay(prev => ({ ...prev, visible: false }));
            const error = err as { response?: { data?: { message?: string } } };
            swalError('Gagal', error?.response?.data?.message || 'Gagal mengenerate ulang dokumen.');
        } finally { setActionLoading(''); }
    }, [id, fetchData]);

    // Handle "Kirim" with processing overlay
    const handleKirim = useCallback(async () => {
        const confirmed = await swalConfirm(
            'Kirim Surat Tugas?',
            'Surat tugas akan dikirim ke penandatangan. Dokumen akan di-generate secara otomatis.',
            { confirmText: 'Ya, Kirim', icon: 'question' }
        );
        if (!confirmed) return;

        setActionLoading('kirim');
        setSigningOverlay({
            visible: true,
            title: 'Mengirim Surat Tugas',
            subtitle: 'Dokumen sedang di-generate dan dikirim ke penandatangan...',
            steps: [
                { label: 'Validasi kelengkapan data', status: 'active' },
                { label: 'Generate dokumen Surat Tugas (PDF)', status: 'pending' },
                { label: 'Generate dokumen SPD (PDF)', status: 'pending' },
                { label: 'Mengirim ke penandatangan', status: 'pending' },
            ],
        });

        try {
            // Simulate step progress
            await new Promise(r => setTimeout(r, 500));
            setSigningOverlay(prev => ({
                ...prev,
                steps: prev.steps.map((s, i) =>
                    i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s
                ),
            }));

            const res = await api.post(`/surat-tugas/${id}/kirim`, {});

            if (res.data.success) {
                setSigningOverlay(prev => ({
                    ...prev,
                    steps: prev.steps.map(s => ({ ...s, status: 'done' as const })),
                }));
                await new Promise(r => setTimeout(r, 600));
                setSigningOverlay(prev => ({ ...prev, visible: false }));
                await swalSuccess('Berhasil!', 'Surat tugas berhasil dikirim untuk ditandatangani.');
                fetchData();
            } else {
                setSigningOverlay(prev => ({ ...prev, visible: false }));
                swalError('Gagal', res.data.message || 'Terjadi kesalahan.');
            }
        } catch (err: unknown) {
            setSigningOverlay(prev => ({ ...prev, visible: false }));
            const error = err as { response?: { data?: { message?: string } } };
            swalError('Gagal Mengirim', error?.response?.data?.message || 'Terjadi kesalahan saat mengirim surat tugas.');
        } finally {
            setActionLoading('');
        }
    }, [id, fetchData]);

    // Handle TTE eSign
    const handleTandatangani = useCallback(async () => {
        // Show passphrase input dialog
        const result = await BubbleGumSwal.fire({
            title: 'Tanda Tangan Elektronik',
            html: `
                <div style="text-align:left;margin-top:8px;">
                    <p style="font-size:13px;color:#64748b;margin-bottom:16px;line-height:1.5;">
                        Masukkan passphrase sertifikat digital Anda untuk menandatangani surat tugas ini secara elektronik (TTE).
                    </p>
                    <label style="display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px;">
                        Passphrase
                    </label>
                    <input
                        type="password"
                        id="swal-passphrase"
                        class="swal2-input"
                        placeholder="Masukkan passphrase..."
                        autocomplete="off"
                        style="margin:0;width:100%;box-sizing:border-box;"
                    />
                </div>
            `,
            icon: 'info',
            iconColor: '#1e3a8a',
            showCancelButton: true,
            confirmButtonText: 'Tandatangani',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusConfirm: false,
            preConfirm: () => {
                const passphrase = (document.getElementById('swal-passphrase') as HTMLInputElement)?.value;
                if (!passphrase || passphrase.trim().length === 0) {
                    BubbleGumSwal.showValidationMessage('Passphrase wajib diisi');
                    return false;
                }
                return passphrase.trim();
            },
        });

        if (!result.isConfirmed || !result.value) return;

        const passphrase = result.value as string;

        setActionLoading('tandatangani');
        const spdCount = data?.surat_perjalanan_dinas?.length ?? 0;
        const steps: { label: string; status: 'pending' | 'active' | 'done' | 'error' }[] = [
            { label: 'Verifikasi sertifikat digital', status: 'active' },
            { label: 'Tanda tangan Surat Tugas (PDF)', status: 'pending' },
        ];
        if (spdCount > 0) {
            steps.push({ label: `Tanda tangan ${spdCount} dokumen SPD`, status: 'pending' });
        }
        steps.push({ label: 'Menyimpan dokumen yang telah ditandatangani', status: 'pending' });

        setSigningOverlay({
            visible: true,
            title: 'Proses Tanda Tangan Elektronik',
            subtitle: 'Menghubungkan ke server TTE (Tanda Tangan Elektronik)...',
            steps,
        });

        try {
            // Animate step progress
            await new Promise(r => setTimeout(r, 800));
            setSigningOverlay(prev => ({
                ...prev,
                subtitle: 'Menandatangani dokumen secara digital...',
                steps: prev.steps.map((s, i) =>
                    i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s
                ),
            }));

            const res = await api.post(`/surat-tugas/${id}/tandatangani`, { passphrase });

            if (res.data.success) {
                // Animate all steps to done
                setSigningOverlay(prev => ({
                    ...prev,
                    title: 'Berhasil Ditandatangani!',
                    subtitle: 'Semua dokumen telah ditandatangani secara elektronik.',
                    steps: prev.steps.map(s => ({ ...s, status: 'done' as const })),
                }));
                await new Promise(r => setTimeout(r, 1200));
                setSigningOverlay(prev => ({ ...prev, visible: false }));
                await swalSuccess('Berhasil!', 'Surat tugas berhasil ditandatangani secara elektronik (TTE).');
                fetchData();
            } else {
                setSigningOverlay(prev => ({ ...prev, visible: false }));
                swalError('Gagal', res.data.message || 'Terjadi kesalahan saat menandatangani.');
            }
        } catch (err: unknown) {
            setSigningOverlay(prev => ({ ...prev, visible: false }));
            const error = err as { response?: { data?: { message?: string } } };
            swalError('Gagal Menandatangani', error?.response?.data?.message || 'Terjadi kesalahan saat proses tanda tangan elektronik.');
        } finally {
            setActionLoading('');
        }
    }, [id, data, fetchData]);

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
                <p className="text-sm font-medium">Surat tugas tidak ditemukan</p>
                <Link href="/dashboard/surat-tugas" className="mt-3 text-bubblegum-500 text-sm hover:underline">
                    Kembali ke daftar
                </Link>
            </div>
        );
    }

    const status = statusConfig[data.status];
    const hasMissingSpdNomor = data.has_spd && data.surat_perjalanan_dinas?.some(spd => !spd.nomor_spd);

    const basePath = `/dashboard/surat-tugas/${id}`;
    const activeTab = pathname === basePath ? 'detail'
        : pathname.startsWith(`${basePath}/edit`) ? 'edit'
            : pathname.startsWith(`${basePath}/spd`) ? 'spd'
                : pathname.startsWith(`${basePath}/preview`) ? 'preview'
                    : pathname.startsWith(`${basePath}/log`) ? 'log'
                        : 'detail';

    const contextValue: SuratTugasDetailContextType = {
        data,
        loading,
        actionLoading,
        permissions,
        fetchData,
        handleAction,
        handleDownload,
        handleRegenerate,
    };

    return (
        <SuratTugasDetailContext.Provider value={contextValue}>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header Card */}
                <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <Link
                                href="/dashboard/surat-tugas"
                                className="mt-1 p-2.5 rounded-2xl text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-100 transition-all"
                            >
                                <FiArrowLeft className="text-xl" />
                            </Link>
                            <div>
                                <p className="text-xs text-bubblegum-400 uppercase tracking-wider font-semibold mb-1">Surat Tugas</p>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-bubblegum-600 to-grape-600 bg-clip-text text-transparent">
                                    {data.nomor_surat || 'Belum Ada Nomor'}
                                </h1>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-semibold border ${status.bg} ${status.color} ${status.border}`}>
                                        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                                        {status.label}
                                    </span>
                                    {data.has_spd && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-grape-50 text-grape-600 border border-grape-200">
                                            <FiTruck className="text-xs" /> Dengan SPD
                                        </span>
                                    )}
                                    {data.instance?.name && (
                                        <span className="text-xs text-bubblegum-400">{data.instance.name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {data.klasifikasi && (
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-bubblegum-400 uppercase tracking-wide font-semibold">Klasifikasi</p>
                                <p className="text-sm font-semibold text-grape-600">{data.klasifikasi.kode}</p>
                                <p className="text-xs text-bubblegum-500 max-w-[200px]">{data.klasifikasi.klasifikasi}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Warning: SPD Nomor Missing */}
                {data.status === 'draft' && hasMissingSpdNomor && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-800">
                        <FiAlertTriangle className="text-xl shrink-0 mt-0.5 text-amber-500" />
                        <div>
                            <p className="text-sm font-semibold">Nomor SPD Belum Lengkap</p>
                            <p className="text-xs mt-0.5 text-amber-700">
                                Surat tugas tidak bisa dikirim ke penandatangan jika masih ada SPD yang belum memiliki nomor. Silakan lengkapi nomor SPD terlebih dahulu.
                            </p>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 border border-bubblegum-100 shadow-sm">
                        <TabLink href={basePath} active={activeTab === 'detail'} icon={FiBriefcase} label="Detail" />
                        {data.status === 'draft' && permissions.can_edit && (
                            <TabLink href={`${basePath}/edit`} active={activeTab === 'edit'} icon={FiEdit2} label="Edit" />
                        )}
                        {data.has_spd && (
                            <TabLink href={`${basePath}/spd`} active={activeTab === 'spd'} icon={FiTruck} label="SPD" badge={data.surat_perjalanan_dinas?.length} />
                        )}
                        <TabLink href={`${basePath}/preview`} active={activeTab === 'preview'} icon={FiEye} label="Preview" />
                        <TabLink href={`${basePath}/log`} active={activeTab === 'log'} icon={FiClock} label="Log" />
                    </div>

                    {/* Separator — only show if there are any action buttons */}
                    {(permissions.can_send || permissions.can_sign || permissions.can_reject || permissions.can_revise || permissions.can_complete) && (
                        <div className="hidden sm:block h-8 w-px bg-bubblegum-200" />
                    )}

                    {/* Status-specific Action Buttons — permission-gated */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {data.status === 'draft' && permissions.can_send && (
                            <button
                                onClick={() => {
                                    if (hasMissingSpdNomor) {
                                        swalWarning('Nomor SPD Belum Lengkap', 'Tidak bisa mengirim: masih ada SPD yang belum memiliki nomor SPD. Silakan lengkapi terlebih dahulu.');
                                        return;
                                    }
                                    handleKirim();
                                }}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white text-sm font-semibold shadow-lg shadow-bubblegum-300/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                            >
                                <FiSend className="text-base" />
                                {actionLoading === 'kirim' ? 'Mengirim...' : 'Kirim'}
                            </button>
                        )}
                        {data.status === 'dikirim' && permissions.can_sign && (
                            <button
                                onClick={handleTandatangani}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-mint-500 text-white text-sm font-semibold shadow-md hover:bg-mint-600 transition-all disabled:opacity-50"
                            >
                                <FiCheck className="text-base" /> {actionLoading === 'tandatangani' ? 'Proses...' : 'Tandatangani (TTE)'}
                            </button>
                        )}
                        {data.status === 'dikirim' && permissions.can_reject && (
                            <button
                                onClick={() => handleAction('tolak', 'Tolak surat tugas ini?')}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                                <FiX className="text-base" /> {actionLoading === 'tolak' ? 'Proses...' : 'Tolak'}
                            </button>
                        )}
                        {data.status === 'ditolak' && permissions.can_revise && (
                            <button
                                onClick={() => handleAction('revisi', 'Kembalikan ke draft untuk direvisi?')}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border-2 border-candy-200 text-candy-700 text-sm font-semibold hover:bg-candy-50 transition-all disabled:opacity-50"
                            >
                                <FiRotateCcw className="text-base" /> {actionLoading === 'revisi' ? 'Proses...' : 'Revisi'}
                            </button>
                        )}
                        {data.status === 'ditandatangani' && permissions.can_complete && (
                            <button
                                onClick={() => handleAction('selesai', 'Tandai surat tugas ini sebagai selesai?')}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-grape-500 to-candy-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <FiCheck className="text-base" /> {actionLoading === 'selesai' ? 'Proses...' : 'Selesaikan'}
                            </button>
                        )}
                        {data.status !== 'draft' && (
                            <>
                                {data.file_surat_tugas && (data.status === 'ditandatangani' || data.status === 'selesai') && (
                                    <button
                                        onClick={() => handleDownload('st', data.id)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-sky-200 text-sky-600 text-sm font-semibold hover:bg-sky-50 transition-all disabled:opacity-50"
                                    >
                                        <FiDownload className="text-base" />
                                        {actionLoading === `download-st-${data.id}` ? 'Mengunduh...' : 'Download ST'}
                                    </button>
                                )}
                                {(permissions.is_creator && data.status === 'dikirim') && (
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-all disabled:opacity-50"
                                    >
                                        <FiRefreshCw className="text-base" />
                                        {actionLoading === 'regenerate' ? 'Proses...' : 'Generate Ulang'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                {children}
            </div>

            {/* Processing Overlay for Kirim & TTE */}
            <ProcessingOverlay
                isVisible={signingOverlay.visible}
                title={signingOverlay.title}
                subtitle={signingOverlay.subtitle}
                steps={signingOverlay.steps}
            />
        </SuratTugasDetailContext.Provider>
    );
}

/* Tab Link Component */
function TabLink({ href, active, icon: Icon, label, badge }: {
    href: string;
    active: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active
                ? 'bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white shadow-md shadow-bubblegum-300/30'
                : 'text-bubblegum-500 hover:bg-bubblegum-50 hover:text-bubblegum-700'
                }`}
        >
            <Icon className="text-sm" />
            {label}
            {badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-bubblegum-100 text-bubblegum-600'
                    }`}>
                    {badge}
                </span>
            )}
        </Link>
    );
}
