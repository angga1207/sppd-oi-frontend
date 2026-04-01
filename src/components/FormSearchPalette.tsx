'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX, FiCornerDownLeft, FiFileText, FiMapPin, FiUsers, FiAward, FiUserCheck, FiDollarSign, FiTruck, FiExternalLink, FiHash } from 'react-icons/fi';

export interface FormField {
    id: string;          // matches the data-field-id / id on the DOM element
    label: string;       // display name
    section: string;     // section/card name
    icon: React.ComponentType<{ className?: string }>;
    keywords: string[];  // additional search terms
    spdOnly?: boolean;   // only shown when SPD is active
    /** If set, this field navigates to SPD edit page instead of scrolling */
    spdRedirect?: boolean;
}

const FORM_FIELDS: FormField[] = [
    // Kategori Surat
    { id: 'field-kategori', label: 'Kategori Surat', section: 'Kategori Surat', icon: FiFileText, keywords: ['kategori', 'jenis surat', 'tipe'] },
    // Pemberi Perintah
    { id: 'field-pemberi-perintah', label: 'Pejabat Pemberi Perintah', section: 'Pemberi Perintah', icon: FiUserCheck, keywords: ['pemberi', 'perintah', 'pejabat', 'atasan', 'bupati', 'kepala'] },
    // Informasi Surat
    { id: 'field-klasifikasi', label: 'Klasifikasi Nomor Surat', section: 'Informasi Surat', icon: FiFileText, keywords: ['klasifikasi', 'kode surat', 'nomor klasifikasi'] },
    { id: 'field-nomor-surat', label: 'Nomor Surat', section: 'Informasi Surat', icon: FiFileText, keywords: ['nomor', 'no surat', 'urut'] },
    { id: 'field-dasar', label: 'Dasar Surat Tugas', section: 'Informasi Surat', icon: FiFileText, keywords: ['dasar', 'landasan', 'surat tugas'] },
    { id: 'field-untuk', label: 'Untuk / Maksud Perjalanan', section: 'Informasi Surat', icon: FiFileText, keywords: ['untuk', 'maksud', 'tujuan surat', 'perjalanan'] },
    // SPD
    { id: 'field-spd', label: 'Surat Perjalanan Dinas (SPD)', section: 'SPD', icon: FiMapPin, keywords: ['spd', 'perjalanan dinas', 'toggle'], spdOnly: false },
    { id: 'field-jenis-perjalanan', label: 'Jenis Perjalanan Dinas', section: 'SPD', icon: FiMapPin, keywords: ['jenis', 'luar kabupaten', 'dalam kota', 'biasa', 'pd biasa', 'pd dalam kota'], spdOnly: true },
    { id: 'field-tujuan', label: 'Provinsi & Kab/Kota Tujuan', section: 'SPD', icon: FiMapPin, keywords: ['provinsi', 'kabupaten', 'kota', 'tujuan', 'daerah', 'wilayah'], spdOnly: true },
    { id: 'field-lokasi-tujuan', label: 'Lokasi Tujuan (Detail)', section: 'SPD', icon: FiMapPin, keywords: ['lokasi', 'alamat', 'tempat tujuan', 'detail'], spdOnly: true },
    { id: 'field-tanggal', label: 'Tanggal Berangkat & Lama Perjalanan', section: 'SPD', icon: FiMapPin, keywords: ['tanggal', 'berangkat', 'kembali', 'lama', 'durasi', 'hari'], spdOnly: true },
    { id: 'field-transport', label: 'Alat Angkut & Biaya', section: 'SPD', icon: FiTruck, keywords: ['alat angkut', 'kendaraan', 'biaya', 'transport', 'ongkos', 'rupiah'], spdOnly: true },
    { id: 'field-mata-anggaran', label: 'Mata Anggaran (Sub Kegiatan & Kode Rekening)', section: 'SPD', icon: FiDollarSign, keywords: ['mata anggaran', 'sub kegiatan', 'kode rekening', 'sicaram', 'anggaran', 'rekening', 'kegiatan'], spdOnly: true },
    // Pegawai
    { id: 'field-pegawai', label: 'Pegawai yang Ditugaskan', section: 'Pegawai', icon: FiUsers, keywords: ['pegawai', 'staf', 'petugas', 'ditugaskan', 'pns'] },
    // Penandatangan
    { id: 'field-penandatangan', label: 'Penandatangan & Info Tambahan', section: 'Penandatangan', icon: FiAward, keywords: ['penandatangan', 'tanda tangan', 'ttd', 'instansi'] },
    { id: 'field-tempat-tanggal', label: 'Tempat & Tanggal Dikeluarkan', section: 'Penandatangan', icon: FiAward, keywords: ['tempat', 'tanggal', 'dikeluarkan', 'indralaya'] },
    { id: 'field-keterangan', label: 'Keterangan', section: 'Penandatangan', icon: FiAward, keywords: ['keterangan', 'catatan', 'tambahan', 'note'] },
];

