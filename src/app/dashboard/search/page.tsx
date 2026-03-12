'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    FiSearch, FiFileText, FiMapPin, FiUsers, FiArrowLeft,
    FiExternalLink, FiCalendar, FiLoader, FiZap, FiFilter,
    FiChevronRight
} from 'react-icons/fi';
import api from '@/lib/api';

interface SearchResultItem {
    id: number;
    type: 'surat_tugas' | 'spd' | 'pegawai';
    title: string;
    subtitle?: string;
    dasar?: string;
    status?: string;
    meta?: string;
    lokasi_tujuan?: string;
    date?: string;
    date_end?: string;
    kategori?: string;
    pegawai?: string[];
    pegawai_nama?: string;
    pegawai_nip?: string;
    pegawai_jabatan?: string;
    nip?: string;
    instance?: string;
    foto?: string;
    penandatangan?: string;
    surat_tugas_id?: number;
    tingkat_biaya?: string;
    pangkat?: string;
    golongan?: string;
    eselon?: string;
    created_at?: string;
}

interface FullSearchResponse {
    success: boolean;
    data: {
        surat_tugas?: SearchResultItem[];
        spd?: SearchResultItem[];
        pegawai?: SearchResultItem[];
    };
    counts: Record<string, number>;
    total: number;
    ai_summary: string;
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

const TAB_CONFIG = [
    { key: 'all', label: 'Semua', icon: FiSearch },
    { key: 'surat_tugas', label: 'Surat Tugas', icon: FiFileText },
    { key: 'spd', label: 'SPD', icon: FiMapPin },
    { key: 'pegawai', label: 'Pegawai', icon: FiUsers },
];

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialType = searchParams.get('type') || 'all';

