'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX, FiFileText, FiMapPin, FiUsers, FiCornerDownLeft, FiArrowRight, FiLoader } from 'react-icons/fi';
import api from '@/lib/api';

interface SearchResultItem {
    id: number;
    type: 'surat_tugas' | 'spd' | 'pegawai';
    title: string;
    subtitle?: string;
    status?: string;
    meta?: string;
    date?: string;
    kategori?: string;
    pegawai?: string[];
    pegawai_nama?: string;
    nip?: string;
    instance?: string;
    surat_tugas_id?: number;
}

interface SearchResults {
    surat_tugas: SearchResultItem[];
    spd: SearchResultItem[];
    pegawai: SearchResultItem[];
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    menunggu: 'bg-amber-100 text-amber-700',
    diproses: 'bg-blue-100 text-blue-700',
    ditandatangani: 'bg-green-100 text-green-700',
    ditolak: 'bg-red-100 text-red-700',
    revisi: 'bg-orange-100 text-orange-700',
    selesai: 'bg-emerald-100 text-emerald-700',
};

const SECTION_CONFIG = {
    surat_tugas: { label: 'Surat Tugas', icon: FiFileText, color: 'from-bubblegum-400 to-bubblegum-500', path: '/dashboard/surat-tugas' },
    spd: { label: 'Surat Perjalanan Dinas', icon: FiMapPin, color: 'from-grape-400 to-grape-500', path: '/dashboard/spd' },
    pegawai: { label: 'Pegawai', icon: FiUsers, color: 'from-blue-400 to-blue-500', path: null },
};

