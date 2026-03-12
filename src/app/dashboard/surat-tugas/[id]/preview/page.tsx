'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSuratTugasDetail } from '../SuratTugasDetailContext';
import api from '@/lib/api';
import {
    FiFileText,
    FiTruck,
    FiAward,
    FiPrinter,
    FiRotateCw,
    FiDownload,
    FiLock,
} from 'react-icons/fi';

export default function SuratTugasPreviewPage() {
    const { data, handleDownload, actionLoading } = useSuratTugasDetail();
    const [activeTab, setActiveTab] = useState<'st' | 'spd'>('st');
    // Track flipped state per SPD id
    const [flippedSpd, setFlippedSpd] = useState<Record<number, boolean>>({});
    // Signed PDF blob URLs
    const [stPdfUrl, setStPdfUrl] = useState<string | null>(null);
    const [spdPdfUrls, setSpdPdfUrls] = useState<Record<number, string>>({});
    const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

    const isSigned = data.status === 'ditandatangani' || data.status === 'selesai';

    // Load ST signed PDF
    const loadStPdf = useCallback(async () => {
        if (!isSigned || !data.file_surat_tugas_signed) return;
        setLoadingPdf('st');
        try {
            const res = await api.get(`/surat-tugas/${data.id}/download`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            setStPdfUrl(URL.createObjectURL(blob));
        } catch { /* fallback to HTML preview */ }
        finally { setLoadingPdf(null); }
    }, [isSigned, data.file_surat_tugas_signed, data.id]);

    // Load SPD signed PDF
    const loadSpdPdf = useCallback(async (spdId: number) => {
        setLoadingPdf(`spd-${spdId}`);
        try {
            const res = await api.get(`/spd/${spdId}/download`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            setSpdPdfUrls(prev => ({ ...prev, [spdId]: URL.createObjectURL(blob) }));
        } catch { /* fallback to HTML preview */ }
        finally { setLoadingPdf(null); }
    }, []);

    useEffect(() => {
        if (isSigned && activeTab === 'st' && !stPdfUrl) {
            loadStPdf();
        }
    }, [isSigned, activeTab, stPdfUrl, loadStPdf]);

    useEffect(() => {
        if (isSigned && activeTab === 'spd' && data.surat_perjalanan_dinas) {
            data.surat_perjalanan_dinas.forEach(spd => {
                if (spd.file_spd_signed && !spdPdfUrls[spd.id]) {
                    loadSpdPdf(spd.id);
                }
            });
        }
    }, [isSigned, activeTab, data.surat_perjalanan_dinas, spdPdfUrls, loadSpdPdf]);

    // Cleanup blob URLs
    useEffect(() => {
        return () => {
            if (stPdfUrl) URL.revokeObjectURL(stPdfUrl);
            Object.values(spdPdfUrls).forEach(u => URL.revokeObjectURL(u));
        };
    }, [stPdfUrl, spdPdfUrls]);

    const toggleFlip = (spdId: number) => {
        setFlippedSpd(prev => ({ ...prev, [spdId]: !prev[spdId] }));
    };

    const formatTanggal = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        const months = [
            '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear()}`;
    };

    const formatCurrency = (val: string | null | undefined) => {
        if (!val) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(val));
    };

    const handlePrint = () => {
        window.print();
    };

    const hasSPD = data.has_spd && data.surat_perjalanan_dinas && data.surat_perjalanan_dinas.length > 0;

    // ========== KOP SURAT LOGIC ==========
    // Ditentukan oleh Pejabat Pemberi Perintah:
    //   Bupati           → KOP Bupati
    //   Sekretaris Daerah → KOP Sekda
    //   Lainnya          → KOP Perangkat Daerah (menampilkan nama OPD)
    const kopType = (() => {
        const jab = (data.pemberi_perintah_jabatan || '').toLowerCase();
        if (jab.includes('bupati') && !jab.includes('wakil')) return 'bupati' as const;
        if (jab.includes('sekretaris daerah') || jab.includes('sekda')) return 'sekda' as const;
        // Sekretariat Daerah instance_id = 15
        if (data.pemberi_perintah_instance_id === 15) return 'sekda' as const;
        // Fallback: check pemberi_perintah_instance name
        const instName = (data.pemberi_perintah_instance?.name || '').toLowerCase();
        if (instName.includes('sekretariat daerah') || instName.includes('sekretaris daerah')) return 'sekda' as const;
        return 'perangkat_daerah' as const;
    })();

    // KOP Surat component based on type
    const renderKopSurat = (size: 'st' | 'spd' = 'st') => {
        const titleSize = size === 'st' ? '14pt' : '13pt';
        const subSize = size === 'st' ? '10pt' : '10pt';
        const addrSize = size === 'st' ? '8pt' : '8pt';

        if (kopType === 'bupati') {
            return (
                <div className="text-center border-b-[3px] border-black pb-4 mb-6">
                    <h1 className={`text-[${titleSize}] font-black tracking-wider`} style={{ letterSpacing: '0.15em' }}>
                        BUPATI OGAN ILIR
                    </h1>
                    <p className={`text-[${addrSize}] mt-1 text-gray-700`}>
                        Komplek Perkantoran Pemerintah Kabupaten Ogan Ilir, Indralaya
                    </p>
                </div>
            );
        }

        if (kopType === 'sekda') {
            return (
                <div className="text-center border-b-[3px] border-black pb-4 mb-6">
                    <p className={`text-[${subSize}] font-bold tracking-wider mb-0.5`} style={{ letterSpacing: '0.1em' }}>
                        PEMERINTAH KABUPATEN OGAN ILIR
                    </p>
                    <h1 className={`text-[${titleSize}] font-black tracking-wider`} style={{ letterSpacing: '0.15em' }}>
                        SEKRETARIAT DAERAH
                    </h1>
                    <p className={`text-[${addrSize}] mt-1 text-gray-700`}>
                        Komplek Perkantoran Pemerintah Kabupaten Ogan Ilir, Indralaya
                    </p>
                </div>
            );
        }

        // perangkat_daerah
        return (
            <div className="text-center border-b-[3px] border-black pb-4 mb-6">
                <p className={`text-[${subSize}] font-bold tracking-wider mb-0.5`} style={{ letterSpacing: '0.1em' }}>
                    PEMERINTAH KABUPATEN OGAN ILIR
                </p>
                <h1 className={`text-[${titleSize}] font-black tracking-wider`} style={{ letterSpacing: '0.15em' }}>
                    {data.instance?.name?.toUpperCase() || 'INSTANSI'}
                </h1>
                <p className={`text-[${addrSize}] mt-1 text-gray-700`}>
                    Komplek Perkantoran Pemerintah Kabupaten Ogan Ilir, Indralaya
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-5">
            {/* Tab Selector & Print */}
            <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
                <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 border border-bubblegum-100 shadow-sm">
                    <button
                        onClick={() => setActiveTab('st')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'st'
                            ? 'bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white shadow-md shadow-bubblegum-300/30'
                            : 'text-bubblegum-500 hover:bg-bubblegum-50 hover:text-bubblegum-700'
                            }`}
                    >
                        <FiFileText className="text-sm" /> Surat Tugas
                    </button>
                    {hasSPD && (
                        <button
                            onClick={() => setActiveTab('spd')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'spd'
                                ? 'bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white shadow-md shadow-bubblegum-300/30'
                                : 'text-bubblegum-500 hover:bg-bubblegum-50 hover:text-bubblegum-700'
                                }`}
                        >
                            <FiTruck className="text-sm" /> SPD
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeTab === 'spd' ? 'bg-white/25 text-white' : 'bg-bubblegum-100 text-bubblegum-600'}`}>
                                {data.surat_perjalanan_dinas?.length}
                            </span>
                        </button>
                    )}
                </div>
                {/* <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-bubblegum-200 text-bubblegum-600 text-sm font-semibold hover:bg-bubblegum-50 transition-all cursor-pointer"
                >
                    <FiPrinter className="text-base" /> Cetak
                </button> */}
            </div>

            {/* === SURAT TUGAS PREVIEW === */}
            {activeTab === 'st' && (
                isSigned && stPdfUrl ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                                <FiAward className="text-base" />
                                <span>Dokumen telah ditandatangani secara elektronik{data.signed_at ? ` pada ${formatTanggal(data.signed_at)}` : ''}</span>
                            </div>
                            <button
                                onClick={() => handleDownload('st', data.id)}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-sky-200 text-sky-600 text-sm font-semibold hover:bg-sky-50 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <FiDownload className="text-base" /> Download
                            </button>
                        </div>
                        <div className="rounded-2xl shadow-xl border border-gray-200 overflow-hidden bg-gray-100" style={{ height: '85vh' }}>
                            <iframe
                                src={stPdfUrl}
                                className="w-full h-full"
                                title="Surat Tugas PDF"
                            />
                        </div>
                    </div>
                ) : isSigned && loadingPdf === 'st' ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
                            <p className="text-sm text-bubblegum-500">Memuat dokumen PDF...</p>
                        </div>
                    </div>
                ) : (
                <div className="doc-preview bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                    <div className="px-16 py-12 max-w-[210mm] mx-auto" style={{ fontSize: '12pt', lineHeight: '1.5', color: '#000' }}>

                        {/* KOP SURAT */}
                        {renderKopSurat('st')}

                        {/* TITLE */}
                        <div className="text-center mb-6">
                            <h2 className="text-[14pt] font-bold tracking-wider underline underline-offset-4 decoration-1" style={{ letterSpacing: '0.12em' }}>
                                SURAT TUGAS
                            </h2>
                            <p className="text-[11pt] mt-1">
                                Nomor : {data.nomor_surat || '......................'}
                            </p>
                        </div>

                        {/* DASAR */}
                        <div className="mb-4">
                            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td className="align-top font-semibold pr-2" style={{ width: '80px', verticalAlign: 'top' }}>Dasar</td>
                                        <td className="align-top font-semibold pr-2" style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                                        <td className="align-top">
                                            {data.dasar ? (
                                                <div
                                                    className="doc-rich-text"
                                                    dangerouslySetInnerHTML={{ __html: data.dasar }}
                                                />
                                            ) : (
                                                <span className="text-gray-400 italic">-</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* MEMERINTAHKAN */}
                        <div className="text-center my-6">
                            <p className="text-[13pt] font-black tracking-wider" style={{ letterSpacing: '0.15em' }}>
                                MEMERINTAHKAN
                            </p>
                        </div>

                        {/* KEPADA - Pegawai Table */}
                        <div className="mb-4">
                            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td className="align-top font-semibold pr-2" style={{ width: '80px', verticalAlign: 'top' }}>Kepada</td>
                                        <td className="align-top font-semibold pr-2" style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                                        <td className="align-top">
                                            <table className="w-full border border-black" style={{ borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-black px-2 py-1.5 text-center font-bold" style={{ width: '35px', fontSize: '10pt' }}>No</th>
                                                        <th className="border border-black px-2 py-1.5 text-left font-bold" style={{ fontSize: '10pt' }}>Nama</th>
                                                        <th className="border border-black px-2 py-1.5 text-left font-bold" style={{ fontSize: '10pt' }}>NIP</th>
                                                        <th className="border border-black px-2 py-1.5 text-left font-bold" style={{ fontSize: '10pt' }}>Pangkat/Golongan</th>
                                                        <th className="border border-black px-2 py-1.5 text-left font-bold" style={{ fontSize: '10pt' }}>Jabatan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.pegawai && data.pegawai.length > 0 ? (
                                                        data.pegawai.map((p, idx) => (
                                                            <tr key={p.id}>
                                                                <td className="border border-black px-2 py-1.5 text-center" style={{ fontSize: '10pt' }}>{idx + 1}</td>
                                                                <td className="border border-black px-2 py-1.5" style={{ fontSize: '10pt' }}>{p.nama_lengkap}</td>
                                                                <td className="border border-black px-2 py-1.5" style={{ fontSize: '10pt' }}>{p.nip}</td>
                                                                <td className="border border-black px-2 py-1.5" style={{ fontSize: '10pt' }}>
                                                                    {[p.pangkat, p.golongan].filter(Boolean).join(' / ') || '-'}
                                                                </td>
                                                                <td className="border border-black px-2 py-1.5" style={{ fontSize: '10pt' }}>{p.jabatan || '-'}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="border border-black px-2 py-1.5 text-center text-gray-400 italic" style={{ fontSize: '10pt' }}>
                                                                Belum ada pegawai
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* UNTUK */}
                        <div className="mb-8">
                            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td className="align-top font-semibold pr-2" style={{ width: '80px', verticalAlign: 'top' }}>Untuk</td>
                                        <td className="align-top font-semibold pr-2" style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                                        <td className="align-top">
                                            {data.untuk ? (
                                                <div
                                                    className="doc-rich-text"
                                                    dangerouslySetInnerHTML={{ __html: data.untuk }}
                                                />
                                            ) : (
                                                <span className="text-gray-400 italic">-</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* SIGNATURE BLOCK */}
                        <div className="flex justify-end mt-12">
                            <div className="text-center" style={{ width: '280px' }}>
                                <p>
                                    {data.tempat_dikeluarkan || 'Indralaya'}, {formatTanggal(data.signed_at || data.tanggal_dikeluarkan)}
                                </p>
                                <p className="font-semibold mt-1">
                                    {data.pemberi_perintah_jabatan || data.penandatangan_jabatan || 'Pemberi Perintah'}
                                </p>
                                {/* Signature space */}
                                <div className="h-20 flex items-center justify-center">
                                    {(data.status === 'ditandatangani' || data.status === 'selesai') ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <FiAward className="text-3xl text-emerald-600" />
                                            <span className="text-[8pt] text-emerald-600 font-semibold">Ditandatangani Secara Elektronik</span>
                                        </div>
                                    ) : (
                                        <span className="text-[9pt] text-gray-300 italic">[ tanda tangan ]</span>
                                    )}
                                </div>
                                <p className="font-bold underline underline-offset-2 decoration-1">
                                    {data.penandatangan_nama || '...........................'}
                                </p>
                                {data.penandatangan_nip && (
                                    <p className="text-[10pt]">NIP. {data.penandatangan_nip}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                )
            )}

            {/* === SPD PREVIEW === */}
            {activeTab === 'spd' && hasSPD && (
                <div className="space-y-8">
                    {data.surat_perjalanan_dinas!.map((spd, spdIdx) => {
                        const pegawai = spd.surat_tugas_pegawai;
                        const isFlipped = !!flippedSpd[spd.id];
                        const hasSpdPdf = isSigned && spd.file_spd_signed && spdPdfUrls[spd.id];
                        return (
                            <div key={spd.id}>
                                {/* SPD Label + Flip/Download Button */}
                                <div className="flex items-center justify-between mb-3 print:hidden">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                            {spdIdx + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-bubblegum-800">
                                                SPD — {pegawai?.nama_lengkap || 'Pegawai'}
                                            </p>
                                            <p className="text-xs text-bubblegum-400">{spd.nomor_spd || 'Belum ada nomor'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasSpdPdf && (
                                            <button
                                                onClick={() => handleDownload('spd', spd.id)}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-sky-200 text-sky-600 text-sm font-semibold hover:bg-sky-50 transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <FiDownload className="text-base" /> Download
                                            </button>
                                        )}
                                        {!hasSpdPdf && (
                                            <button
                                                onClick={() => toggleFlip(spd.id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-bubblegum-200 text-bubblegum-600 text-sm font-semibold hover:bg-bubblegum-50 hover:border-bubblegum-300 transition-all cursor-pointer group"
                                            >
                                                <FiRotateCw className={`text-base transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''} group-hover:rotate-90`} />
                                                {isFlipped ? 'Halaman Depan' : 'Halaman Belakang'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* SPD Document - Signed PDF or HTML Preview */}
                                {hasSpdPdf ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                                            <FiAward className="text-base" />
                                            <span>Ditandatangani secara elektronik{spd.signed_at ? ` pada ${formatTanggal(spd.signed_at)}` : ''}</span>
                                        </div>
                                        <div className="rounded-2xl shadow-xl border border-gray-200 overflow-hidden bg-gray-100" style={{ height: '85vh' }}>
                                            <iframe
                                                src={spdPdfUrls[spd.id]}
                                                className="w-full h-full"
                                                title={`SPD ${spd.nomor_spd || spd.id} PDF`}
                                            />
                                        </div>
                                    </div>
                                ) : isSigned && spd.file_spd_signed && loadingPdf === `spd-${spd.id}` ? (
                                    <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
                                            <p className="text-sm text-bubblegum-500">Memuat dokumen SPD PDF...</p>
                                        </div>
                                    </div>
                                ) : !isFlipped ? (
                                    <div className="doc-preview bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                                        <div className="px-12 py-10 max-w-[210mm] mx-auto" style={{ fontSize: '11pt', lineHeight: '1.4', color: '#000' }}>
                                            {renderKopSurat('spd')}
                                            <div className="text-center mb-5">
                                                <h2 className="text-[13pt] font-bold tracking-wider underline underline-offset-4 decoration-1" style={{ letterSpacing: '0.1em' }}>SURAT PERJALANAN DINAS (SPD)</h2>
                                                <p className="text-[10pt] mt-1">Nomor : {spd.nomor_spd || '......................'}</p>
                                            </div>
                                            <table className="w-full border border-black mb-6" style={{ borderCollapse: 'collapse', fontSize: '10pt' }}>
                                                <tbody>
                                                    <SpdRow no="1" label="Pejabat Pembuat Komitmen" value={data.penandatangan_nama || '-'} />
                                                    <SpdRow no="2" label="Nama / NIP Pegawai yang melaksanakan perjalanan dinas" value={pegawai ? `${pegawai.nama_lengkap}\nNIP. ${pegawai.nip}` : '-'} multiline />
                                                    <SpdRow no="3" label="Pangkat dan Golongan" value={pegawai ? [pegawai.pangkat, pegawai.golongan].filter(Boolean).join(' / ') || '-' : '-'} />
                                                    <SpdRow no="4" label="Jabatan / Instansi" value={pegawai ? [pegawai.jabatan, data.instance?.name].filter(Boolean).join(' / ') : '-'} />
                                                    <SpdRow no="5" label="Tingkat Biaya Perjalanan Dinas" value={spd.tingkat_biaya_label || '-'} />
                                                    <SpdRow no="6" label="Maksud Perjalanan Dinas" value={data.untuk || '-'} isHtml={!!data.untuk} />
                                                    <SpdRow no="7" label="Alat Angkutan yang dipergunakan" value={data.alat_angkut || '-'} />
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 text-center align-top font-semibold" style={{ width: '30px' }} rowSpan={2}>8</td>
                                                        <td className="border border-black px-2 py-1.5 align-top"><span className="font-semibold">a.</span> Tempat Berangkat</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">{data.instance?.name || 'Indralaya'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 align-top"><span className="font-semibold">b.</span> Tempat Tujuan</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">{data.lokasi_tujuan || data.tujuan_kecamatan_nama || data.tujuan_kabupaten_nama || data.tujuan_provinsi_nama || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 text-center align-top font-semibold" style={{ width: '30px' }} rowSpan={3}>9</td>
                                                        <td className="border border-black px-2 py-1.5 align-top"><span className="font-semibold">a.</span> Lamanya Perjalanan Dinas</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">{data.lama_perjalanan ? `${data.lama_perjalanan} hari` : '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 align-top"><span className="font-semibold">b.</span> Tanggal Berangkat</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">{formatTanggal(data.tanggal_berangkat)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 align-top"><span className="font-semibold">c.</span> Tanggal harus kembali</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">{formatTanggal(data.tanggal_kembali)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 text-center align-top font-semibold" style={{ width: '30px' }}>10</td>
                                                        <td className="border border-black px-2 py-1.5 align-top font-semibold">Pengikut : Nama / Tanggal Lahir</td>
                                                        <td className="border border-black px-2 py-1.5 align-top font-semibold">Keterangan</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 text-center align-top"></td>
                                                        <td className="border border-black px-2 py-2 align-top text-gray-400 italic text-center" style={{ fontSize: '9pt' }}>-</td>
                                                        <td className="border border-black px-2 py-2 align-top text-gray-400 italic text-center" style={{ fontSize: '9pt' }}>-</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 text-center align-top font-semibold" style={{ width: '30px' }}>11</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">Pembebanan Anggaran</td>
                                                        <td className="border border-black px-2 py-1.5 align-top"><p>{data.instance?.name || '-'}</p></td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-2 py-1.5 text-center align-top font-semibold" style={{ width: '30px' }}>12</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">Keterangan Lain-lain</td>
                                                        <td className="border border-black px-2 py-1.5 align-top">{data.keterangan || '-'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div className="flex justify-between mt-8">
                                                <div style={{ width: '45%' }}>
                                                    <p className="text-[10pt]">Dikeluarkan di : {data.tempat_dikeluarkan || 'Indralaya'}</p>
                                                    <p className="text-[10pt]">Pada tanggal &nbsp;&nbsp;&nbsp;: {formatTanggal(data.signed_at || data.tanggal_dikeluarkan)}</p>
                                                </div>
                                                <div className="text-center" style={{ width: '45%' }}>
                                                    <p className="font-semibold">{data.penandatangan_jabatan || 'Pejabat Pembuat Komitmen'}</p>
                                                    <div className="h-20 flex items-center justify-center">
                                                        {(data.status === 'ditandatangani' || data.status === 'selesai') ? (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <FiAward className="text-3xl text-emerald-600" />
                                                                <span className="text-[8pt] text-emerald-600 font-semibold">Ditandatangani Elektronik</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9pt] text-gray-300 italic">{'[ tanda tangan ]'}</span>
                                                        )}
                                                    </div>
                                                    <p className="font-bold underline underline-offset-2 decoration-1">{data.penandatangan_nama || '...........................'}</p>
                                                    {data.penandatangan_nip && (<p className="text-[10pt]">NIP. {data.penandatangan_nip}</p>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="doc-preview bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                                        <div className="px-10 py-8 max-w-[210mm] mx-auto" style={{ fontSize: '9.5pt', lineHeight: '1.3', color: '#000' }}>
                                            <table className="w-full border-2 border-black mb-4" style={{ borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    {[
                                                        { no: 'I', hasBerangkatAbove: true },
                                                        { no: 'II' },
                                                        { no: 'III' },
                                                        { no: 'IV' },
                                                        { no: 'V' },
                                                        { no: 'VI', isLast: true },
                                                    ].map((section) => (
                                                        <BackPageSection key={section.no} {...section} />
                                                    ))}
                                                </tbody>
                                            </table>
                                            <table className="w-full border-2 border-black mb-4" style={{ borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr>
                                                        <td className="border border-black px-3 py-2 align-top font-bold text-center" style={{ width: '30px' }}>VII</td>
                                                        <td className="border border-black px-3 py-2 align-top" colSpan={2}>
                                                            <p className="font-semibold mb-1">Catatan Lain-Lain</p>
                                                            <div className="border-b border-dashed border-gray-300 h-5 mb-1"></div>
                                                            <div className="border-b border-dashed border-gray-300 h-5 mb-1"></div>
                                                            <div className="border-b border-dashed border-gray-300 h-5"></div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-black px-3 py-2 align-top" colSpan={3}>
                                                            <p className="text-[8.5pt] leading-snug">
                                                                Telah diperiksa, dengan keterangan bahwa perjalanan tersebut di atas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                                                            </p>
                                                            <div className="flex justify-end mt-4">
                                                                <div className="text-center" style={{ width: '220px' }}>
                                                                    <p className="font-semibold">Pejabat Pembuat Komitmen,</p>
                                                                    <div className="h-14"></div>
                                                                    <p className="font-bold underline underline-offset-2 decoration-1">{data.penandatangan_nama || '...........................'}</p>
                                                                    {data.penandatangan_nip && (<p className="text-[9pt]">NIP. {data.penandatangan_nip}</p>)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr>
                                                        <td className="border border-black px-3 py-2 align-top font-bold text-center" style={{ width: '30px' }}>VIII</td>
                                                        <td className="border border-black px-3 py-2 align-top">
                                                            <p className="font-bold mb-1">PERHATIAN :</p>
                                                            <p className="text-[8pt] leading-snug text-justify">
                                                                PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Page break for print */}
                                {spdIdx < data.surat_perjalanan_dinas!.length - 1 && (
                                    <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* SPD Form Table Row */
function SpdRow({ no, label, value, multiline, isHtml }: {
    no: string;
    label: string;
    value: string;
    multiline?: boolean;
    isHtml?: boolean;
}) {
    return (
        <tr>
            <td className="border border-black px-2 py-1.5 text-center align-top font-semibold" style={{ width: '30px' }}>{no}</td>
            <td className="border border-black px-2 py-1.5 align-top" style={{ width: '40%' }}>{label}</td>
            <td className="border border-black px-2 py-1.5 align-top">
                {isHtml ? (
                    <div className="doc-rich-text" dangerouslySetInnerHTML={{ __html: value }} />
                ) : multiline ? (
                    <span style={{ whiteSpace: 'pre-line' }}>{value}</span>
                ) : (
                    value
                )}
            </td>
        </tr>
    );
}

/* SPD Back Page Section (Berangkat/Tiba pair) */
function BackPageSection({ no, hasBerangkatAbove, isLast }: {
    no: string;
    hasBerangkatAbove?: boolean;
    isLast?: boolean;
}) {
    return (
        <>
            {/* Berangkat Row */}
            <tr>
                <td className="border border-black px-2 py-1 text-center align-top font-bold" style={{ width: '30px' }} rowSpan={2}>
                    {no}
                </td>
                <td className="border border-black px-2 py-1 align-top" colSpan={2}>
                    <div className="flex flex-col gap-0.5">
                        <p className="font-semibold text-[9pt]">
                            Berangkat dari {no === 'I' ? '(Tempat Kedudukan)' : '(Tempat)'} Ke
                        </p>
                        <div className="flex justify-between items-start mt-1">
                            <div style={{ width: '55%' }}>
                                <p className="text-[8.5pt]">
                                    Pada Tanggal : ......................................
                                </p>
                            </div>
                            <div className="text-center" style={{ width: '40%' }}>
                                <p className="text-[8.5pt]">Kepala {no === 'I' ? 'Kantor/Satker' : ''}</p>
                                <div className="h-10"></div>
                                <p className="text-[8.5pt]">.....................................</p>
                                <p className="text-[8pt]">NIP. ...........................</p>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>

            {/* Tiba Row */}
            <tr>
                <td className="border border-black px-2 py-1 align-top" colSpan={2}>
                    <div className="flex flex-col gap-0.5">
                        <p className="font-semibold text-[9pt]">
                            Tiba di {isLast ? '(Tempat Kedudukan)' : ''}
                        </p>
                        <div className="flex justify-between items-start mt-1">
                            <div style={{ width: '55%' }}>
                                <p className="text-[8.5pt]">
                                    Pada Tanggal : ......................................
                                </p>
                            </div>
                            <div className="text-center" style={{ width: '40%' }}>
                                <p className="text-[8.5pt]">Kepala {isLast ? 'Kantor/Satker' : ''}</p>
                                <div className="h-10"></div>
                                <p className="text-[8.5pt]">.....................................</p>
                                <p className="text-[8pt]">NIP. ...........................</p>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}
