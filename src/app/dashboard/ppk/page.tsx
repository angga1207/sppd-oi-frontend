'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiUserCheck, FiSearch, FiPlus, FiEdit2, FiTrash2,
    FiRefreshCw, FiCheck, FiX, FiStar,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import SearchableSelect, { SelectOption } from '@/components/SearchableSelect';
import type { Instance, PejabatPembuatKomitmen } from '@/lib/types';

interface PpkFormData {
    instance_id: number | null;
    nama: string;
    nip: string;
    jabatan: string;
    pangkat: string;
    golongan: string;
    is_active: boolean;
}

const emptyForm: PpkFormData = {
    instance_id: null,
    nama: '',
    nip: '',
    jabatan: '',
    pangkat: '',
    golongan: '',
    is_active: true,
};

export default function PpkManagementPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isSuperAdmin = user?.role?.slug === 'super-admin';

    const [items, setItems] = useState<PejabatPembuatKomitmen[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterInstance, setFilterInstance] = useState<number | null>(null);

    // Instances for filter & form
    const [instances, setInstances] = useState<Instance[]>([]);
    const [instancesLoading, setInstancesLoading] = useState(false);

    // Form modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<PpkFormData>({ ...emptyForm });
    const [editId, setEditId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Pegawai search for PPK selection
    const [showPegawaiModal, setShowPegawaiModal] = useState(false);
    const [pegawaiSearchTerm, setPegawaiSearchTerm] = useState('');
    const [pegawaiResults, setPegawaiResults] = useState<Array<{
        id: number; nip: string; nama_lengkap: string;
        jabatan: string | null; pangkat: string | null; golongan: string | null;
        id_skpd: number;
    }>>([]);
    const [pegawaiLoading, setPegawaiLoading] = useState(false);
    const [pegawaiSkpd, setPegawaiSkpd] = useState<number | null>(null);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Setting active
    const [activatingId, setActivatingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {};
            if (search) params.search = search;
            if (filterInstance) params.instance_id = filterInstance;

            const res = await api.get('/ppk', { params });
            setItems(res.data.data || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [search, filterInstance]);

    const loadInstances = useCallback(async () => {
        setInstancesLoading(true);
        try {
            const res = await api.get('/instances');
            setInstances(res.data.data || []);
        } catch {
            // ignore
        } finally {
            setInstancesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isSuperAdmin) {
            router.replace('/dashboard');
            return;
        }
        loadInstances();
    }, [isSuperAdmin, router, loadInstances]);

    useEffect(() => {
        if (isSuperAdmin) fetchData();
    }, [fetchData, isSuperAdmin]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Pegawai search
    const searchPegawai = useCallback(async () => {
        setPegawaiLoading(true);
        try {
            const params: Record<string, string | number> = { search: pegawaiSearchTerm };
            if (pegawaiSkpd) {
                // Resolve id_eoffice (Semesta external ID) from the selected internal instance_id
                const selectedInstance = instances.find(i => i.id === pegawaiSkpd);
                const idEoffice = selectedInstance?.id_eoffice;
                if (idEoffice) params.id_skpd = idEoffice;
            }
            const res = await api.get('/pegawai', { params });
            setPegawaiResults(res.data.data || []);
        } catch {
            // ignore
        } finally {
            setPegawaiLoading(false);
        }
    }, [pegawaiSearchTerm, pegawaiSkpd, instances]);

    // Re-fetch when search term changes
    useEffect(() => {
        const timer = setTimeout(searchPegawai, 400);
        return () => clearTimeout(timer);
    }, [pegawaiSearchTerm, searchPegawai]);

    // Auto-load list when OPD changes or modal opens
    useEffect(() => {
        if (showPegawaiModal && pegawaiSkpd) {
            searchPegawai();
        }
    }, [pegawaiSkpd, showPegawaiModal]); // eslint-disable-line react-hooks/exhaustive-deps

    // Open form for create
    const openCreate = () => {
        setForm({ ...emptyForm });
        setEditId(null);
        setFormError('');
        setShowModal(true);
    };

    // Open form for edit
    const openEdit = (ppk: PejabatPembuatKomitmen) => {
        setForm({
            instance_id: ppk.instance_id,
            nama: ppk.nama,
            nip: ppk.nip,
            jabatan: ppk.jabatan || '',
            pangkat: ppk.pangkat || '',
            golongan: ppk.golongan || '',
            is_active: ppk.is_active,
        });
        setEditId(ppk.id);
        setFormError('');
        setShowModal(true);
    };

    // Select pegawai from semesta
    const selectPegawai = (p: typeof pegawaiResults[0]) => {
        setForm(prev => ({
            ...prev,
            nama: p.nama_lengkap,
            nip: p.nip,
            jabatan: p.jabatan || '',
            pangkat: p.pangkat || '',
            golongan: p.golongan || '',
        }));
        setShowPegawaiModal(false);
        setPegawaiSearchTerm('');
        setPegawaiResults([]);
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.instance_id) {
            setFormError('Pilih OPD terlebih dahulu.');
            return;
        }
        if (!form.nama.trim() || !form.nip.trim()) {
            setFormError('Nama dan NIP wajib diisi.');
            return;
        }

        setSaving(true);
        setFormError('');
        try {
            if (editId) {
                await api.put(`/ppk/${editId}`, form);
            } else {
                await api.post('/ppk', form);
            }
            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setFormError(axiosErr?.response?.data?.message || 'Gagal menyimpan PPK.');
        } finally {
            setSaving(false);
        }
    };

    // Delete PPK
    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/ppk/${deleteId}`);
            setDeleteId(null);
            fetchData();
        } catch {
            // ignore
        } finally {
            setDeleting(false);
        }
    };

    // Set active
    const handleSetActive = async (id: number) => {
        setActivatingId(id);
        try {
            await api.post(`/ppk/${id}/set-active`);
            fetchData();
        } catch {
            // ignore
        } finally {
            setActivatingId(null);
        }
    };

    // Instance options for SearchableSelect
    const instanceOptions: SelectOption[] = instances.map(i => ({
        value: i.id,
        label: i.name,
    }));

    if (!isSuperAdmin) return null;

    // Group items by instance
    const groupedByInstance = items.reduce((acc, ppk) => {
        const instanceName = ppk.instance?.name || 'Unknown OPD';
        if (!acc[instanceName]) acc[instanceName] = [];
        acc[instanceName].push(ppk);
        return acc;
    }, {} as Record<string, PejabatPembuatKomitmen[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-bubblegum-800 flex items-center gap-2">
                        <FiUserCheck className="text-bubblegum-500" />
                        Master Pejabat Pembuat Komitmen
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola PPK untuk setiap OPD. PPK aktif akan otomatis terisi pada pembuatan surat.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <FiRefreshCw className={`text-base ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bubblegum-500 text-white rounded-xl hover:bg-bubblegum-600 transition-colors shadow-sm"
                    >
                        <FiPlus /> Tambah PPK
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-bubblegum-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, NIP, atau jabatan..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                        />
                    </div>
                    {/* Instance filter */}
                    <SearchableSelect
                        options={instanceOptions}
                        value={filterInstance ? instanceOptions.find(o => o.value === filterInstance) || null : null}
                        onChange={(opt) => setFilterInstance(opt ? Number(opt.value) : null)}
                        placeholder="Filter OPD..."
                        isClearable
                        isLoading={instancesLoading}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-bubblegum-100 p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bubblegum-500 mx-auto"></div>
                    <p className="mt-3 text-sm text-gray-500">Memuat data PPK...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-bubblegum-100 p-12 text-center">
                    <FiUserCheck className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">Belum ada data PPK.</p>
                    <p className="text-sm text-gray-400 mt-1">Klik &quot;Tambah PPK&quot; untuk menambahkan.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedByInstance).sort(([a], [b]) => a.localeCompare(b)).map(([instanceName, ppkList]) => (
                        <div key={instanceName} className="bg-white rounded-2xl shadow-sm border border-bubblegum-100 overflow-hidden">
                            <div className="bg-bubblegum-50 px-5 py-3 border-b border-bubblegum-100">
                                <h3 className="font-semibold text-bubblegum-800 text-sm">{instanceName}</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {ppkList.map(ppk => (
                                    <div key={ppk.id} className="px-5 py-4 flex items-center gap-4">
                                        {/* Status badge */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${ppk.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {ppk.is_active ? <FiStar className="text-sm" /> : <FiX className="text-sm" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800 text-sm truncate">{ppk.nama}</p>
                                                {ppk.is_active && (
                                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">AKTIF</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                NIP: {ppk.nip}
                                                {ppk.jabatan && ` · ${ppk.jabatan}`}
                                            </p>
                                            {(ppk.pangkat || ppk.golongan) && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {[ppk.pangkat, ppk.golongan].filter(Boolean).join(' / ')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {!ppk.is_active && (
                                                <button
                                                    onClick={() => handleSetActive(ppk.id)}
                                                    disabled={activatingId === ppk.id}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                                                    title="Set sebagai PPK Aktif"
                                                >
                                                    {activatingId === ppk.id ? (
                                                        <FiRefreshCw className="animate-spin" />
                                                    ) : (
                                                        <FiCheck />
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEdit(ppk)}
                                                className="p-2 text-bubblegum-600 hover:bg-bubblegum-50 rounded-lg transition-colors text-sm"
                                                title="Edit"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(ppk.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                                title="Hapus"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-bubblegum-800">
                                {editId ? 'Edit PPK' : 'Tambah PPK Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{formError}</div>
                            )}

                            {/* OPD Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">OPD / Instansi <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={instanceOptions}
                                    value={form.instance_id ? instanceOptions.find(o => o.value === form.instance_id) || null : null}
                                    onChange={(opt) => {
                                        const newInstanceId = opt ? Number(opt.value) : null;
                                        setForm(prev => ({ ...prev, instance_id: newInstanceId }));
                                        // Keep pegawaiSkpd in sync so cari pegawai uses the correct OPD
                                        setPegawaiSkpd(newInstanceId);
                                    }}
                                    placeholder="Pilih OPD..."
                                    isLoading={instancesLoading}
                                />
                            </div>

                            {/* Cari Pegawai Button */}
                            <div>
                                <button
                                    type="button"
                                    disabled={!form.instance_id}
                                    onClick={() => {
                                        setPegawaiSkpd(form.instance_id);
                                        setShowPegawaiModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-bubblegum-50 text-bubblegum-700 rounded-xl hover:bg-bubblegum-100 border border-bubblegum-200 transition-colors w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <FiSearch /> {form.instance_id ? 'Cari Pegawai dari Semesta' : 'Pilih OPD dulu untuk cari pegawai'}
                                </button>
                            </div>

                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.nama}
                                    onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                                    placeholder="Nama lengkap PPK"
                                    required
                                />
                            </div>

                            {/* NIP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIP <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.nip}
                                    onChange={(e) => setForm(prev => ({ ...prev, nip: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                                    placeholder="NIP PPK"
                                    required
                                />
                            </div>

                            {/* Jabatan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                <input
                                    type="text"
                                    value={form.jabatan}
                                    onChange={(e) => setForm(prev => ({ ...prev, jabatan: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                                    placeholder="Jabatan PPK"
                                />
                            </div>

                            {/* Pangkat & Golongan */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat</label>
                                    <input
                                        type="text"
                                        value={form.pangkat}
                                        onChange={(e) => setForm(prev => ({ ...prev, pangkat: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                                        placeholder="Pangkat"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Golongan</label>
                                    <input
                                        type="text"
                                        value={form.golongan}
                                        onChange={(e) => setForm(prev => ({ ...prev, golongan: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                                        placeholder="Golongan"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                                <span className="text-sm text-gray-700">PPK Aktif</span>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-medium bg-bubblegum-500 text-white rounded-xl hover:bg-bubblegum-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                                    {editId ? 'Simpan Perubahan' : 'Tambah PPK'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pegawai Search Modal */}
            {showPegawaiModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-bubblegum-800">Cari Pegawai</h3>
                            <button onClick={() => { setShowPegawaiModal(false); setPegawaiSearchTerm(''); setPegawaiResults([]); }} className="p-1 text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-100 space-y-3">
                            {/* <SearchableSelect
                                options={instanceOptions}
                                value={pegawaiSkpd ? instanceOptions.find(o => o.value === pegawaiSkpd) || null : null}
                                onChange={(opt) => setPegawaiSkpd(opt ? Number(opt.value) : null)}
                                placeholder="Filter OPD..."
                                isClearable
                                isLoading={instancesLoading}
                            /> */}
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Ketik nama atau NIP pegawai..."
                                    value={pegawaiSearchTerm}
                                    onChange={(e) => setPegawaiSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-bubblegum-300 focus:border-bubblegum-400 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {pegawaiLoading ? (
                                <div className="py-8 text-center text-sm text-gray-400">Mencari...</div>
                            ) : pegawaiResults.length === 0 ? (
                                <div className="py-8 text-center text-sm text-gray-400">
                                    {pegawaiSearchTerm.length >= 2 ? 'Tidak ditemukan.' : 'Ketik minimal 2 karakter untuk mencari.'}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {pegawaiResults.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => selectPegawai(p)}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-bubblegum-50 transition-colors"
                                        >
                                            <p className="font-medium text-sm text-gray-800">{p.nama_lengkap}</p>
                                            <p className="text-xs text-gray-500">
                                                NIP: {p.nip}
                                                {p.jabatan && ` · ${p.jabatan}`}
                                            </p>
                                            {(p.pangkat || p.golongan) && (
                                                <p className="text-xs text-gray-400">{[p.pangkat, p.golongan].filter(Boolean).join(' / ')}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <FiTrash2 className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus PPK?</h3>
                        <p className="text-sm text-gray-500 mb-6">Data PPK yang dihapus tidak dapat dikembalikan.</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