export default function GlobalSearchPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Build flat list for keyboard navigation
    const flatList: SearchResultItem[] = results
        ? [...results.surat_tugas, ...results.spd, ...results.pegawai]
        : [];

    // Open/close with Ctrl+K / Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults(null);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/search', { params: { q: query.trim() } });
                if (res.data.success) {
                    setResults(res.data.data);
                    setSelectedIndex(0);
                }
            } catch {
                setResults(null);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const navigateToSearchPage = useCallback((q: string) => {
        setIsOpen(false);
        router.push(`/dashboard/search?q=${encodeURIComponent(q)}&type=all`);
    }, [router]);

    const navigateTo = useCallback((item: SearchResultItem) => {
        setIsOpen(false);
        if (item.type === 'surat_tugas') {
            router.push(`/dashboard/surat-tugas/${item.id}`);
        } else if (item.type === 'spd') {
            router.push(`/dashboard/spd/${item.id}`);
        } else if (item.type === 'pegawai') {
            router.push(`/dashboard/pegawai/${item.id}`);
        }
    }, [router]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatList.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatList[selectedIndex]) {
                navigateTo(flatList[selectedIndex]);
            } else if (query.trim().length >= 2) {
                navigateToSearchPage(query.trim());
            }
        }
    };

    // Scroll selected into view
    useEffect(() => {
        if (listRef.current) {
            const items = listRef.current.querySelectorAll('[data-search-item]');
            items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const hasResults = results && (results.surat_tugas.length > 0 || results.spd.length > 0 || results.pegawai.length > 0);
    const noResults = results && !hasResults && query.trim().length >= 2;

    let globalIdx = -1;

    const renderSection = (type: keyof typeof SECTION_CONFIG, items: SearchResultItem[]) => {
        if (!items.length) return null;
        const config = SECTION_CONFIG[type];
        const Icon = config.icon;

        return (
            <div key={type}>
                <div className="flex items-center gap-2 px-5 py-2 bg-bubblegum-50/60">
                    <Icon className="text-bubblegum-400 text-xs" />
                    <span className="text-[11px] font-bold text-bubblegum-500 uppercase tracking-wider">{config.label}</span>
                    <span className="text-[10px] text-bubblegum-300 ml-auto">{items.length} hasil</span>
                </div>
                {items.map((item) => {
                    globalIdx++;
                    const idx = globalIdx;
                    const isSelected = idx === selectedIndex;

                    return (
                        <button
                            key={`${item.type}-${item.id}`}
                            data-search-item
                            type="button"
                            onClick={() => navigateTo(item)}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                                isSelected ? 'bg-bubblegum-100/80' : 'hover:bg-bubblegum-50/60'
                            }`}
                            onMouseEnter={() => setSelectedIndex(idx)}
                        >
                            <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                                <Icon className="text-sm" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-bubblegum-800 truncate">{item.title}</p>
                                    {item.status && (
                                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {item.status}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-bubblegum-400 truncate mt-0.5">
                                    {type === 'pegawai' && item.nip && <span className="text-bubblegum-300 mr-1.5">NIP: {item.nip}</span>}
                                    {type === 'spd' && item.pegawai_nama && <span className="font-medium text-bubblegum-500 mr-1.5">{item.pegawai_nama}</span>}
                                    {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                                </p>
                                {type === 'pegawai' && item.instance && (
                                    <p className="text-[10px] text-bubblegum-300 truncate">{item.instance}</p>
                                )}
                                {type === 'surat_tugas' && item.pegawai && item.pegawai.length > 0 && (
                                    <p className="text-[10px] text-bubblegum-300 truncate mt-0.5">
                                        {item.pegawai.join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                                {item.meta && <span className="text-[10px] text-bubblegum-300">{item.meta}</span>}
                                {item.date && <span className="text-[10px] text-bubblegum-300">{item.date}</span>}
                                {isSelected && <FiArrowRight className="text-bubblegum-400 text-xs" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {/* Search trigger in header */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="header-search relative w-80 flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 border-bubblegum-100 bg-white/60 text-sm text-bubblegum-300 hover:border-bubblegum-300 hover:text-bubblegum-400 transition-all duration-300 cursor-text"
            >
                <FiSearch className="text-bubblegum-300 shrink-0" />
                <span className="flex-1 text-left">Cari SPD, Surat Tugas, Pegawai...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-bubblegum-100 text-bubblegum-400 text-[10px] font-bold border border-bubblegum-200">
                    ⌘K
                </kbd>
            </button>

            {/* Palette overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 bg-black/30 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-bubblegum-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-bubblegum-100">
                            {loading ? (
                                <FiLoader className="text-bubblegum-400 text-lg animate-spin shrink-0" />
                            ) : (
                                <FiSearch className="text-bubblegum-300 text-lg shrink-0" />
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Cari surat tugas, SPD, pegawai..."
                                className="flex-1 text-sm text-bubblegum-800 placeholder-bubblegum-300 outline-none bg-transparent"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                                    className="p-1 rounded-lg hover:bg-bubblegum-50 text-bubblegum-300 hover:text-bubblegum-500 transition-colors"
                                >
                                    <FiX className="text-sm" />
                                </button>
                            )}
                        </div>

                        {/* Results area */}
                        <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
                            {/* Empty state - no query */}
                            {!query.trim() && (
                                <div className="px-5 py-8 text-center">
                                    <FiSearch className="mx-auto text-3xl text-bubblegum-200 mb-3" />
                                    <p className="text-sm text-bubblegum-400 font-medium">Pencarian Global</p>
                                    <p className="text-xs text-bubblegum-300 mt-1">Ketik minimal 2 karakter untuk mencari di semua data</p>
                                    <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-bubblegum-300">
                                        <span className="flex items-center gap-1"><FiFileText /> Surat Tugas</span>
                                        <span className="flex items-center gap-1"><FiMapPin /> SPD</span>
                                        <span className="flex items-center gap-1"><FiUsers /> Pegawai</span>
                                    </div>
                                </div>
                            )}

                            {/* Loading shimmer */}
                            {loading && query.trim().length >= 2 && !results && (
                                <div className="px-5 py-6 space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-xl bg-bubblegum-100" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3.5 bg-bubblegum-100 rounded-full w-2/3" />
                                                <div className="h-2.5 bg-bubblegum-50 rounded-full w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* No results */}
                            {noResults && !loading && (
                                <div className="px-5 py-8 text-center">
                                    <p className="text-sm text-bubblegum-400 font-medium">Tidak ada hasil</p>
                                    <p className="text-xs text-bubblegum-300 mt-1">
                                        Coba kata kunci lain, misal: nomor surat, nama pegawai, atau tujuan
                                    </p>
                                </div>
                            )}

                            {/* Results */}
                            {hasResults && (
                                <>
                                    {renderSection('surat_tugas', results!.surat_tugas)}
                                    {renderSection('spd', results!.spd)}
                                    {renderSection('pegawai', results!.pegawai)}
                                </>
                            )}
                        </div>

                        {/* See all results link */}
                        {hasResults && query.trim().length >= 2 && (
                            <button
                                type="button"
                                onClick={() => navigateToSearchPage(query.trim())}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-bubblegum-50/60 hover:bg-bubblegum-100/60 text-sm font-medium text-bubblegum-500 hover:text-bubblegum-700 transition-colors border-t border-bubblegum-100"
                            >
                                <FiSearch className="text-xs" />
                                Lihat semua hasil untuk &quot;{query}&quot;
                                <FiArrowRight className="text-xs" />
                            </button>
                        )}

                        {/* Footer hints */}
                        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-bubblegum-100 bg-bubblegum-50/40 text-[10px] text-bubblegum-400">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 rounded bg-white border border-bubblegum-200 text-bubblegum-500 font-mono">↑↓</kbd>
                                navigasi
                            </span>
                            <span className="flex items-center gap-1">
                                <FiCornerDownLeft className="text-bubblegum-400" />
                                buka
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 rounded bg-white border border-bubblegum-200 text-bubblegum-500 font-mono">Enter</kbd>
                                semua hasil
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 rounded bg-white border border-bubblegum-200 text-bubblegum-500 font-mono">esc</kbd>
                                tutup
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
