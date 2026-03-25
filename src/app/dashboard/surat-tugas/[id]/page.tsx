'use client';

import Link from 'next/link';
import { useSuratTugasDetail, statusConfig } from './SuratTugasDetailContext';
import {
    FiFileText,
    FiUsers,
    FiMapPin,
    FiCalendar,
    FiAward,
    FiDownload,
    FiAlertTriangle,
    FiExternalLink,
    FiUser,
    FiHash,
    FiBriefcase,
} from 'react-icons/fi';

export default function SuratTugasDetailPage() {
    const { data, actionLoading, handleDownload } = useSuratTugasDetail();

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatCurrency = (val: string | null | undefined) => {
        if (!val) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(val));
    };

    return (
        <>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Pemberi Perintah & Penandatangan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                                    <FiUser className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Pemberi Perintah</h3>
                            </div>
                            <div className="space-y-2.5">
                                <DetailField label="Nama" value={data.pemberi_perintah_nama || '-'} bold />
                                <DetailField label="NIP" value={data.pemberi_perintah_nip || '-'} />
                                <DetailField label="Jabatan" value={data.pemberi_perintah_jabatan || '-'} />
                                {(data.pemberi_perintah_pangkat || data.pemberi_perintah_golongan) && (
                                    <DetailField label="Pangkat / Golongan" value={[data.pemberi_perintah_pangkat, data.pemberi_perintah_golongan].filter(Boolean).join(' / ')} />
                                )}
                            </div>
                        </div>
                        <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-500 to-candy-500 text-white flex items-center justify-center shadow-md">
                                    <FiAward className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Penandatangan</h3>
                            </div>
                            <div className="space-y-2.5">
                                <DetailField label="Nama" value={data.penandatangan_nama || '-'} bold />
                                <DetailField label="NIP" value={data.penandatangan_nip || '-'} />
                                <DetailField label="Jabatan" value={data.penandatangan_jabatan || '-'} />
                                {data.penandatangan_instance?.name && (
                                    <DetailField label="Instansi" value={data.penandatangan_instance.name} />
                                )}
                            </div>
                        </div>

                        {/* PPK */}
                        {data.ppk_nama && (
                            <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint-400 to-candy-500 text-white flex items-center justify-center shadow-md">
                                        <FiAward className="text-sm" />
                                    </span>
                                    <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Pejabat Pembuat Komitmen</h3>
                                </div>
                                <div className="space-y-2.5">
                                    <DetailField label="Nama" value={data.ppk_nama} bold />
                                    <DetailField label="NIP" value={data.ppk_nip || '-'} />
                                    {data.ppk_jabatan && <DetailField label="Jabatan" value={data.ppk_jabatan} />}
                                    {data.ppk_pangkat && <DetailField label="Pangkat" value={data.ppk_pangkat} />}
                                    {data.ppk_golongan && <DetailField label="Golongan" value={data.ppk_golongan} />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dasar */}
                    {data.dasar && (
                        <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-400 to-grape-500 text-white flex items-center justify-center shadow-md">
                                    <FiFileText className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Dasar</h3>
                            </div>
                            <div
                                className="rich-text-content text-sm text-bubblegum-800 bg-bubblegum-50/50 rounded-2xl p-4 border border-bubblegum-100"
                                dangerouslySetInnerHTML={{ __html: data.dasar }}
                            />
                        </div>
                    )}

                    {/* Untuk */}
                    {data.untuk && (
                        <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-400 to-grape-500 text-white flex items-center justify-center shadow-md">
                                    <FiBriefcase className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Untuk</h3>
                            </div>
                            <div
                                className="rich-text-content text-sm text-bubblegum-800 bg-bubblegum-50/50 rounded-2xl p-4 border border-bubblegum-100"
                                dangerouslySetInnerHTML={{ __html: data.untuk }}
                            />
                        </div>
                    )}

                    {/* Pegawai List */}
                    <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                                <FiUsers className="text-sm" />
                            </span>
                            <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">
                                Pegawai yang Ditugaskan
                            </h3>
                            {data.pegawai && data.pegawai.length > 0 && (
                                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-600 text-xs font-bold">
                                    {data.pegawai.length}
                                </span>
                            )}
                        </div>
                        {data.pegawai && data.pegawai.length > 0 ? (
                            <div className="space-y-2">
                                {data.pegawai.map((p, idx) => (
                                    <div key={p.id} className="flex items-center gap-4 p-3.5 rounded-2xl bg-bubblegum-50/50 border border-bubblegum-100 hover:bg-bubblegum-50 transition-colors">
                                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-bubblegum-400 to-grape-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-bubblegum-800 truncate">{p.nama_lengkap}</p>
                                            <p className="text-xs text-bubblegum-500 mt-0.5">
                                                NIP: {p.nip}
                                                {p.jabatan && <> &bull; {p.jabatan}</>}
                                                {(p.pangkat || p.golongan) && <> &bull; {[p.pangkat, p.golongan].filter(Boolean).join(' / ')}</>}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-bubblegum-300 text-center py-6">Belum ada pegawai</p>
                        )}
                    </div>

                    {/* SPD List */}
                    {/* {data.has_spd && data.surat_perjalanan_dinas && data.surat_perjalanan_dinas.length > 0 && (
                        <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-5">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                                    <FiCalendar className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">
                                    Surat Perjalanan Dinas
                                </h3>
                                <span className="ml-1 px-2.5 py-0.5 rounded-full bg-grape-100 text-grape-600 text-xs font-bold">
                                    {data.surat_perjalanan_dinas.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {data.surat_perjalanan_dinas.map((spd) => {
                                    const spdStatus = statusConfig[spd.status];
                                    const hasNomor = !!spd.nomor_spd;
                                    return (
                                        <div
                                            key={spd.id}
                                            className={`rounded-2xl border-2 p-4 transition-all ${hasNomor ? 'border-bubblegum-100 bg-white/50 hover:border-bubblegum-200' : 'border-amber-200 bg-amber-50/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-bubblegum-800 text-sm truncate">
                                                        {spd.nomor_spd || (
                                                            <span className="text-amber-600 italic flex items-center gap-1">
                                                                <FiAlertTriangle className="text-xs" /> Belum ada nomor SPD
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-bubblegum-500 mt-1">
                                                        <span className="font-medium">{spd.surat_tugas_pegawai?.nama_lengkap}</span>
                                                        {spd.surat_tugas_pegawai?.nip && <> &mdash; {spd.surat_tugas_pegawai.nip}</>}
                                                        {spd.surat_tugas_pegawai?.jabatan && <> &bull; {spd.surat_tugas_pegawai.jabatan}</>}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Link
                                                        href={`/dashboard/spd/${spd.id}`}
                                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-grape-50 text-grape-600 text-xs font-semibold hover:bg-grape-100 transition-colors border border-grape-200"
                                                    >
                                                        <FiExternalLink className="text-xs" />
                                                        {hasNomor ? 'Detail' : 'Lengkapi'}
                                                    </Link>
                                                    {spd.file_spd && (data.status === 'ditandatangani' || data.status === 'selesai') && (
                                                        <button
                                                            onClick={() => handleDownload('spd', spd.id)}
                                                            disabled={!!actionLoading}
                                                            className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors border border-sky-200 disabled:opacity-50"
                                                            title="Download SPD"
                                                        >
                                                            <FiDownload className="text-sm" />
                                                        </button>
                                                    )}
                                                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${spdStatus.bg} ${spdStatus.color} ${spdStatus.border}`}>
                                                        {spdStatus.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )} */}
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Info Surat */}
                    <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-500 to-grape-500 text-white flex items-center justify-center shadow-md">
                                <FiHash className="text-sm" />
                            </span>
                            <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Informasi Surat</h3>
                        </div>
                        <div className="space-y-3">
                            <InfoRow label="Nomor Surat" value={data.nomor_surat || '-'} />
                            <InfoRow label="Klasifikasi" value={data.klasifikasi ? `${data.klasifikasi.kode} — ${data.klasifikasi.klasifikasi}` : '-'} />
                            <InfoRow label="Kategori Surat" value={data.kategori?.nama || '-'} />
                            <InfoRow label="Instansi" value={data.instance?.name || '-'} />
                            <InfoRow label="Tempat Dikeluarkan" value={data.tempat_dikeluarkan || '-'} />
                            <InfoRow label="Tanggal Dikeluarkan" value={formatDate(data.tanggal_dikeluarkan)} />
                            {data.signed_at && (
                                <InfoRow label="Tanggal Ditandatangani" value={formatDate(data.signed_at)} />
                            )}
                            <InfoRow label="Dibuat Oleh" value={data.created_by_user?.name || '-'} />
                            <InfoRow label="Tanggal Dibuat" value={formatDate(data.created_at)} />
                        </div>
                    </div>

                    {/* Perjalanan Dinas Info */}
                    {data.has_spd && (
                        <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-candy-500 text-white flex items-center justify-center shadow-md">
                                    <FiMapPin className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Perjalanan Dinas</h3>
                            </div>
                            <div className="space-y-3">
                                <InfoRow label="Jenis" value={data.jenis_perjalanan === 'dalam_kabupaten' ? 'Perjalanan Dinas Dalam Kota' : data.jenis_perjalanan === 'luar_kabupaten' ? 'Perjalanan Dinas Biasa' : '-'} />
                                <InfoRow label="Tujuan" value={[data.lokasi_tujuan, data.tujuan_kecamatan_nama, data.tujuan_kabupaten_nama, data.tujuan_provinsi_nama].filter(Boolean).join(', ') || '-'} />
                                <InfoRow label="Berangkat" value={formatDate(data.tanggal_berangkat)} />
                                <InfoRow label="Lama" value={data.lama_perjalanan ? `${data.lama_perjalanan} hari` : '-'} />
                                <InfoRow label="Kembali" value={formatDate(data.tanggal_kembali)} />
                                <InfoRow label="Alat Angkut" value={data.alat_angkut || '-'} />
                                <InfoRow label="Biaya" value={formatCurrency(data.biaya)} />
                                {data.sub_kegiatan_kode && (
                                    <InfoRow label="Sub Kegiatan" value={`${data.sub_kegiatan_kode} — ${data.sub_kegiatan_nama || ''}`} />
                                )}
                                {data.kode_rekening && (
                                    <InfoRow label="Kode Rekening" value={`${data.kode_rekening} — ${data.uraian_rekening || ''}`} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Keterangan */}
                    {data.keterangan && (
                        <div className="glass-card rounded-3xl p-5 border border-bubblegum-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint-400 to-candy-500 text-white flex items-center justify-center shadow-md">
                                    <FiFileText className="text-sm" />
                                </span>
                                <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">Keterangan</h3>
                            </div>
                            <p className="text-sm text-bubblegum-600 whitespace-pre-wrap bg-bubblegum-50/50 rounded-2xl p-3 border border-bubblegum-100">{data.keterangan}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SPD List */}
            {data.has_spd && data.surat_perjalanan_dinas && data.surat_perjalanan_dinas.length > 0 && (
                <div className="glass-card rounded-3xl p-6 border border-bubblegum-100">
                    <div className="flex items-center gap-2 mb-5">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center shadow-md">
                            <FiCalendar className="text-sm" />
                        </span>
                        <h3 className="text-sm font-bold text-bubblegum-700 uppercase tracking-wide">
                            Surat Perjalanan Dinas
                        </h3>
                        <span className="ml-1 px-2.5 py-0.5 rounded-full bg-grape-100 text-grape-600 text-xs font-bold">
                            {data.surat_perjalanan_dinas.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {data.surat_perjalanan_dinas.map((spd) => {
                            const spdStatus = statusConfig[spd.status];
                            const hasNomor = !!spd.nomor_spd;
                            return (
                                <div
                                    key={spd.id}
                                    className={`rounded-2xl border-2 p-4 transition-all ${hasNomor ? 'border-bubblegum-100 bg-white/50 hover:border-bubblegum-200' : 'border-amber-200 bg-amber-50/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-bubblegum-800 text-sm truncate">
                                                {spd.nomor_spd || (
                                                    <span className="text-amber-600 italic flex items-center gap-1">
                                                        <FiAlertTriangle className="text-xs" /> Belum ada nomor SPD
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-bubblegum-500 mt-1">
                                                <span className="font-medium">{spd.surat_tugas_pegawai?.nama_lengkap}</span>
                                                {spd.surat_tugas_pegawai?.nip && <> &mdash; {spd.surat_tugas_pegawai.nip}</>}
                                                {spd.surat_tugas_pegawai?.jabatan && <> &bull; {spd.surat_tugas_pegawai.jabatan}</>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                href={`/dashboard/spd/${spd.id}`}
                                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-grape-50 text-grape-600 text-xs font-semibold hover:bg-grape-100 transition-colors border border-grape-200"
                                            >
                                                <FiExternalLink className="text-xs" />
                                                {hasNomor ? 'Detail' : 'Lengkapi'}
                                            </Link>
                                            {spd.file_spd && (data.status === 'ditandatangani' || data.status === 'selesai') && (
                                                <button
                                                    onClick={() => handleDownload('spd', spd.id)}
                                                    disabled={!!actionLoading}
                                                    className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors border border-sky-200 disabled:opacity-50"
                                                    title="Download SPD"
                                                >
                                                    <FiDownload className="text-sm" />
                                                </button>
                                            )}
                                            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${spdStatus.bg} ${spdStatus.color} ${spdStatus.border}`}>
                                                {spdStatus.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

/* Helper Components */
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-bubblegum-50 pb-2.5 last:border-0 last:pb-0">
            <p className="text-[10px] text-bubblegum-400 uppercase tracking-wide font-semibold">{label}</p>
            <p className="text-sm text-bubblegum-800 font-medium mt-0.5">{value}</p>
        </div>
    );
}

function DetailField({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div>
            <p className="text-[10px] text-bubblegum-400 uppercase tracking-wide">{label}</p>
            <p className={`text-sm text-bubblegum-${bold ? '800' : '700'} ${bold ? 'font-semibold' : ''}`}>{value}</p>
        </div>
    );
}