    const [query, setQuery] = useState(initialQuery);
    const [inputValue, setInputValue] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState(initialType);
    const [results, setResults] = useState<FullSearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiExpanded, setAiExpanded] = useState(true);

    const doSearch = useCallback(async (q: string, type: string) => {
        if (q.trim().length < 2) return;
        setLoading(true);
        try {
            const res = await api.get('/search/full', { params: { q: q.trim(), type } });
            if (res.data.success) {
                setResults(res.data);
            }
        } catch {
            setResults(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialQuery.trim().length >= 2) {
            doSearch(initialQuery, initialType);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim().length < 2) return;
        setQuery(inputValue.trim());
        router.replace(`/dashboard/search?q=${encodeURIComponent(inputValue.trim())}&type=${activeTab}`);
        doSearch(inputValue.trim(), activeTab);
    };

    const handleTabChange = (type: string) => {
        setActiveTab(type);
        if (query.trim().length >= 2) {
            router.replace(`/dashboard/search?q=${encodeURIComponent(query)}&type=${type}`);
            doSearch(query, type);
        }
    };

    const getItemLink = (item: SearchResultItem) => {
        if (item.type === 'surat_tugas') return `/dashboard/surat-tugas/${item.id}`;
        if (item.type === 'spd') return `/dashboard/spd/${item.id}`;
        return `/dashboard/pegawai/${item.id}`;
    };

    const allItems: SearchResultItem[] = results
        ? [
            ...(results.data.surat_tugas || []),
            ...(results.data.spd || []),
            ...(results.data.pegawai || []),
        ]
        : [];

    // Parse markdown bold
    const renderMarkdown = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-bubblegum-700">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const highlightMatch = (text: string | undefined) => {
        if (!text || !query) return text || '';
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-bubblegum-200/60 text-bubblegum-800 rounded px-0.5">{part}</mark>
                : <span key={i}>{part}</span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-bubblegum-400 hover:text-bubblegum-600 transition-colors mb-4"
                >
                    <FiArrowLeft className="text-xs" /> Kembali
                </button>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="relative">
                    <div className="flex items-center gap-3 px-5 py-4 rounded-3xl bg-white border-2 border-bubblegum-100 shadow-lg shadow-bubblegum-100/30 focus-within:border-bubblegum-300 transition-all">
                        <FiSearch className="text-bubblegum-300 text-xl shrink-0" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="Cari surat tugas, SPD, pegawai..."
                            className="flex-1 text-base text-bubblegum-800 placeholder-bubblegum-300 outline-none bg-transparent"
                            autoFocus
                        />
                        {loading && <FiLoader className="text-bubblegum-400 animate-spin" />}
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-2xl bg-bubblegum-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-bubblegum-300/30"
                        >
                            Cari
                        </button>
                    </div>
                </form>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 p-1 rounded-2xl bg-white/60 border border-bubblegum-100 w-fit">
                {TAB_CONFIG.map(tab => {
                    const isActive = activeTab === tab.key;
                    const count = tab.key === 'all'
                        ? results?.total
                        : results?.counts?.[tab.key];
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'bg-bubblegum-gradient text-white shadow-md shadow-bubblegum-300/30'
                                : 'text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-50'
                                }`}
                        >
                            <Icon className="text-xs" />
                            {tab.label}
                            {count !== undefined && count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-bubblegum-100 text-bubblegum-500'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* AI Summary */}
            {results?.ai_summary && (
                <div className="mb-6 rounded-2xl border border-grape-200 bg-gradient-to-r from-grape-50 to-bubblegum-50 overflow-hidden">
                    <button
                        onClick={() => setAiExpanded(!aiExpanded)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left"
                    >
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-400 to-bubblegum-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <FiZap className="text-sm" />
                        </span>
                        <span className="flex-1 text-sm font-semibold text-grape-700">Ringkasan AI</span>
                        <FiChevronRight className={`text-grape-400 transition-transform ${aiExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {aiExpanded && (
                        <div className="px-5 pb-4 -mt-1">
                            <p className="text-sm text-grape-600 leading-relaxed pl-11">
                                {renderMarkdown(results.ai_summary)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {loading && !results && (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-2xl bg-white border border-bubblegum-100 p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-bubblegum-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-bubblegum-100 rounded-full w-1/3" />
                                    <div className="h-3 bg-bubblegum-50 rounded-full w-2/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {results && allItems.length === 0 && !loading && (
                <div className="rounded-2xl bg-white border border-bubblegum-100 p-12 text-center">
                    <FiSearch className="mx-auto text-4xl text-bubblegum-200 mb-4" />
                    <p className="text-lg font-semibold text-bubblegum-600">Tidak ada hasil</p>
                    <p className="text-sm text-bubblegum-300 mt-2">
                        Tidak ditemukan data untuk &quot;{query}&quot;. Coba kata kunci yang berbeda.
                    </p>
                </div>
            )}

            {/* Surat Tugas Results */}
            {(activeTab === 'all' || activeTab === 'surat_tugas') && results?.data?.surat_tugas && results.data.surat_tugas.length > 0 && (
                <div className="mb-8">
                    {activeTab === 'all' && (
                        <div className="flex items-center gap-2 mb-3">
                            <FiFileText className="text-bubblegum-400" />
                            <h2 className="text-sm font-bold text-bubblegum-600 uppercase tracking-wider">Surat Tugas</h2>
                            <span className="text-xs text-bubblegum-300">({results.data.surat_tugas.length})</span>
                        </div>
                    )}
                    <div className="space-y-3">
                        {results.data.surat_tugas.map(item => (
                            <Link
                                key={`st-${item.id}`}
                                href={getItemLink(item)}
                                className="block rounded-2xl bg-white border border-bubblegum-100 p-5 hover:border-bubblegum-300 hover:shadow-lg hover:shadow-bubblegum-100/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-bubblegum-400 to-bubblegum-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <FiFileText />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-bubblegum-800 group-hover:text-bubblegum-600 transition-colors">
                                                {highlightMatch(item.title)}
                                            </h3>
                                            {item.status && (
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {item.status}
                                                </span>
                                            )}
                                            {item.kategori && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bubblegum-50 text-bubblegum-500 border border-bubblegum-100">
                                                    {item.kategori}
                                                </span>
                                            )}
                                        </div>
                                        {item.subtitle && (
                                            <p className="text-sm text-bubblegum-500 mt-1 line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: item.subtitle }}
                                            >
                                                {/* {highlightMatch(item.subtitle)} */}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-bubblegum-300 flex-wrap">
                                            {item.meta && (
                                                <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {highlightMatch(item.meta)}</span>
                                            )}
                                            {item.date && (
                                                <span className="flex items-center gap-1"><FiCalendar className="text-[10px]" /> {item.date}{item.date_end ? ` — ${item.date_end}` : ''}</span>
                                            )}
                                            {item.penandatangan && (
                                                <span>Penandatangan: {highlightMatch(item.penandatangan)}</span>
                                            )}
                                        </div>
                                        {item.pegawai && item.pegawai.length > 0 && (
                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                <FiUsers className="text-bubblegum-300 text-[10px]" />
                                                {item.pegawai.map((p, i) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-bubblegum-50 text-bubblegum-500 border border-bubblegum-100">
                                                        {highlightMatch(p)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <FiExternalLink className="text-bubblegum-200 group-hover:text-bubblegum-400 transition-colors shrink-0 mt-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* SPD Results */}
            {(activeTab === 'all' || activeTab === 'spd') && results?.data?.spd && results.data.spd.length > 0 && (
                <div className="mb-8">
                    {activeTab === 'all' && (
                        <div className="flex items-center gap-2 mb-3">
                            <FiMapPin className="text-grape-400" />
                            <h2 className="text-sm font-bold text-grape-600 uppercase tracking-wider">Surat Perjalanan Dinas</h2>
                            <span className="text-xs text-grape-300">({results.data.spd.length})</span>
                        </div>
                    )}
                    <div className="space-y-3">
                        {results.data.spd.map(item => (
                            <Link
                                key={`spd-${item.id}`}
                                href={getItemLink(item)}
                                className="block rounded-2xl bg-white border border-bubblegum-100 p-5 hover:border-grape-300 hover:shadow-lg hover:shadow-grape-100/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-grape-400 to-grape-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <FiMapPin />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-bubblegum-800 group-hover:text-grape-600 transition-colors">
                                                {highlightMatch(item.title)}
                                            </h3>
                                            {item.status && (
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        {item.pegawai_nama && (
                                            <p className="text-sm font-medium text-grape-600 mt-1">{highlightMatch(item.pegawai_nama)}
                                                {item.pegawai_jabatan && <span className="font-normal text-bubblegum-400 ml-1.5">— {item.pegawai_jabatan}</span>}
                                            </p>
                                        )}
                                        {item.subtitle && (
                                            <p className="text-xs text-bubblegum-400 mt-1 line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: item.subtitle }}>
                                                {/* {highlightMatch(item.subtitle)} */}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-bubblegum-300 flex-wrap">
                                            {item.meta && (
                                                <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {item.meta}</span>
                                            )}
                                            {item.date && (
                                                <span className="flex items-center gap-1"><FiCalendar className="text-[10px]" /> {item.date}{item.date_end ? ` — ${item.date_end}` : ''}</span>
                                            )}
                                            {item.tingkat_biaya && (
                                                <span>Tingkat: {item.tingkat_biaya}</span>
                                            )}
                                        </div>
                                    </div>
                                    <FiExternalLink className="text-bubblegum-200 group-hover:text-grape-400 transition-colors shrink-0 mt-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Pegawai Results */}
            {(activeTab === 'all' || activeTab === 'pegawai') && results?.data?.pegawai && results.data.pegawai.length > 0 && (
                <div className="mb-8">
                    {activeTab === 'all' && (
                        <div className="flex items-center gap-2 mb-3">
                            <FiUsers className="text-blue-400" />
                            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Pegawai</h2>
                            <span className="text-xs text-blue-300">({results.data.pegawai.length})</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {results.data.pegawai.map(item => (
                            <Link
                                key={`peg-${item.id}`}
                                href={getItemLink(item)}
                                className="block rounded-2xl bg-white border border-bubblegum-100 p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <FiUsers />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-bubblegum-800 group-hover:text-blue-600 transition-colors truncate">
                                            {highlightMatch(item.title)}
                                        </h3>
                                        {item.nip && (
                                            <p className="text-xs text-bubblegum-300">NIP: {highlightMatch(item.nip)}</p>
                                        )}
                                        {item.subtitle && (
                                            <p className="text-xs text-bubblegum-400 truncate">{highlightMatch(item.subtitle)}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-bubblegum-300 flex-wrap">
                                            {item.instance && <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">{item.instance}</span>}
                                            {item.golongan && <span>Gol. {item.golongan}</span>}
                                            {item.pangkat && <span>{item.pangkat}</span>}
                                        </div>
                                    </div>
                                    <FiExternalLink className="text-bubblegum-200 group-hover:text-blue-400 transition-colors shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer info */}
            {results && allItems.length > 0 && (
                <div className="text-center py-4 text-xs text-bubblegum-300">
                    <FiFilter className="inline mr-1" />
                    Menampilkan {allItems.length} hasil untuk &quot;{query}&quot;
                    {activeTab !== 'all' && ` — filter: ${TAB_CONFIG.find(t => t.key === activeTab)?.label}`}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="max-w-5xl mx-auto">
                <div className="rounded-3xl bg-white border-2 border-bubblegum-100 shadow-lg p-5 mb-6 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-bubblegum-100" />
                        <div className="flex-1 h-5 bg-bubblegum-100 rounded-full" />
                    </div>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