/** SPD-specific fields that redirect to the SPD edit page */
const SPD_REDIRECT_FIELDS: FormField[] = [
    { id: 'spd-nomor', label: 'Nomor SPD', section: 'Detail SPD', icon: FiHash, keywords: ['nomor spd', 'no spd', 'nomor surat perjalanan'], spdOnly: true, spdRedirect: true },
    { id: 'spd-tingkat-biaya', label: 'Tingkat Biaya Perjalanan Dinas', section: 'Detail SPD', icon: FiDollarSign, keywords: ['tingkat biaya', 'golongan', 'eselon', 'biaya perjalanan', 'tingkat'], spdOnly: true, spdRedirect: true },
    { id: 'spd-pengikut', label: 'Pengikut Perjalanan Dinas', section: 'Detail SPD', icon: FiUsers, keywords: ['pengikut', 'pendamping', 'ikut', 'keluarga'], spdOnly: true, spdRedirect: true },
];

export interface SpdInfo {
    id: any;
    nomor_spd: string | null;
    pegawai_nama: string | null;
}

interface FormSearchPaletteProps {
    hasSPD: boolean;
    spdList?: SpdInfo[];
}

export default function FormSearchPalette({ hasSPD, spdList = [] }: FormSearchPaletteProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showSpdPicker, setShowSpdPicker] = useState(false);
    const [pendingSpdField, setPendingSpdField] = useState<FormField | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const allFields = useMemo(() => {
        return [...FORM_FIELDS, ...(hasSPD ? SPD_REDIRECT_FIELDS : [])];
    }, [hasSPD]);

    const filteredFields = useMemo(() => {
        const available = allFields.filter(f => !f.spdOnly || hasSPD);
        if (!query.trim()) return available;
        const lower = query.toLowerCase();
        return available.filter(f =>
            f.label.toLowerCase().includes(lower) ||
            f.section.toLowerCase().includes(lower) ||
            f.keywords.some(k => k.includes(lower))
        );
    }, [query, hasSPD, allFields]);

    // Group by section
    const grouped = useMemo(() => {
        const map = new Map<string, FormField[]>();
        for (const f of filteredFields) {
            const group = map.get(f.section) || [];
            group.push(f);
            map.set(f.section, group);
        }
        return map;
    }, [filteredFields]);

    // Flat list for keyboard nav
    const flatList = useMemo(() => filteredFields, [filteredFields]);

    useEffect(() => { setSelectedIndex(0); }, [query]);

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                if (showSpdPicker) {
                    setShowSpdPicker(false);
                    setPendingSpdField(null);
                } else if (isOpen) {
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, showSpdPicker]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setShowSpdPicker(false);
            setPendingSpdField(null);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const scrollToField = useCallback((fieldId: string) => {
        setIsOpen(false);
        const el = document.getElementById(fieldId);
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight animation
        el.classList.add('ring-2', 'ring-bubblegum-400', 'ring-offset-2', 'transition-all');
        setTimeout(() => {
            el.classList.remove('ring-2', 'ring-bubblegum-400', 'ring-offset-2', 'transition-all');
        }, 2000);

        // Try to focus first input inside
        setTimeout(() => {
            const input = el.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable]');
            if (input) input.focus();
        }, 400);
    }, []);

    const navigateToSpd = useCallback((spdId: number) => {
        setIsOpen(false);
        setShowSpdPicker(false);
        setPendingSpdField(null);
        router.push(`/dashboard/spd/${spdId}`);
    }, [router]);

    const handleFieldSelect = useCallback((field: FormField) => {
        if (field.spdRedirect) {
            // Navigate to SPD edit page
            if (spdList.length === 1) {
                navigateToSpd(spdList[0].id);
            } else if (spdList.length > 1) {
                setPendingSpdField(field);
                setShowSpdPicker(true);
            }
            return;
        }
        scrollToField(field.id);
    }, [spdList, navigateToSpd, scrollToField]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatList.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && flatList[selectedIndex]) {
            e.preventDefault();
            handleFieldSelect(flatList[selectedIndex]);
        }
    };

    // Ensure selected item is visible
    useEffect(() => {
        if (listRef.current) {
            const items = listRef.current.querySelectorAll('[data-search-item]');
            items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    let flatIdx = -1;

    return (
        <>
            {/* Search trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/60 border-2 border-bubblegum-200 text-bubblegum-400 hover:border-bubblegum-400 hover:text-bubblegum-600 hover:bg-white/80 transition-all text-sm group w-full sm:w-auto"
            >
                <FiSearch className="text-base shrink-0" />
                <span className="flex-1 text-left">Cari inputan formulir...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-bubblegum-100 text-bubblegum-500 text-[10px] font-bold border border-bubblegum-200 group-hover:bg-bubblegum-200 transition-colors">
                    ⌘K
                </kbd>
            </button>

            {/* Palette overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/30 backdrop-blur-sm" onClick={() => { setIsOpen(false); setShowSpdPicker(false); }}>
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-bubblegum-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* SPD Picker sub-view */}
                        {showSpdPicker && pendingSpdField ? (
                            <>
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-bubblegum-100 bg-grape-50/50">
                                    <button
                                        type="button"
                                        onClick={() => { setShowSpdPicker(false); setPendingSpdField(null); }}
                                        className="p-1.5 rounded-xl hover:bg-white/60 text-bubblegum-400 hover:text-bubblegum-600 transition-colors"
                                    >
                                        <FiX className="text-base" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-bubblegum-800">Pilih SPD</p>
                                        <p className="text-xs text-bubblegum-400 truncate">
                                            Untuk mengedit: {pendingSpdField.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="max-h-[50vh] overflow-y-auto py-2">
                                    {spdList.map((spd, idx) => (
                                        <button
                                            key={spd.id}
                                            type="button"
                                            onClick={() => navigateToSpd(spd.id)}
                                            className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-bubblegum-50 transition-colors"
                                        >
                                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-400 to-bubblegum-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-bubblegum-800 truncate">
                                                    {spd.pegawai_nama || `SPD #${idx + 1}`}
                                                </p>
                                                <p className="text-xs text-bubblegum-400 mt-0.5">
                                                    {spd.nomor_spd || 'Belum ada nomor SPD'}
                                                </p>
                                            </div>
                                            <FiExternalLink className="text-bubblegum-300 text-sm shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Search input */}
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-bubblegum-100">
                                    <FiSearch className="text-lg text-bubblegum-400 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ketik nama inputan... (misal: Mata Anggaran, Tingkat Biaya)"
                                        className="flex-1 text-sm text-bubblegum-800 placeholder:text-bubblegum-300 focus:outline-none bg-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 rounded-xl hover:bg-bubblegum-50 text-bubblegum-400 hover:text-bubblegum-600 transition-colors"
                                    >
                                        <FiX className="text-base" />
                                    </button>
                                </div>

                                {/* Results */}
                                <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                                    {flatList.length === 0 ? (
                                        <div className="px-5 py-8 text-center">
                                            <FiSearch className="text-3xl text-bubblegum-200 mx-auto mb-2" />
                                            <p className="text-sm text-bubblegum-400 font-medium">Tidak ditemukan</p>
                                            <p className="text-xs text-bubblegum-300 mt-0.5">Coba kata kunci lain</p>
                                        </div>
                                    ) : (
                                        Array.from(grouped.entries()).map(([section, fields]) => (
                                            <div key={section}>
                                                <p className="px-5 py-1.5 text-[10px] font-bold text-bubblegum-400 uppercase tracking-wider">{section}</p>
                                                {fields.map(field => {
                                                    flatIdx++;
                                                    const idx = flatIdx;
                                                    const isSelected = idx === selectedIndex;
                                                    const Icon = field.icon;
                                                    return (
                                                        <button
                                                            key={field.id}
                                                            data-search-item
                                                            type="button"
                                                            onClick={() => handleFieldSelect(field)}
                                                            onMouseEnter={() => setSelectedIndex(idx)}
                                                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                                                                isSelected ? 'bg-bubblegum-50' : 'hover:bg-bubblegum-50/50'
                                                            }`}
                                                        >
                                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                                isSelected
                                                                    ? 'bg-gradient-to-br from-bubblegum-500 to-grape-500 text-white shadow-md'
                                                                    : 'bg-bubblegum-100 text-bubblegum-500'
                                                            }`}>
                                                                <Icon className="text-sm" />
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-bubblegum-800' : 'text-bubblegum-700'}`}>
                                                                    {field.label}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {field.spdOnly && (
                                                                        <span className="text-[10px] text-grape-500 font-semibold">SPD</span>
                                                                    )}
                                                                    {field.spdRedirect && (
                                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-candy-600 font-semibold">
                                                                            <FiExternalLink className="text-[9px]" /> Halaman SPD
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bubblegum-100 text-bubblegum-500 text-[10px] font-bold shrink-0">
                                                                    {field.spdRedirect ? <FiExternalLink className="text-[10px]" /> : <FiCornerDownLeft className="text-[10px]" />}
                                                                    {field.spdRedirect ? 'Buka' : 'Enter'}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer hint */}
                                <div className="px-5 py-2.5 border-t border-bubblegum-100 bg-bubblegum-50/30 flex items-center gap-4 text-[10px] text-bubblegum-400 font-medium">
                                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-bubblegum-100 border border-bubblegum-200 font-bold">↑↓</kbd> Navigasi</span>
                                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-bubblegum-100 border border-bubblegum-200 font-bold">Enter</kbd> Pilih</span>
                                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-bubblegum-100 border border-bubblegum-200 font-bold">Esc</kbd> Tutup</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
