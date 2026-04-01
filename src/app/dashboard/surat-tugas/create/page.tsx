'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type {
    SuratTugas,
    SuratTugasFormData,
    PegawaiFormItem,
    SemestaPegawai,
    KlasifikasiNomorSurat,
    KategoriSurat,
    Province,
    Kabupaten,
    Kecamatan,
    Instance,
    SiCaramSubKegiatan,
} from '@/lib/types';
import {
    FiSave,
    FiArrowLeft,
    FiPlus,
    FiTrash2,
    FiSearch,
    FiX,
    FiUsers,
    FiFileText,
    FiMapPin,
    FiAward,
    FiTruck,
    FiUserCheck,
    FiStar,
    FiDollarSign,
} from 'react-icons/fi';
import SearchableSelect, { SelectOption, SelectGroupOption, SelectOptions } from '@/components/SearchableSelect';
import FormSearchPalette, { type SpdInfo } from '@/components/FormSearchPalette';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import { useSuratTugasDetailOptional } from '../[id]/SuratTugasDetailContext';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    ssr: false,
    loading: () => (
        <div className="rounded-2xl border-2 border-bubblegum-200 bg-white/50 min-h-[120px] animate-pulse" />
    ),
});

// Helper: tomorrow's date
const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

// Helper: add days to a date string
const addDays = (dateStr: string, days: number) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days - 1); // lama_perjalanan includes departure day
    return d.toISOString().split('T')[0];
};

const emptyForm: SuratTugasFormData = {
    klasifikasi_id: null,
    kategori_id: null,
    nomor_surat: '',
    pemberi_perintah_nama: '',
    pemberi_perintah_nip: '',
    pemberi_perintah_jabatan: '',
    pemberi_perintah_pangkat: '',
    pemberi_perintah_golongan: '',
    pemberi_perintah_instance_id: null,
    pemberi_perintah_jenis_pegawai: '',
    dasar: '',
    untuk: '',
    has_spd: false,
    penandatangan_nama: '',
    penandatangan_nip: '',
    penandatangan_jabatan: '',
    penandatangan_instance_id: null,
    ppk_nama: '',
    ppk_nip: '',
    ppk_jabatan: '',
    ppk_pangkat: '',
    ppk_golongan: '',
    ppk_instance_id: null,
    jenis_perjalanan: '',
    tujuan_provinsi_id: '',
    tujuan_provinsi_nama: '',
    tujuan_kabupaten_id: '',
    tujuan_kabupaten_nama: '',
    tujuan_kecamatan_id: '',
    tujuan_kecamatan_nama: '',
    lokasi_tujuan: '',
    tanggal_berangkat: getTomorrow(),
    lama_perjalanan: 1,
    tanggal_kembali: getTomorrow(), // same day = 1 day trip
    tempat_dikeluarkan: 'Indralaya',
    tanggal_dikeluarkan: new Date().toISOString().split('T')[0],
    alat_angkut: '',
    biaya: null,
    sub_kegiatan_kode: '',
    sub_kegiatan_nama: '',
    kode_rekening: '',
    uraian_rekening: '',
    keterangan: '',
    pegawai: [],
};

const BUPATI_SENTINEL = -999;

export default function SuratTugasFormPage() {
    const router = useRouter();
    const params = useParams();
    const editId = params?.id as string | undefined;
    const isEdit = !!editId;
    const { user } = useAuth();
    const detailContext = useSuratTugasDetailOptional();
    const showOwnHeader = !detailContext;

    // Determine if form should be read-only (non-draft status in edit mode)
    const isReadOnly = isEdit && detailContext ? detailContext.data.status !== 'draft' : false;

    const [form, setForm] = useState<SuratTugasFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(isEdit);
    const [error, setError] = useState('');
    const [tourActive, setTourActive] = useState(false);

    // Pemberi Perintah
    const [showPemberiPerintahModal, setShowPemberiPerintahModal] = useState(false);
    const [pemberiPerintahSearchTerm, setPemberiPerintahSearchTerm] = useState('');
    const [pemberiPerintahResults, setPemberiPerintahResults] = useState<SemestaPegawai[]>([]);
    const [pemberiPerintahLoading, setPemberiPerintahLoading] = useState(false);
    const [pemberiPerintahSkpd, setPemberiPerintahSkpd] = useState<number | null>(null);

    // Pegawai search
    const [showPegawaiModal, setShowPegawaiModal] = useState(false);
    const [pegawaiSearchTerm, setPegawaiSearchTerm] = useState('');
    const [pegawaiResults, setPegawaiResults] = useState<SemestaPegawai[]>([]);
    const [pegawaiLoading, setPegawaiLoading] = useState(false);
    const [selectedSkpd, setSelectedSkpd] = useState<number | null>(null);

    // Klasifikasi
    const [klasifikasiOptions, setKlasifikasiOptions] = useState<SelectOptions>([]);
    const [klasifikasiLoading, setKlasifikasiLoading] = useState(false);
    const [selectedKlasifikasi, setSelectedKlasifikasi] = useState<SelectOption | null>(null);

    // Kategori Surat
    const [kategoriOptions, setKategoriOptions] = useState<KategoriSurat[]>([]);
    const [kategoriLoading, setKategoriLoading] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState<SelectOption | null>(null);

    // Region
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [kabupaten, setKabupaten] = useState<Kabupaten[]>([]);
    const [kecamatan, setKecamatan] = useState<Kecamatan[]>([]);
    const [provincesLoading, setProvincesLoading] = useState(false);
    const [kabupatenLoading, setKabupatenLoading] = useState(false);
    const [kecamatanLoading, setKecamatanLoading] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<SelectOption | null>(null);
    const [selectedKabupaten, setSelectedKabupaten] = useState<SelectOption | null>(null);
    const [selectedKecamatan, setSelectedKecamatan] = useState<SelectOption | null>(null);

    // Instances
    const [instances, setInstances] = useState<Instance[]>([]);
    const [instancesLoading, setInstancesLoading] = useState(false);
    const [selectedPenandatanganInstance, setSelectedPenandatanganInstance] = useState<SelectOption | null>(null);
    const isSuperAdmin = user?.role?.slug === 'super-admin';

    // Penandatangan search
    const [showPenandatanganModal, setShowPenandatanganModal] = useState(false);
    const [penandatanganSearchTerm, setPenandatanganSearchTerm] = useState('');
    const [penandatanganResults, setPenandatanganResults] = useState<SemestaPegawai[]>([]);
    const [penandatanganLoading, setPenandatanganLoading] = useState(false);
    const [penandatanganSkpd, setPenandatanganSkpd] = useState<number | null>(null);

    // PPK Select
    const [ppkOptions, setPpkOptions] = useState<SelectOption[]>([]);
    const [ppkLoading, setPpkLoading] = useState(false);
    const [selectedPpk, setSelectedPpk] = useState<SelectOption | null>(null);

    // SiCaram - Sub Kegiatan & Kode Rekening
    const [sicaramData, setSicaramData] = useState<SiCaramSubKegiatan[]>([]);
    const [sicaramLoading, setSicaramLoading] = useState(false);
    const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<SelectOption | null>(null);
    const [selectedKodeRekening, setSelectedKodeRekening] = useState<SelectOption | null>(null);

    // ========== Data Loaders ==========

    useEffect(() => {
        loadProvinces();
        loadInstances();
        searchKlasifikasi('');
        loadKategori();
        if (isEdit) loadSuratTugas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadSuratTugas = async () => {
        try {
            const res = await api.get(`/surat-tugas/${editId}`);
            if (res.data.success) {
                const st: SuratTugas = res.data.data;

                // Strip klasifikasi kode prefix from nomor_surat for editing
                // DB stores "094.4/001", input only needs "001"
                let nomorSuratInput = st.nomor_surat || '';
                if (nomorSuratInput && st.klasifikasi?.kode) {
                    const prefix = st.klasifikasi.kode + '/';
                    if (nomorSuratInput.startsWith(prefix)) {
                        nomorSuratInput = nomorSuratInput.substring(prefix.length);
                    }
                }

                setForm({
                    instance_id: st.instance_id ?? null,
                    klasifikasi_id: st.klasifikasi_id,
                    kategori_id: st.kategori_id ?? null,
                    nomor_surat: nomorSuratInput,
                    pemberi_perintah_nama: st.pemberi_perintah_nama || '',
                    pemberi_perintah_nip: st.pemberi_perintah_nip || '',
                    pemberi_perintah_jabatan: st.pemberi_perintah_jabatan || '',
                    pemberi_perintah_pangkat: st.pemberi_perintah_pangkat || '',
                    pemberi_perintah_golongan: st.pemberi_perintah_golongan || '',
                    pemberi_perintah_instance_id: st.pemberi_perintah_instance_id ?? null,
                    pemberi_perintah_jenis_pegawai: '',
                    dasar: st.dasar || '',
                    untuk: st.untuk || '',
                    has_spd: st.has_spd,
                    penandatangan_nama: st.penandatangan_nama || '',
                    penandatangan_nip: st.penandatangan_nip || '',
                    penandatangan_jabatan: st.penandatangan_jabatan || '',
                    penandatangan_instance_id: st.penandatangan_instance_id,
                    ppk_nama: st.ppk_nama || '',
                    ppk_nip: st.ppk_nip || '',
                    ppk_jabatan: st.ppk_jabatan || '',
                    ppk_pangkat: st.ppk_pangkat || '',
                    ppk_golongan: st.ppk_golongan || '',
                    ppk_instance_id: st.ppk_instance_id,
                    jenis_perjalanan: st.jenis_perjalanan || '',
                    tujuan_provinsi_id: st.tujuan_provinsi_id || '',
                    tujuan_provinsi_nama: st.tujuan_provinsi_nama || '',
                    tujuan_kabupaten_id: st.tujuan_kabupaten_id || '',
                    tujuan_kabupaten_nama: st.tujuan_kabupaten_nama || '',
                    tujuan_kecamatan_id: st.tujuan_kecamatan_id || '',
                    tujuan_kecamatan_nama: st.tujuan_kecamatan_nama || '',
                    lokasi_tujuan: st.lokasi_tujuan || '',
                    tanggal_berangkat: st.tanggal_berangkat ? st.tanggal_berangkat.split('T')[0] : '',
                    lama_perjalanan: st.lama_perjalanan,
                    tanggal_kembali: st.tanggal_kembali ? st.tanggal_kembali.split('T')[0] : '',
                    tempat_dikeluarkan: st.tempat_dikeluarkan || 'Indralaya',
                    tanggal_dikeluarkan: st.tanggal_dikeluarkan ? st.tanggal_dikeluarkan.split('T')[0] : '',
                    alat_angkut: st.alat_angkut || '',
                    biaya: st.biaya ? parseFloat(st.biaya) : null,
                    sub_kegiatan_kode: st.sub_kegiatan_kode || '',
                    sub_kegiatan_nama: st.sub_kegiatan_nama || '',
                    kode_rekening: st.kode_rekening || '',
                    uraian_rekening: st.uraian_rekening || '',
                    keterangan: st.keterangan || '',
                    pegawai: (st.pegawai || []).map((p) => ({
                        semesta_pegawai_id: p.semesta_pegawai_id,
                        nip: p.nip,
                        nama_lengkap: p.nama_lengkap,
                        jabatan: p.jabatan || '',
                        pangkat: p.pangkat || '',
                        golongan: p.golongan || '',
                        eselon: p.eselon || '',
                        id_skpd: p.id_skpd,
                        nama_skpd: p.nama_skpd || '',
                        id_jabatan: p.id_jabatan,
                    })),
                });

                if (st.klasifikasi) {
                    setSelectedKlasifikasi({
                        value: st.klasifikasi.id,
                        label: `${st.klasifikasi.kode} — ${st.klasifikasi.klasifikasi}`,
                    });
                }
                if (st.kategori) {
                    setSelectedKategori({
                        value: st.kategori.id,
                        label: st.kategori.nama,
                    });
                }
                if (st.tujuan_provinsi_id) {
                    setSelectedProvince({
                        value: st.tujuan_provinsi_id,
                        label: st.tujuan_provinsi_nama || '',
                    });
                    loadKabupaten(st.tujuan_provinsi_id);
                }
                if (st.tujuan_kabupaten_id) {
                    setSelectedKabupaten({
                        value: st.tujuan_kabupaten_id,
                        label: st.tujuan_kabupaten_nama || '',
                    });
                    // Load kecamatan if dalam_kabupaten
                    if (st.jenis_perjalanan === 'dalam_kabupaten') {
                        loadKecamatan(st.tujuan_kabupaten_id);
                    }
                }
                if (st.tujuan_kecamatan_id) {
                    setSelectedKecamatan({
                        value: st.tujuan_kecamatan_id,
                        label: st.tujuan_kecamatan_nama || '',
                    });
                }
                // Restore sub kegiatan & kode rekening selections
                if (st.sub_kegiatan_kode) {
                    setSelectedSubKegiatan({
                        value: st.sub_kegiatan_kode,
                        label: st.sub_kegiatan_kode + (st.sub_kegiatan_nama ? ` — ${st.sub_kegiatan_nama}` : ''),
                    });
                }
                if (st.kode_rekening) {
                    setSelectedKodeRekening({
                        value: st.kode_rekening,
                        label: st.kode_rekening + (st.uraian_rekening ? ` — ${st.uraian_rekening}` : ''),
                    });
                }
                // Load SiCaram data if SPD is active (with delay to not block page load)
                if (st.has_spd) {
                    loadSicaramRekening({ delay: 2500, dateOverride: st.tanggal_berangkat?.split('T')[0] });
                }
            }
        } catch {
            setError('Gagal memuat data surat tugas.');
        } finally {
            setLoadingData(false);
        }
    };

    const loadProvinces = async () => {
        setProvincesLoading(true);
        try {
            const res = await api.get('/region/provinces');
            if (res.data.success) setProvinces(res.data.data);
        } catch { /* ignore */ }
        finally { setProvincesLoading(false); }
    };

    const loadKabupaten = async (provinceId: string) => {
        setKabupatenLoading(true);
        try {
            const res = await api.get(`/region/kabupaten/${provinceId}`);
            if (res.data.success) setKabupaten(res.data.data);
        } catch { /* ignore */ }
        finally { setKabupatenLoading(false); }
    };

    const loadKecamatan = async (kabupatenId: string) => {
        setKecamatanLoading(true);
        try {
            const res = await api.get(`/region/kecamatan/${kabupatenId}`);
            if (res.data.success) setKecamatan(res.data.data);
        } catch { /* ignore */ }
        finally { setKecamatanLoading(false); }
    };

    const loadInstances = async () => {
        setInstancesLoading(true);
        try {
            const res = await api.get('/instances');
            if (res.data.success) setInstances(res.data.data);
        } catch { /* ignore */ }
        finally { setInstancesLoading(false); }
    };

    const loadKategori = async () => {
        setKategoriLoading(true);
        try {
            const res = await api.get('/kategori-surat');
            if (res.data.success) setKategoriOptions(res.data.data);
        } catch { /* ignore */ }
        finally { setKategoriLoading(false); }
    };

    const loadSicaramRekening = useCallback(async (options?: { delay?: number; dateOverride?: string }) => {
        if (!user?.instance_id) return;
        if (options?.delay) {
            await new Promise((r) => setTimeout(r, options.delay));
        }
        setSicaramLoading(true);
        try {
            // Use Tanggal Berangkat for the SiCaram API budget period
            const dateStr = options?.dateOverride || form.tanggal_berangkat;
            const tglBerangkat = dateStr ? new Date(dateStr) : new Date();
            const res = await api.get('/sicaram/rekening-perjadin', {
                params: {
                    year: tglBerangkat.getFullYear(),
                    month: tglBerangkat.getMonth() + 1,
                    instance_id: user.instance_id,
                },
            });
            if (res.data.success && res.data.data) {
                // The API may return data in various structures; normalize
                const rawData = res.data.data;
                // If it's an array, use directly; if nested in 'data', extract
                const items: SiCaramSubKegiatan[] = Array.isArray(rawData) ? rawData : (rawData.data || []);
                setSicaramData(items);
            }
        } catch { /* ignore */ }
        finally { setSicaramLoading(false); }
    }, [user?.instance_id, form.tanggal_berangkat]);

    const searchKlasifikasi = useCallback(async (term: string) => {
        setKlasifikasiLoading(true);
        try {
            const res = await api.get('/klasifikasi', { params: { search: term, per_page: 50 } });
            if (res.data.success) {
                const items: KlasifikasiNomorSurat[] = res.data.data.data || res.data.data || [];
                // Parent = group label (not selectable), Children = selectable options
                const grouped: SelectOptions = [];
                items.forEach((k) => {
                    if (k.children && k.children.length > 0) {
                        // Parent becomes a group label, children become selectable options
                        grouped.push({
                            label: `${k.kode} — ${k.klasifikasi}`,
                            options: k.children.map((child) => ({
                                value: child.id,
                                label: `${child.kode} — ${child.klasifikasi}`,
                                data: child,
                            })),
                        } as SelectGroupOption);
                    } else if (!k.parent_id) {
                        // Top-level item without children — still selectable
                        grouped.push({ value: k.id, label: `${k.kode} — ${k.klasifikasi}`, data: k });
                    }
                });
                setKlasifikasiOptions(grouped);
            }
        } catch { /* ignore */ }
        finally { setKlasifikasiLoading(false); }
    }, []);

    const handleKlasifikasiInput = useCallback(
        (inputValue: string) => {
            const timer = setTimeout(() => searchKlasifikasi(inputValue), 300);
            return () => clearTimeout(timer);
        },
        [searchKlasifikasi]
    );

    // ========== Memoized Select Options ==========

    const provinceOptions = useMemo<SelectOption[]>(
        () => provinces.map((p) => ({ value: p.id, label: p.nama })),
        [provinces]
    );

    const kabupatenOptions = useMemo<SelectOption[]>(
        () => kabupaten.map((k) => ({ value: k.id, label: k.nama })),
        [kabupaten]
    );

    const kecamatanOptions = useMemo<SelectOption[]>(
        () => kecamatan.map((k) => ({ value: k.id, label: k.nama })),
        [kecamatan]
    );

    const instanceOptions = useMemo<SelectOption[]>(
        () => instances.map((i) => ({ value: i.id, label: i.name })),
        [instances]
    );

    // Sub Kegiatan options from SiCaram
    const subKegiatanOptions = useMemo<SelectOption[]>(
        () => sicaramData.map((sk) => ({
            value: sk.fullcode,
            label: `${sk.fullcode} — ${sk.name}`,
        })),
        [sicaramData]
    );

    // Kode Rekening options based on selected Sub Kegiatan
    const kodeRekeningOptions = useMemo<SelectOption[]>(() => {
        if (!form.sub_kegiatan_kode) return [];
        const sk = sicaramData.find((s) => s.fullcode === form.sub_kegiatan_kode);
        if (!sk || !sk.kode_rekening) return [];
        return sk.kode_rekening.map((r) => ({
            value: r.fullcode,
            label: `${r.fullcode} — ${r.name} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.pagu_induk)})`,
        }));
    }, [sicaramData, form.sub_kegiatan_kode]);

    // Filtered SKPD options: user's own OPD + Bupati (for Pemberi Perintah)
    const pemberiPerintahSkpdOptions = useMemo<SelectOption[]>(() => {
        const opts: SelectOption[] = [];
        if (user?.instance_id) {
            const inst = instances.find((i) => i.id === user.instance_id);
            if (inst) opts.push({ value: inst.id, label: inst.name });
        }
        opts.push({ value: BUPATI_SENTINEL, label: 'Bupati' });
        return opts;
    }, [user, instances]);

    // Filtered SKPD options: user's own OPD only (for Pegawai)
    const pegawaiSkpdOption = useMemo<SelectOption | null>(() => {
        if (user?.instance_id) {
            const inst = instances.find((i) => i.id === user.instance_id);
            if (inst && inst.id_eoffice != null) return { value: inst.id_eoffice, label: inst.name };
        }
        return null;
    }, [user, instances]);

    // Check if Pemberi Perintah is Bupati (affects pegawai filtering)
    const isBupatiPemberiPerintah = useMemo(() => {
        const jab = (form.pemberi_perintah_jabatan || '').toLowerCase();
        return jab.includes('bupati') && !jab.includes('wakil');
    }, [form.pemberi_perintah_jabatan]);

    // All OPD options for pegawai search when Bupati is pemberi perintah
    const allSkpdOptions = useMemo<SelectOption[]>(() => {
        return instances
            .filter((i) => i.id_eoffice != null)
            .map((i) => ({ value: i.id_eoffice!, label: i.name }));
    }, [instances]);

    // ========== Pemberi Perintah Handlers ==========

    const searchPemberiPerintah = async (skpdId?: number, isBupati = false) => {
        setPemberiPerintahLoading(true);
        try {
            // If searching for Bupati, try local Employee DB first
            if (isBupati) {
                try {
                    const localRes = await api.get('/employees/bupati');
                    if (localRes.data.success && localRes.data.data) {
                        setPemberiPerintahResults([localRes.data.data as SemestaPegawai]);
                        setPemberiPerintahLoading(false);
                        return;
                    }
                } catch { /* fallback to Semesta */ }
            }

            const params: Record<string, string | number> = {};
            if (skpdId && !isBupati) params.id_skpd = skpdId;
            if (isBupati && !pemberiPerintahSearchTerm) params.search = 'bupati';
            if (pemberiPerintahSearchTerm) params.search = pemberiPerintahSearchTerm;
            const res = await api.get('/pegawai', { params });
            if (res.data.success) {
                const allPegawai: SemestaPegawai[] = res.data.data || [];
                let filtered: SemestaPegawai[];
                if (isBupati) {
                    filtered = allPegawai.filter((p) => {
                        const jab = (p.jabatan || '').toLowerCase();
                        return jab.includes('bupati');
                    });
                } else {
                    filtered = allPegawai.filter((p) => {
                        const jab = (p.jabatan || '').toLowerCase();
                        return (
                            jab.includes('sekretaris daerah') ||
                            jab.includes('kepala badan') ||
                            jab.includes('kepala dinas')
                        );
                    });
                }
                setPemberiPerintahResults(filtered);
            }
        } catch { /* ignore */ }
        finally { setPemberiPerintahLoading(false); }
    };

    /**
     * Auto-select Bupati Kabupaten Ogan Ilir.
     * First tries local Employee DB, then falls back to Semesta API.
     */
    const autoSelectBupati = async () => {
        setPemberiPerintahLoading(true);
        try {
            // Try local Employee DB first
            const localRes = await api.get('/employees/bupati');
            if (localRes.data.success && localRes.data.data) {
                const bupati = localRes.data.data as SemestaPegawai;
                selectPemberiPerintah(bupati);
                return;
            }
        } catch {
            // Local DB failed, try Semesta API fallback
        }

        try {
            const res = await api.get('/pegawai', { params: { search: 'bupati' } });
            if (res.data.success) {
                const allPegawai: SemestaPegawai[] = res.data.data || [];
                // Find Bupati (not Wakil Bupati)
                const bupati = allPegawai.find((p) => {
                    const jab = (p.jabatan || '').toLowerCase();
                    return jab.includes('bupati') && !jab.includes('wakil');
                });
                if (bupati) {
                    selectPemberiPerintah(bupati);
                    return;
                }
                // If exact Bupati not found, fallback: show results in modal
                const filtered = allPegawai.filter((p) => {
                    const jab = (p.jabatan || '').toLowerCase();
                    return jab.includes('bupati');
                });
                setPemberiPerintahResults(filtered);
                setShowPemberiPerintahModal(true);
                setPemberiPerintahSkpd(BUPATI_SENTINEL);
            }
        } catch { /* ignore */ }
        finally { setPemberiPerintahLoading(false); }
    };

    const selectPemberiPerintah = (p: SemestaPegawai) => {
        // Resolve instance_id: try id_skpd (Semesta) or instance_id (local Employee)
        const resolvedInstanceId = p.id_skpd
            ? (instances.find((inst) => inst.id_eoffice === p.id_skpd)?.id ?? null)
            : ((p as unknown as { instance_id?: number }).instance_id ?? null);

        setForm((prev) => ({
            ...prev,
            pemberi_perintah_nama: p.nama_lengkap,
            pemberi_perintah_nip: p.nip,
            pemberi_perintah_jabatan: p.jabatan || '',
            pemberi_perintah_pangkat: p.pangkat || '',
            pemberi_perintah_golongan: p.golongan || '',
            pemberi_perintah_instance_id: resolvedInstanceId,
            pemberi_perintah_jenis_pegawai: p.jenis_pegawai || '',
            // Sementara: Penandatangan = Pemberi Perintah
            penandatangan_nama: p.nama_lengkap,
            penandatangan_nip: p.nip,
            penandatangan_jabatan: p.jabatan || '',
            penandatangan_instance_id: resolvedInstanceId,
        }));
        // Set instansi penandatangan select
        const matchedInstance = p.id_skpd
            ? instances.find((inst) => inst.id_eoffice === p.id_skpd)
            : instances.find((inst) => inst.id === resolvedInstanceId);
        if (matchedInstance) {
            setSelectedPenandatanganInstance({ value: matchedInstance.id, label: matchedInstance.name });
        }
        setShowPemberiPerintahModal(false);
    };

    // ========== Pegawai Handlers ==========

    const searchPegawai = async (skpdId?: number) => {
        setPegawaiLoading(true);
        try {
            const params: Record<string, string | number> = {};
            if (skpdId) params.id_skpd = skpdId;
            if (pegawaiSearchTerm) params.search = pegawaiSearchTerm;
            // When Bupati is pemberi perintah, only show kepala_skpd employees
            if (isBupatiPemberiPerintah) params.kepala_skpd_only = 1;
            const res = await api.get('/pegawai', { params });
            if (res.data.success) setPegawaiResults(res.data.data || []);
        } catch { /* ignore */ }
        finally { setPegawaiLoading(false); }
    };

    const searchPenandatangan = async (skpdId?: number) => {
        setPenandatanganLoading(true);
        try {
            const params: Record<string, string | number> = {};
            if (skpdId) params.id_skpd = skpdId;
            if (penandatanganSearchTerm) params.search = penandatanganSearchTerm;
            const res = await api.get('/pegawai', { params });
            if (res.data.success) setPenandatanganResults(res.data.data || []);
        } catch { /* ignore */ }
        finally { setPenandatanganLoading(false); }
    };

    const addPegawai = (p: SemestaPegawai) => {
        if (form.pegawai.find((e) => e.nip === p.nip)) return;
        if (!form.has_spd && form.pegawai.length >= 1) return;
        const item: PegawaiFormItem = {
            semesta_pegawai_id: p.id,
            nip: p.nip,
            nama_lengkap: p.nama_lengkap,
            jabatan: p.jabatan || '',
            pangkat: p.pangkat || '',
            golongan: p.golongan || '',
            eselon: p.eselon || '',
            id_skpd: p.id_skpd,
            nama_skpd: p.skpd?.nama_skpd || '',
            id_jabatan: p.id_jabatan || null,
            jenis_pegawai: p.jenis_pegawai || null,
            kepala_skpd: p.kepala_skpd || null,
            foto_pegawai: p.foto_pegawai || null,
            email: p.email || null,
            no_hp: p.no_hp || null,
        };
        setForm((prev) => ({ ...prev, pegawai: [...prev.pegawai, item] }));
    };

    const removePegawai = (nip: string) => {
        setForm((prev) => ({
            ...prev,
            pegawai: prev.pegawai.filter((p) => p.nip !== nip),
        }));
    };

    const selectPenandatangan = (p: SemestaPegawai) => {
        setForm((prev) => ({
            ...prev,
            penandatangan_nama: p.nama_lengkap,
            penandatangan_nip: p.nip,
            penandatangan_jabatan: p.jabatan || '',
        }));
        setShowPenandatanganModal(false);
    };

    // ========== Form Handlers ==========

    // Constants for Ogan Ilir auto-fill
    const SUMSEL_ID = '16';   // ID Provinsi Sumatera Selatan dari API ibnux
    const SUMSEL_NAMA = 'SUMATERA SELATAN';
    const OGAN_ILIR_ID = '1610'; // ID Kab Ogan Ilir dari API ibnux
    const OGAN_ILIR_NAMA = 'KAB. OGAN ILIR';

    const handleJenisPerjalananChange = (jenis: 'luar_kabupaten' | 'dalam_kabupaten' | '') => {
        if (jenis === 'dalam_kabupaten') {
            // Auto-fill Provinsi Sumsel & Kab Ogan Ilir
            const provOpt = provinceOptions.find(p => String(p.value) === SUMSEL_ID)
                || { value: SUMSEL_ID, label: SUMSEL_NAMA };
            const kabOpt = { value: OGAN_ILIR_ID, label: OGAN_ILIR_NAMA };

            setSelectedProvince(provOpt);
            setSelectedKabupaten(kabOpt);
            setSelectedKecamatan(null);
            setKecamatan([]);

            // Load kabupaten for Sumsel (so options are available if needed)
            loadKabupaten(SUMSEL_ID);
            // Load kecamatan for Ogan Ilir
            loadKecamatan(OGAN_ILIR_ID);

            setForm((prev) => ({
                ...prev,
                jenis_perjalanan: jenis,
                tujuan_provinsi_id: SUMSEL_ID,
                tujuan_provinsi_nama: provOpt.label,
                tujuan_kabupaten_id: OGAN_ILIR_ID,
                tujuan_kabupaten_nama: kabOpt.label,
                tujuan_kecamatan_id: '',
                tujuan_kecamatan_nama: '',
            }));
        } else {
            // Reset region selections when switching to luar_kabupaten or empty
            setSelectedProvince(null);
            setSelectedKabupaten(null);
            setSelectedKecamatan(null);
            setKabupaten([]);
            setKecamatan([]);
            setForm((prev) => ({
                ...prev,
                jenis_perjalanan: jenis,
                tujuan_provinsi_id: '',
                tujuan_provinsi_nama: '',
                tujuan_kabupaten_id: '',
                tujuan_kabupaten_nama: '',
                tujuan_kecamatan_id: '',
                tujuan_kecamatan_nama: '',
            }));
        }
    };

    const handleProvinceSelect = (opt: SelectOption | null) => {
        setSelectedProvince(opt);
        setSelectedKabupaten(null);
        setSelectedKecamatan(null);
        setKabupaten([]);
        setKecamatan([]);
        setForm((prev) => ({
            ...prev,
            tujuan_provinsi_id: opt ? String(opt.value) : '',
            tujuan_provinsi_nama: opt ? opt.label : '',
            tujuan_kabupaten_id: '',
            tujuan_kabupaten_nama: '',
            tujuan_kecamatan_id: '',
            tujuan_kecamatan_nama: '',
        }));
        if (opt) loadKabupaten(String(opt.value));
    };

    const handleKabupatenSelect = (opt: SelectOption | null) => {
        setSelectedKabupaten(opt);
        setSelectedKecamatan(null);
        setKecamatan([]);
        setForm((prev) => ({
            ...prev,
            tujuan_kabupaten_id: opt ? String(opt.value) : '',
            tujuan_kabupaten_nama: opt ? opt.label : '',
            tujuan_kecamatan_id: '',
            tujuan_kecamatan_nama: '',
        }));
        // Load kecamatan if dalam_kabupaten
        if (opt && form.jenis_perjalanan === 'dalam_kabupaten') {
            loadKecamatan(String(opt.value));
        }
    };

    const handleKecamatanSelect = (opt: SelectOption | null) => {
        setSelectedKecamatan(opt);
        setForm((prev) => ({
            ...prev,
            tujuan_kecamatan_id: opt ? String(opt.value) : '',
            tujuan_kecamatan_nama: opt ? opt.label : '',
        }));
    };

    const handleInstanceSelect = (opt: SelectOption | null) => {
        setSelectedPenandatanganInstance(opt);
        setForm((prev) => ({
            ...prev,
            penandatangan_instance_id: opt ? Number(opt.value) : null,
        }));
    };

    const handleSpdToggle = (checked: boolean) => {
        setForm((prev) => {
            const newForm = { ...prev, has_spd: checked };
            if (!checked) {
                newForm.jenis_perjalanan = '';
                newForm.tujuan_kecamatan_id = '';
                newForm.tujuan_kecamatan_nama = '';
                newForm.sub_kegiatan_kode = '';
                newForm.sub_kegiatan_nama = '';
                newForm.kode_rekening = '';
                newForm.uraian_rekening = '';
                if (prev.pegawai.length > 1) {
                    newForm.pegawai = [prev.pegawai[0]];
                }
            }
            return newForm;
        });
        if (!checked) {
            setSelectedKecamatan(null);
            setKecamatan([]);
            setSelectedSubKegiatan(null);
            setSelectedKodeRekening(null);
        } else {
            // Load SiCaram data when SPD is toggled on
            if (sicaramData.length === 0) loadSicaramRekening();
        }
    };

    // Reload SiCaram data when tanggal_berangkat changes (budget period may differ)
    const prevTglRef = useRef(form.tanggal_berangkat);
    useEffect(() => {
        if (!form.has_spd) return;
        const prev = prevTglRef.current;
        prevTglRef.current = form.tanggal_berangkat;
        if (!prev || !form.tanggal_berangkat) return;
        // Only reload if month or year actually changed
        const [pY, pM] = prev.split('-');
        const [nY, nM] = form.tanggal_berangkat.split('-');
        if (pY !== nY || pM !== nM) {
            // Reset selections since the data set will change
            setSelectedSubKegiatan(null);
            setSelectedKodeRekening(null);
            setForm(f => ({ ...f, sub_kegiatan_kode: '', sub_kegiatan_nama: '', kode_rekening: '', uraian_rekening: '' }));
            loadSicaramRekening();
        }
    }, [form.tanggal_berangkat, form.has_spd, loadSicaramRekening]);

    // Auto-calculate tanggal_kembali
    useEffect(() => {
        if (form.tanggal_berangkat && form.lama_perjalanan && form.lama_perjalanan > 0) {
            const start = new Date(form.tanggal_berangkat);
            start.setDate(start.getDate() + form.lama_perjalanan - 1);
            setForm((prev) => ({
                ...prev,
                tanggal_kembali: start.toISOString().split('T')[0],
            }));
        }
    }, [form.tanggal_berangkat, form.lama_perjalanan]);

    // Set penandatangan_instance when instances load (edit mode)
    useEffect(() => {
        if (form.penandatangan_instance_id && instances.length > 0 && !selectedPenandatanganInstance) {
            const inst = instances.find((i) => i.id === form.penandatangan_instance_id);
            if (inst) {
                setSelectedPenandatanganInstance({ value: inst.id, label: inst.name });
            }
        }
    }, [instances, form.penandatangan_instance_id, selectedPenandatanganInstance]);

    // Auto-fetch PPK list for user's/ST's instance
    useEffect(() => {
        let instanceId: number | null = null;
        
        if (isEdit) {
            // In edit mode: use ppk_instance_id if set, otherwise use ST's instance_id
            instanceId = form.ppk_instance_id || form.instance_id || null;
        } else {
            // In create mode: use user's instance_id
            instanceId = user?.instance_id || null;
        }
        
        if (!instanceId) return;

        const fetchPpkList = async () => {
            setPpkLoading(true);
            try {
                const res = await api.get(`/ppk/instance/${instanceId}`);
                if (res.data.success && Array.isArray(res.data.data)) {
                    const list = res.data.data;
                    const options: SelectOption[] = list.map((ppk: { id: number; nama: string; nip: string; jabatan?: string }) => ({
                        value: ppk.id,
                        label: `${ppk.nama} — ${ppk.jabatan || 'PPK'} (${ppk.nip})`,
                        data: ppk,
                    }));
                    setPpkOptions(options);

                    if (list.length === 1) {
                        // Auto-select if only one PPK (applies to both create and edit without PPK)
                        const ppk = list[0];
                        setSelectedPpk(options[0]);
                        setForm(prev => ({
                            ...prev,
                            ppk_nama: ppk.nama || '',
                            ppk_nip: ppk.nip || '',
                            ppk_jabatan: ppk.jabatan || '',
                            ppk_pangkat: ppk.pangkat || '',
                            ppk_golongan: ppk.golongan || '',
                            ppk_instance_id: ppk.instance_id || null,
                        }));
                    } else if (isEdit && form.ppk_nip) {
                        // In edit mode with saved PPK, pre-select the matching option
                        const match = options.find((o: SelectOption) => {
                            const d = o.data as { nip: string };
                            return d.nip === form.ppk_nip;
                        });
                        if (match) setSelectedPpk(match);
                    }
                    // If multiple PPKs and no saved PPK (edit mode without PPK), just show options without selection
                }
            } catch { /* ignore */ }
            setPpkLoading(false);
        };

        fetchPpkList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.instance_id, isEdit, form.ppk_instance_id, form.instance_id]);

    // Helper: check if RichTextEditor HTML content is effectively empty
    const isHtmlEmpty = (html: string | null | undefined): boolean => {
        if (!html) return true;
        const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        return text.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const errors: string[] = [];

        // --- Pejabat Pemberi Perintah wajib ---
        if (!form.pemberi_perintah_nama.trim()) {
            errors.push('Pejabat Pemberi Perintah wajib diisi.');
        }

        // --- Klasifikasi & Nomor Surat wajib ---
        if (!form.klasifikasi_id) {
            errors.push('Klasifikasi Nomor Surat wajib dipilih.');
        }
        if (!form.nomor_surat?.trim()) {
            errors.push('Nomor Surat wajib diisi.');
        }

        // --- Dasar & Untuk wajib ---
        if (isHtmlEmpty(form.dasar)) {
            errors.push('Dasar Surat Tugas wajib diisi.');
        }
        if (isHtmlEmpty(form.untuk)) {
            errors.push('Maksud / Tujuan Surat wajib diisi.');
        }

        // --- Pegawai ---
        if (form.pegawai.length === 0) {
            errors.push('Tambahkan minimal 1 pegawai yang ditugaskan.');
        }
        if (!form.has_spd && form.pegawai.length > 1) {
            errors.push('Surat Tugas tanpa SPD hanya boleh menugaskan 1 pegawai.');
        }

        // --- Tempat & Tanggal Dikeluarkan wajib ---
        if (!form.tempat_dikeluarkan?.trim()) {
            errors.push('Tempat Dikeluarkan wajib diisi.');
        }
        if (!form.tanggal_dikeluarkan) {
            errors.push('Tanggal Dikeluarkan wajib diisi.');
        }

        // --- SPD fields wajib jika Sertakan SPD ---
        if (form.has_spd) {
            if (!form.jenis_perjalanan) {
                errors.push('Jenis Perjalanan Dinas wajib dipilih (SPD).');
            }
            if (!form.tujuan_provinsi_id) {
                errors.push('Provinsi Tujuan wajib dipilih (SPD).');
            }
            if (!form.tujuan_kabupaten_id) {
                errors.push('Kab/Kota Tujuan wajib dipilih (SPD).');
            }
            if (form.jenis_perjalanan === 'dalam_kabupaten' && !form.tujuan_kecamatan_id) {
                errors.push('Kecamatan Tujuan wajib dipilih untuk Perjalanan Dinas Dalam Kota.');
            }
            if (!form.lokasi_tujuan?.trim()) {
                errors.push('Lokasi Tujuan (Detail) wajib diisi (SPD).');
            }
            if (!form.tanggal_berangkat) {
                errors.push('Tanggal Berangkat wajib diisi (SPD).');
            }
            if (!form.lama_perjalanan || form.lama_perjalanan < 1) {
                errors.push('Lama Perjalanan wajib diisi minimal 1 hari (SPD).');
            }
            if (!form.alat_angkut?.trim()) {
                errors.push('Alat Angkut wajib dipilih (SPD).');
            }
        }

        if (errors.length > 0) {
            setError(errors.join('\n'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };

            // Combine klasifikasi kode + nomor urut into full nomor_surat
            if (selectedKlasifikasi && payload.nomor_surat) {
                const kode = (selectedKlasifikasi.data as KlasifikasiNomorSurat)?.kode || selectedKlasifikasi.label.split(' — ')[0];
                payload.nomor_surat = `${kode}/${payload.nomor_surat}`;
            }

            let res;
            if (isEdit) {
                res = await api.put(`/surat-tugas/${editId}`, payload);
            } else {
                res = await api.post('/surat-tugas', payload);
            }

            if (res.data.success) {
                const id = res.data.data?.id || editId;
                if (detailContext) detailContext.fetchData();
                router.push(`/dashboard/surat-tugas/${id}`);
            } else {
                setError(res.data.message || 'Gagal menyimpan surat tugas.');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error?.response?.data?.message || 'Gagal menyimpan surat tugas.');
        } finally {
            setSaving(false);
        }
    };

    // ======== Onboarding Tour Steps (must be above early return to maintain hooks order) ========
    const stTourSteps = useMemo<TourStep[]>(() => {
        const base: TourStep[] = [
            {
                targetSelector: '#field-kategori',
                title: 'Kategori Surat',
                description: 'Langkah pertama, pilih kategori surat tugas. Kategori menentukan jenis surat yang akan dibuat.',
                position: 'bottom',
            },
            {
                targetSelector: '#field-pemberi-perintah',
                title: 'Pemberi Perintah',
                description: 'Cari dan pilih pejabat pemberi perintah. Anda bisa mencari berdasarkan nama atau NIP.',
                position: 'bottom',
            },
            {
                targetSelector: '#field-informasi-surat',
                title: 'Informasi Surat',
                description: 'Isi klasifikasi nomor surat, nomor surat, dasar, dan tujuan (untuk) pembuatan surat tugas.',
                position: 'bottom',
            },
            {
                targetSelector: '#field-spd',
                title: 'Surat Perjalanan Dinas',
                description: 'Aktifkan toggle SPD jika surat tugas ini memerlukan perjalanan dinas. Isi tujuan, tanggal, alat angkut, dan biaya.',
                position: 'top',
            },
            {
                targetSelector: '#field-pegawai',
                title: 'Pegawai yang Ditugaskan',
                description: 'Tambahkan pegawai yang akan ditugaskan. Cari berdasarkan nama/NIP dan pilih dari daftar.',
                position: 'top',
            },
            {
                targetSelector: '#field-penandatangan',
                title: 'Penandatangan & Info Tambahan',
                description: 'Pilih pejabat penandatangan, tempat/tanggal surat dikeluarkan, dan keterangan tambahan jika diperlukan.',
                position: 'top',
            },
        ];
        if (form.has_spd) {
            base.splice(4, 0, {
                targetSelector: '#field-mata-anggaran',
                title: 'Mata Anggaran (SiCaram)',
                description: 'Pilih Sub Kegiatan dan Kode Rekening anggaran dari data SiCaram. Data ditarik berdasarkan periode tanggal keberangkatan.',
                position: 'top',
            });
        }
        return base;
    }, [form.has_spd]);

    // ========== Render ==========

    if (loadingData) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
            </div>
        );
    }

    const maxPegawai = form.has_spd ? Infinity : 1;
    const pegawaiLimitReached = form.pegawai.length >= maxPegawai;

    // ======== Progressive Disclosure (hide sections until previous is filled) ========
    // When onboarding tour is active, show all sections so the tour can highlight them
    // Step 0: Kategori Surat — always visible
    const step0Done = !!form.kategori_id;
    // Step 1: Pemberi Perintah — visible after Kategori is selected
    const showStep1 = tourActive || isEdit || step0Done;
    const step1Done = !!form.pemberi_perintah_nama;
    // Step 2: Informasi Surat — visible after Pemberi Perintah is selected
    const showStep2 = tourActive || isEdit || (step0Done && step1Done);
    const step2Done = !!form.klasifikasi_id && !!form.nomor_surat?.trim() && !isHtmlEmpty(form.dasar) && !isHtmlEmpty(form.untuk);
    // Step 3: SPD — visible after Informasi Surat is filled
    const showStep3 = tourActive || isEdit || (step0Done && step1Done && step2Done);
    // Step 4: Pegawai — visible after SPD section is shown
    const showStep4 = tourActive || isEdit || (step0Done && step1Done && step2Done);
    // Step 5: Penandatangan & Info Tambahan — visible after Pegawai is added
    const step4Done = form.pegawai.length > 0;
    const showStep5 = tourActive || isEdit || (step0Done && step1Done && step2Done && step4Done);

    return (
        <div className={`space-y-6 ${showOwnHeader ? 'max-w-5xl mx-auto' : ''} pb-8`}>
            {/* Onboarding Tour */}
            {isEdit ? null : (
                <OnboardingTour
                    steps={stTourSteps}
                    storageKey="onboarding_st_form"
                    onStart={() => setTourActive(true)}
                    onEnd={() => setTourActive(false)}
                />
            )}

            {/* Header */}
            {showOwnHeader && (
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="p-2.5 rounded-2xl text-bubblegum-400 hover:text-bubblegum-600 hover:bg-white/60 transition-all shadow-sm border border-bubblegum-100"
                    >
                        <FiArrowLeft className="text-lg" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-bubblegum-600 to-grape-600 bg-clip-text text-transparent">
                            {isEdit ? 'Edit Surat Tugas' : 'Buat Surat Tugas Baru'}
                        </h1>
                        <p className="text-sm text-bubblegum-400 mt-0.5">
                            {isEdit ? 'Perbarui data surat tugas yang sudah ada' : 'Isi formulir lengkap untuk membuat surat tugas baru'}
                        </p>
                    </div>
                </div>
            )}

            {/* Search Palette for navigating form fields */}
            <FormSearchPalette
                hasSPD={form.has_spd}
                spdList={(detailContext?.data.surat_perjalanan_dinas || []).map(spd => ({
                    id: spd.id,
                    nomor_spd: spd.nomor_spd,
                    pegawai_nama: spd.surat_tugas_pegawai?.nama_lengkap || null,
                } as SpdInfo))}
            />

            {error && (
                <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">&#9888;&#65039;</span>
                        <div className="flex-1 space-y-1">
                            {error.split('\n').map((msg, i) => (
                                <p key={i}>{msg}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isReadOnly && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                    <span className="text-amber-500">&#128274;</span>
                    <div>
                        <p className="font-semibold">Mode Hanya Baca</p>
                        <p className="text-xs text-amber-700 mt-0.5">Surat tugas ini tidak bisa diedit karena statusnya sudah bukan draft.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset disabled={isReadOnly} className={isReadOnly ? 'opacity-70 space-y-6' : 'space-y-6'}>

                    {/* ══════════════════════════════
                        Kategori Surat
                        ══════════════════════════════ */}
                    <div id="field-kategori" className="glass-card rounded-3xl p-6 space-y-4">
                        <h2 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-500 to-bubblegum-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                <FiFileText className="text-sm" />
                            </span>
                            Kategori Surat
                        </h2>
                        <p className="text-xs text-bubblegum-400 -mt-2">
                            Pilih kategori yang sesuai dengan tujuan surat tugas ini. Langkah selanjutnya akan tampil setelah kategori dipilih.
                        </p>

                        <div>
                            <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Kategori <span className="text-red-400">*</span></label>
                            <SearchableSelect
                                options={kategoriOptions.map((k) => ({ value: k.id, label: k.nama }))}
                                value={selectedKategori}
                                onChange={(opt) => {
                                    setSelectedKategori(opt);
                                    setForm((prev) => ({ ...prev, kategori_id: opt ? Number(opt.value) : null }));
                                }}
                                isLoading={kategoriLoading}
                                placeholder="Ketik atau pilih kategori surat..."
                                noOptionsMessage="Tidak ada kategori ditemukan"
                            />
                        </div>
                    </div>

                    {/* ══════════════════════════════
                        Section 1: Pemberi Perintah
                        ══════════════════════════════ */}
                    {showStep1 && (
                        <div id="field-pemberi-perintah" className="glass-card rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                    <FiUserCheck className="text-sm" />
                                </span>
                                Pemberi Perintah
                            </h2>
                            <p className="text-xs text-bubblegum-400 -mt-3">
                                Pilih pejabat dari OPD Anda (Sekretaris Daerah, Kepala Badan, Kepala Dinas) atau Bupati.
                            </p>

                            <div>
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Pejabat Pemberi Perintah</label>

                                {/* Quick-select buttons */}
                                {!form.pemberi_perintah_nama && !isReadOnly && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={autoSelectBupati}
                                            disabled={pemberiPerintahLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-grape-700 bg-grape-50 border border-grape-200 hover:bg-grape-100 hover:border-grape-300 transition-colors disabled:opacity-50"
                                        >
                                            <FiStar className="text-xs" /> Bupati Ogan Ilir
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPemberiPerintahModal(true);
                                                const userInst = instances.find((i) => i.id === user?.instance_id);
                                                if (userInst) {
                                                    setPemberiPerintahSkpd(userInst.id);
                                                    searchPemberiPerintah(userInst.id_eoffice ?? undefined);
                                                } else {
                                                    searchPemberiPerintah();
                                                }
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-bubblegum-700 bg-bubblegum-50 border border-bubblegum-200 hover:bg-bubblegum-100 hover:border-bubblegum-300 transition-colors"
                                        >
                                            <FiSearch className="text-xs" /> Pejabat Lainnya
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPemberiPerintahModal(true);
                                            // Auto-select user's OPD
                                            const userInst = instances.find((i) => i.id === user?.instance_id);
                                            if (userInst) {
                                                setPemberiPerintahSkpd(userInst.id);
                                                searchPemberiPerintah(userInst.id_eoffice ?? undefined);
                                            } else {
                                                searchPemberiPerintah();
                                            }
                                        }}
                                        className={`input-field flex-1 text-left cursor-pointer flex items-center gap-2 hover:border-bubblegum-400 ${form.pemberi_perintah_nama ? '' : 'text-bubblegum-300'
                                            }`}
                                    >
                                        <FiSearch className="text-bubblegum-300 text-sm shrink-0" />
                                        {form.pemberi_perintah_nama ? (
                                            <span className="text-bubblegum-800">
                                                {form.pemberi_perintah_nama}
                                                {form.pemberi_perintah_jabatan && (
                                                    <span className="text-bubblegum-400 font-normal"> &mdash; {form.pemberi_perintah_jabatan}</span>
                                                )}
                                            </span>
                                        ) : (
                                            <span>Klik untuk memilih pemberi perintah...</span>
                                        )}
                                    </button>
                                    {form.pemberi_perintah_nama && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm((p) => ({
                                                    ...p,
                                                    pemberi_perintah_nama: '',
                                                    pemberi_perintah_nip: '',
                                                    pemberi_perintah_jabatan: '',
                                                    pemberi_perintah_pangkat: '',
                                                    pemberi_perintah_golongan: '',
                                                    pemberi_perintah_instance_id: null,
                                                    // Sementara: Penandatangan = Pemberi Perintah
                                                    penandatangan_nama: '',
                                                    penandatangan_nip: '',
                                                    penandatangan_jabatan: '',
                                                    penandatangan_instance_id: null,
                                                }))
                                            }
                                            className="p-3 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all border-2 border-red-200"
                                        >
                                            <FiX className="text-sm" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Detail Info Pemberi Perintah */}
                            {form.pemberi_perintah_nama && (
                                <div className="rounded-2xl border-2 border-grape-100 bg-gradient-to-r from-grape-50/50 to-bubblegum-50/30 p-4">
                                    <p className="text-xs font-bold text-grape-500 uppercase tracking-wide mb-3">Informasi Pejabat</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[11px] text-bubblegum-400 uppercase tracking-wide">Nama Lengkap</p>
                                            <p className="text-sm font-semibold text-bubblegum-800">{form.pemberi_perintah_nama}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-bubblegum-400 uppercase tracking-wide">NIP</p>
                                            <p className="text-sm font-semibold text-bubblegum-800">{form.pemberi_perintah_nip || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-bubblegum-400 uppercase tracking-wide">Jabatan</p>
                                            <p className="text-sm font-semibold text-bubblegum-800">{form.pemberi_perintah_jabatan || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-bubblegum-400 uppercase tracking-wide">Pangkat / Golongan</p>
                                            <p className="text-sm font-semibold text-bubblegum-800">
                                                {form.pemberi_perintah_pangkat || '-'}
                                                {form.pemberi_perintah_golongan && ` (${form.pemberi_perintah_golongan})`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════
                        Section 2: Informasi Surat
                    ══════════════════════════════ */}
                    {showStep2 ? (
                        <div id="field-informasi-surat" className="glass-card rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-bubblegum-500 to-grape-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                    <FiFileText className="text-sm" />
                                </span>
                                Informasi Surat
                            </h2>

                            {/* Klasifikasi with SearchableSelect */}
                            <div id="field-klasifikasi">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">
                                    Klasifikasi Nomor Surat <span className="text-red-400">*</span>
                                </label>
                                <SearchableSelect
                                    options={klasifikasiOptions}
                                    value={selectedKlasifikasi}
                                    onChange={(opt: SelectOption | null) => {
                                        setSelectedKlasifikasi(opt);
                                        setForm((p) => ({
                                            ...p,
                                            klasifikasi_id: opt ? Number(opt.value) : null,
                                            nomor_surat: '', // reset when klasifikasi changes
                                        }));
                                    }}
                                    onInputChange={handleKlasifikasiInput}
                                    isLoading={klasifikasiLoading}
                                    placeholder="Ketik kode atau nama klasifikasi..."
                                    noOptionsMessage="Tidak ada klasifikasi ditemukan"
                                />
                            </div>

                            {/* Nomor Surat — visible after selecting klasifikasi */}
                            {selectedKlasifikasi && (
                                <div id="field-nomor-surat">
                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">
                                        Nomor Surat <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex items-center gap-0">
                                        <span className="inline-flex items-center px-4 h-[44px] rounded-l-2xl border-2 border-r-0 border-bubblegum-200 bg-grape-50 text-sm font-semibold text-grape-600 whitespace-nowrap">
                                            {(selectedKlasifikasi.data as KlasifikasiNomorSurat)?.kode || selectedKlasifikasi.label.split(' — ')[0]} /
                                        </span>
                                        <input
                                            type="text"
                                            value={form.nomor_surat}
                                            onChange={(e) => setForm((p) => ({ ...p, nomor_surat: e.target.value }))}
                                            placeholder="Masukkan nomor urut surat..."
                                            className="input-field !rounded-l-none flex-1"
                                        />
                                    </div>
                                    <p className="text-[11px] text-bubblegum-400 mt-1">
                                        Contoh format: {(selectedKlasifikasi.data as KlasifikasiNomorSurat)?.kode || '...'} / nomor urut surat
                                    </p>
                                </div>
                            )}

                            {/* Dasar with RichTextEditor */}
                            <div id="field-dasar">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">
                                    Dasar Surat Tugas <span className="text-red-400">*</span>
                                </label>
                                <RichTextEditor
                                    value={form.dasar}
                                    onChange={(html) => setForm((p) => ({ ...p, dasar: html }))}
                                    placeholder="Masukkan dasar surat tugas... (gunakan toolbar untuk membuat daftar bernomor)"
                                    toolbarMode="numberedOnly"
                                />
                            </div>

                            {/* Untuk with RichTextEditor */}
                            <div id="field-untuk">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">
                                    Untuk / Maksud Perjalanan <span className="text-red-400">*</span>
                                </label>
                                <RichTextEditor
                                    value={form.untuk}
                                    onChange={(html) => setForm((p) => ({ ...p, untuk: html }))}
                                    placeholder="Masukkan tujuan penugasan... (gunakan toolbar untuk membuat daftar bernomor)"
                                    toolbarMode="numberedOnly"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card rounded-3xl p-6 border-2 border-dashed border-bubblegum-200 opacity-50">
                            <h2 className="text-lg font-bold text-bubblegum-400 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-bubblegum-200 text-white flex items-center justify-center text-xs font-bold">
                                    <FiFileText className="text-sm" />
                                </span>
                                Informasi Surat
                                <span className="text-xs font-normal text-bubblegum-300 ml-2">— Pilih Pemberi Perintah terlebih dahulu</span>
                            </h2>
                        </div>
                    )}
                    {/* ══════════════════════════════
                        Section 3: SPD
                    ══════════════════════════════ */}
                    {showStep3 ? (
                        <div id="field-spd" className="glass-card rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-candy-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                    <FiMapPin className="text-sm" />
                                </span>
                                Surat Perjalanan Dinas
                            </h2>

                            {/* Toggle SPD */}
                            <div>
                                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={form.has_spd}
                                            onChange={(e) => handleSpdToggle(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-12 h-7 rounded-full bg-bubblegum-200 peer-checked:bg-gradient-to-r peer-checked:from-bubblegum-500 peer-checked:to-grape-500 transition-all shadow-inner" />
                                        <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5" />
                                    </div>
                                    <span className="text-sm text-bubblegum-700 font-semibold">Sertakan SPD (Surat Perjalanan Dinas)</span>
                                </label>
                            </div>

                            {form.has_spd && (
                                <div className="space-y-5 pt-1 border-t border-bubblegum-100">
                                    {/* Jenis Perjalanan Dinas */}
                                    <div id="field-jenis-perjalanan" className="pt-4">
                                        <label className="block text-sm font-semibold text-bubblegum-700 mb-2">Jenis Perjalanan Dinas <span className="text-red-400">*</span></label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleJenisPerjalananChange('luar_kabupaten')}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all ${form.jenis_perjalanan === 'luar_kabupaten'
                                                    ? 'border-bubblegum-500 bg-bubblegum-50 shadow-md'
                                                    : 'border-bubblegum-200 bg-white hover:border-bubblegum-300'
                                                    }`}
                                            >
                                                <p className="text-sm font-bold text-bubblegum-800">Perjalanan Dinas Biasa</p>
                                                <p className="text-xs text-bubblegum-400 mt-0.5">Luar Kabupaten Ogan Ilir</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleJenisPerjalananChange('dalam_kabupaten')}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all ${form.jenis_perjalanan === 'dalam_kabupaten'
                                                    ? 'border-grape-500 bg-grape-50 shadow-md'
                                                    : 'border-bubblegum-200 bg-white hover:border-bubblegum-300'
                                                    }`}
                                            >
                                                <p className="text-sm font-bold text-bubblegum-800">Perjalanan Dinas Dalam Kota</p>
                                                <p className="text-xs text-bubblegum-400 mt-0.5">Dalam Kabupaten Ogan Ilir</p>
                                            </button>
                                        </div>
                                    </div>


                                    {form.jenis_perjalanan && (
                                        <>
                                            {/* Province & Kabupaten with SearchableSelect */}
                                            <div id="field-tujuan" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Provinsi Tujuan <span className="text-red-400">*</span></label>
                                                    <SearchableSelect
                                                        options={provinceOptions}
                                                        value={selectedProvince}
                                                        onChange={handleProvinceSelect}
                                                        isLoading={provincesLoading}
                                                        isDisabled={form.jenis_perjalanan === 'dalam_kabupaten'}
                                                        placeholder="Cari provinsi..."
                                                        noOptionsMessage="Tidak ada provinsi"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Kab/Kota Tujuan <span className="text-red-400">*</span></label>
                                                    <SearchableSelect
                                                        options={kabupatenOptions}
                                                        value={selectedKabupaten}
                                                        onChange={handleKabupatenSelect}
                                                        isLoading={kabupatenLoading}
                                                        isDisabled={!form.tujuan_provinsi_id || form.jenis_perjalanan === 'dalam_kabupaten'}
                                                        placeholder={form.tujuan_provinsi_id ? 'Cari kab/kota...' : 'Pilih provinsi terlebih dulu'}
                                                        noOptionsMessage="Tidak ada kabupaten/kota"
                                                    />
                                                </div>
                                            </div>

                                            {/* Kecamatan — only for Dalam Kabupaten */}
                                            {form.jenis_perjalanan === 'dalam_kabupaten' && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Kecamatan Tujuan <span className="text-red-400">*</span></label>
                                                    <SearchableSelect
                                                        options={kecamatanOptions}
                                                        value={selectedKecamatan}
                                                        onChange={handleKecamatanSelect}
                                                        isLoading={kecamatanLoading}
                                                        placeholder="Cari kecamatan di Kabupaten Ogan Ilir..."
                                                        noOptionsMessage="Tidak ada kecamatan"
                                                    />
                                                </div>
                                            )}

                                            {/* Lokasi detail */}
                                            <div id="field-lokasi-tujuan">
                                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Lokasi Tujuan (Detail) <span className="text-red-400">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Hotel Grand Inna, Jakarta Pusat"
                                                    value={form.lokasi_tujuan}
                                                    onChange={(e) => setForm((p) => ({ ...p, lokasi_tujuan: e.target.value }))}
                                                    className="input-field"
                                                />
                                            </div>

                                            {/* Tanggal & Duration */}
                                            <div id="field-tanggal" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div id="field-tanggal-berangkat">
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Tanggal Berangkat <span className="text-red-400">*</span></label>
                                                    <input
                                                        type="date"
                                                        value={form.tanggal_berangkat}
                                                        onChange={(e) => {
                                                            const newDate = e.target.value;
                                                            setForm((p) => ({
                                                                ...p,
                                                                tanggal_berangkat: newDate,
                                                                tanggal_kembali: newDate && p.lama_perjalanan ? addDays(newDate, p.lama_perjalanan) : '',
                                                            }));
                                                        }}
                                                        className="input-field"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Lama Perjalanan (Hari) <span className="text-red-400">*</span></label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        placeholder="1"
                                                        value={form.lama_perjalanan ?? ''}
                                                        onChange={(e) => {
                                                            const days = e.target.value ? parseInt(e.target.value) : null;
                                                            setForm((p) => ({
                                                                ...p,
                                                                lama_perjalanan: days,
                                                                tanggal_kembali: p.tanggal_berangkat && days ? addDays(p.tanggal_berangkat, days) : '',
                                                            }));
                                                        }}
                                                        className="input-field"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Tanggal Kembali</label>
                                                    <input
                                                        type="date"
                                                        value={form.tanggal_kembali}
                                                        disabled
                                                        className="input-field bg-bubblegum-50/50 cursor-not-allowed opacity-60"
                                                    />
                                                    <p className="text-[11px] text-bubblegum-400 mt-1">Otomatis dihitung dari berangkat + lama perjalanan</p>
                                                </div>
                                            </div>

                                            {/* Transport & Cost */}
                                            <div id="field-transport" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-semibold text-bubblegum-700 mb-1.5 flex items-center gap-1.5">
                                                        <FiTruck className="text-bubblegum-400 text-xs" /> Alat Angkut <span className="text-red-400">*</span>
                                                    </label>
                                                    <select
                                                        value={form.alat_angkut}
                                                        onChange={(e) => setForm((p) => ({ ...p, alat_angkut: e.target.value }))}
                                                        className="input-field"
                                                    >
                                                        <option value="">Pilih Alat Angkut</option>
                                                        <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                                                        <option value="Kendaraan Umum">Kendaraan Umum</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Biaya (Rp)</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        placeholder="0"
                                                        value={form.biaya ?? ''}
                                                        onChange={(e) =>
                                                            setForm((p) => ({ ...p, biaya: e.target.value ? parseFloat(e.target.value) : null }))
                                                        }
                                                        className="input-field"
                                                    />
                                                </div>
                                            </div>

                                            {/* Sub Kegiatan & Kode Rekening (Mata Anggaran) */}
                                            <div id="field-mata-anggaran" className="pt-4 border-t border-bubblegum-100">
                                                <p className="text-xs font-bold text-grape-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                    <FiDollarSign className="text-xs" /> Mata Anggaran (dari SiCaram)
                                                </p>

                                                {/* Info: periode data berdasarkan Tanggal Berangkat */}
                                                <div className="mb-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs flex items-start gap-2">
                                                    <span className="mt-0.5 shrink-0">&#8505;&#65039;</span>
                                                    <div className="flex-1">
                                                        <p>
                                                            Data rekening ditarik berdasarkan periode <strong>Tanggal Berangkat</strong>:
                                                            {form.tanggal_berangkat ? (
                                                                <> <strong>{new Date(form.tanggal_berangkat).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong></>
                                                            ) : ' (belum diisi)'}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const el = document.getElementById('field-tanggal-berangkat');
                                                                if (el) {
                                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    el.classList.add('ring-2', 'ring-bubblegum-400', 'ring-offset-2', 'transition-all');
                                                                    setTimeout(() => el.classList.remove('ring-2', 'ring-bubblegum-400', 'ring-offset-2', 'transition-all'), 2000);
                                                                }
                                                            }}
                                                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 underline underline-offset-2"
                                                        >
                                                            Ubah Tanggal Berangkat &darr;
                                                        </button>
                                                    </div>
                                                </div>
                                                {sicaramLoading ? (
                                                    <div className="flex items-center gap-2 py-4 text-bubblegum-400 text-sm">
                                                        <div className="w-5 h-5 rounded-full border-2 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
                                                        Memuat data dari SiCaram...
                                                    </div>
                                                ) : sicaramData.length === 0 ? (
                                                    <div className="py-3">
                                                        <p className="text-xs text-bubblegum-400">Data sub kegiatan belum tersedia dari SiCaram.</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => loadSicaramRekening()}
                                                            className="mt-2 text-xs font-semibold text-grape-600 hover:text-grape-700 underline"
                                                        >
                                                            Coba muat ulang
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Sub Kegiatan</label>
                                                            <SearchableSelect
                                                                options={subKegiatanOptions}
                                                                value={selectedSubKegiatan}
                                                                onChange={(opt) => {
                                                                    setSelectedSubKegiatan(opt);
                                                                    setSelectedKodeRekening(null);
                                                                    if (opt) {
                                                                        const sk = sicaramData.find((s) => s.fullcode === String(opt.value));
                                                                        setForm((p) => ({
                                                                            ...p,
                                                                            sub_kegiatan_kode: String(opt.value),
                                                                            sub_kegiatan_nama: sk?.name || '',
                                                                            kode_rekening: '',
                                                                            uraian_rekening: '',
                                                                        }));
                                                                    } else {
                                                                        setForm((p) => ({
                                                                            ...p,
                                                                            sub_kegiatan_kode: '',
                                                                            sub_kegiatan_nama: '',
                                                                            kode_rekening: '',
                                                                            uraian_rekening: '',
                                                                        }));
                                                                    }
                                                                }}
                                                                placeholder="Pilih sub kegiatan..."
                                                                noOptionsMessage="Tidak ada sub kegiatan"
                                                            />
                                                        </div>
                                                        {form.sub_kegiatan_kode && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Kode Rekening</label>
                                                                <SearchableSelect
                                                                    options={kodeRekeningOptions}
                                                                    value={selectedKodeRekening}
                                                                    onChange={(opt) => {
                                                                        setSelectedKodeRekening(opt);
                                                                        if (opt) {
                                                                            const sk = sicaramData.find((s) => s.fullcode === form.sub_kegiatan_kode);
                                                                            const rek = sk?.kode_rekening?.find((r) => r.fullcode === String(opt.value));
                                                                            setForm((p) => ({
                                                                                ...p,
                                                                                kode_rekening: String(opt.value),
                                                                                uraian_rekening: rek?.name || '',
                                                                            }));
                                                                        } else {
                                                                            setForm((p) => ({
                                                                                ...p,
                                                                                kode_rekening: '',
                                                                                uraian_rekening: '',
                                                                            }));
                                                                        }
                                                                    }}
                                                                    placeholder="Pilih kode rekening..."
                                                                    noOptionsMessage="Tidak ada kode rekening untuk sub kegiatan ini"
                                                                />
                                                            </div>
                                                        )}
                                                        {form.kode_rekening && form.uraian_rekening && (
                                                            <div className="rounded-2xl border-2 border-grape-100 bg-gradient-to-r from-grape-50/50 to-bubblegum-50/30 p-3">
                                                                <p className="text-[11px] text-grape-400 uppercase tracking-wide font-semibold mb-1">Mata Anggaran yang Dipilih</p>
                                                                <p className="text-sm text-bubblegum-800 font-medium">{form.kode_rekening}</p>
                                                                <p className="text-xs text-bubblegum-500 mt-0.5">{form.uraian_rekening}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : !showStep2 ? null : (
                        <div className="glass-card rounded-3xl p-6 border-2 border-dashed border-bubblegum-200 opacity-50">
                            <h2 className="text-lg font-bold text-bubblegum-400 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-bubblegum-200 text-white flex items-center justify-center text-xs font-bold">
                                    <FiMapPin className="text-sm" />
                                </span>
                                Surat Perjalanan Dinas
                                <span className="text-xs font-normal text-bubblegum-300 ml-2">— Lengkapi Informasi Surat terlebih dahulu</span>
                            </h2>
                        </div>
                    )}
                    {/* ══════════════════════════════
                        Section 4: Pegawai
                    ══════════════════════════════ */}
                    {showStep4 ? (
                        <div id="field-pegawai" className="glass-card rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-candy-500 to-bubblegum-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                        <FiUsers className="text-sm" />
                                    </span>
                                    Pegawai yang Ditugaskan
                                    {form.pegawai.length > 0 && (
                                        <span className="ml-1 px-2.5 py-0.5 rounded-full bg-bubblegum-100 text-bubblegum-600 text-xs font-bold">
                                            {form.pegawai.length}{!form.has_spd ? ' / 1' : ''}
                                        </span>
                                    )}
                                </h2>
                                <button
                                    type="button"
                                    disabled={pegawaiLimitReached}
                                    onClick={() => {
                                        setShowPegawaiModal(true);
                                        setPegawaiResults([]);
                                        if (isBupatiPemberiPerintah) {
                                            // Bupati: allow picking from any OPD, start with first
                                            const firstSkpd = allSkpdOptions[0]?.value as number | undefined;
                                            setSelectedSkpd(firstSkpd ?? null);
                                            if (firstSkpd) searchPegawai(firstSkpd);
                                        } else {
                                            // Normal: auto-select user's OPD
                                            const userInst = instances.find((i) => i.id === user?.instance_id);
                                            if (userInst?.id_eoffice != null) {
                                                setSelectedSkpd(userInst.id_eoffice);
                                                searchPegawai(userInst.id_eoffice);
                                            } else {
                                                searchPegawai();
                                            }
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-lg shadow-bubblegum-300/40 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] ${pegawaiLimitReached
                                        ? 'bg-bubblegum-300 cursor-not-allowed opacity-60 hover:scale-100'
                                        : 'bg-gradient-to-r from-bubblegum-500 to-grape-500'
                                        }`}
                                >
                                    <FiPlus className="text-base" />
                                    Tambah Pegawai
                                </button>
                            </div>

                            {!form.has_spd && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
                                    <span>&#9888;&#65039;</span> Surat Tugas tanpa SPD hanya dapat menugaskan <strong>1 pegawai</strong>. Aktifkan SPD untuk menambah lebih dari 1 pegawai.
                                </div>
                            )}

                            {form.pegawai.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-bubblegum-300 border-2 border-dashed border-bubblegum-200 rounded-2xl bg-bubblegum-50/30">
                                    <FiUsers className="text-4xl mb-2" />
                                    <p className="text-sm font-medium">Belum ada pegawai ditambahkan</p>
                                    <p className="text-xs text-bubblegum-300 mt-0.5">Klik &quot;Tambah Pegawai&quot; untuk mulai</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {form.pegawai.map((p, idx) => (
                                        <div
                                            key={p.nip}
                                            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 border-2 border-bubblegum-100 hover:border-bubblegum-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-bubblegum-400 to-grape-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-bubblegum-800 text-sm">{p.nama_lengkap}</p>
                                                    <p className="text-xs text-bubblegum-400 mt-0.5">
                                                        NIP: {p.nip}
                                                        {p.jabatan && <span className="ml-2">&bull; {p.jabatan}</span>}
                                                        {p.golongan && <span className="ml-2">&bull; {p.golongan}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePegawai(p.nip)}
                                                className="p-2 rounded-xl text-red-300 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                title="Hapus pegawai"
                                            >
                                                <FiTrash2 className="text-sm" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : !showStep2 ? null : (
                        <div className="glass-card rounded-3xl p-6 border-2 border-dashed border-bubblegum-200 opacity-50">
                            <h2 className="text-lg font-bold text-bubblegum-400 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-bubblegum-200 text-white flex items-center justify-center text-xs font-bold">
                                    <FiUsers className="text-sm" />
                                </span>
                                Pegawai yang Ditugaskan
                                <span className="text-xs font-normal text-bubblegum-300 ml-2">— Lengkapi Informasi Surat terlebih dahulu</span>
                            </h2>
                        </div>
                    )}

                    {/* ══════════════════════════════
                        Section 5: Penandatangan
                    ══════════════════════════════ */}
                    {showStep5 ? (
                        <div id="field-penandatangan" className="glass-card rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint-400 to-candy-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                    <FiAward className="text-sm" />
                                </span>
                                Penandatangan & Info Tambahan
                            </h2>

                            {/* Penandatangan (disabled — sementara sama dengan Pemberi Perintah) */}
                            <div className="opacity-60">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">
                                    Penandatangan
                                    <span className="text-xs font-normal text-bubblegum-400 ml-2">(otomatis dari Pemberi Perintah)</span>
                                </label>
                                <div className="flex gap-2">
                                    <div
                                        className={`input-field flex-1 text-left flex items-center gap-2 cursor-not-allowed bg-gray-50 ${form.penandatangan_nama ? '' : 'text-bubblegum-300'}`}
                                    >
                                        <FiSearch className="text-bubblegum-300 text-sm shrink-0" />
                                        {form.penandatangan_nama ? (
                                            <span className="text-bubblegum-800">
                                                {form.penandatangan_nama}
                                                {form.penandatangan_jabatan && (
                                                    <span className="text-bubblegum-400 font-normal"> &mdash; {form.penandatangan_jabatan}</span>
                                                )}
                                            </span>
                                        ) : (
                                            <span>Otomatis terisi dari Pemberi Perintah</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Instansi Penandatangan (disabled — sementara sama dengan Pemberi Perintah) */}
                            <div className="opacity-60">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">
                                    Instansi Penandatangan
                                    <span className="text-xs font-normal text-bubblegum-400 ml-2">(otomatis dari Pemberi Perintah)</span>
                                </label>
                                <SearchableSelect
                                    options={instanceOptions}
                                    value={selectedPenandatanganInstance}
                                    onChange={handleInstanceSelect}
                                    isLoading={instancesLoading}
                                    placeholder="Cari instansi penandatangan..."
                                    noOptionsMessage="Tidak ada instansi"
                                    isDisabled
                                />
                            </div>

                            {/* Pejabat Pembuat Komitmen (PPK) — select or auto-filled */}
                            <div className="border border-bubblegum-200 rounded-2xl p-4 bg-bubblegum-50/30">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-2">
                                    <FiUserCheck className="inline -mt-0.5 mr-1" />
                                    Pejabat Pembuat Komitmen (PPK)
                                    {ppkOptions.length <= 1 && (
                                        <span className="text-xs font-normal text-bubblegum-400 ml-2">(otomatis dari Master PPK)</span>
                                    )}
                                </label>
                                {ppkOptions.length > 1 && (
                                    <div className="mb-3">
                                        <SearchableSelect
                                            options={ppkOptions}
                                            value={selectedPpk}
                                            onChange={(opt) => {
                                                setSelectedPpk(opt);
                                                if (opt && opt.data) {
                                                    const ppk = opt.data as { nama: string; nip: string; jabatan?: string; pangkat?: string; golongan?: string; instance_id?: number };
                                                    setForm(prev => ({
                                                        ...prev,
                                                        ppk_nama: ppk.nama || '',
                                                        ppk_nip: ppk.nip || '',
                                                        ppk_jabatan: ppk.jabatan || '',
                                                        ppk_pangkat: ppk.pangkat || '',
                                                        ppk_golongan: ppk.golongan || '',
                                                        ppk_instance_id: ppk.instance_id || null,
                                                    }));
                                                } else {
                                                    setForm(prev => ({
                                                        ...prev,
                                                        ppk_nama: '',
                                                        ppk_nip: '',
                                                        ppk_jabatan: '',
                                                        ppk_pangkat: '',
                                                        ppk_golongan: '',
                                                        ppk_instance_id: null,
                                                    }));
                                                }
                                            }}
                                            isLoading={ppkLoading}
                                            placeholder="Pilih PPK..."
                                            noOptionsMessage="Tidak ada PPK aktif"
                                            isDisabled={isReadOnly}
                                        />
                                    </div>
                                )}
                                {form.ppk_nama ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-bubblegum-800">{form.ppk_nama}</span>
                                            {form.ppk_jabatan && (
                                                <span className="text-xs text-bubblegum-400">&mdash; {form.ppk_jabatan}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            NIP: {form.ppk_nip}
                                            {(form.ppk_pangkat || form.ppk_golongan) && (
                                                <> &middot; {[form.ppk_pangkat, form.ppk_golongan].filter(Boolean).join(' / ')}</>
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-bubblegum-400 italic">
                                        {ppkLoading ? 'Memuat data PPK...' : 'Belum ada PPK yang ditetapkan untuk OPD Anda. Hubungi Super Admin untuk mengatur Master PPK.'}
                                    </p>
                                )}
                            </div>

                            {/* Tempat & Tanggal */}
                            <div id="field-tempat-tanggal" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Tempat Dikeluarkan <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={form.tempat_dikeluarkan}
                                        onChange={(e) => setForm((p) => ({ ...p, tempat_dikeluarkan: e.target.value }))}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Tanggal Dikeluarkan <span className="text-red-400">*</span></label>
                                    <input
                                        type="date"
                                        value={form.tanggal_dikeluarkan}
                                        onChange={(e) => setForm((p) => ({ ...p, tanggal_dikeluarkan: e.target.value }))}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div id="field-keterangan">
                                <label className="block text-sm font-semibold text-bubblegum-700 mb-1.5">Keterangan</label>
                                <textarea
                                    rows={3}
                                    placeholder="Keterangan tambahan (opsional)..."
                                    value={form.keterangan}
                                    onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
                                    className="input-field resize-none"
                                />
                            </div>
                        </div>
                    ) : !showStep4 ? null : (
                        <div className="glass-card rounded-3xl p-6 border-2 border-dashed border-bubblegum-200 opacity-50">
                            <h2 className="text-lg font-bold text-bubblegum-400 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-bubblegum-200 text-white flex items-center justify-center text-xs font-bold">
                                    <FiAward className="text-sm" />
                                </span>
                                Penandatangan & Info Tambahan
                                <span className="text-xs font-normal text-bubblegum-300 ml-2">— Tambahkan pegawai terlebih dahulu</span>
                            </h2>
                        </div>
                    )}

                    {/* ══════════════════════════════
                        Submit Buttons
                    ══════════════════════════════ */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-2xl border-2 border-bubblegum-200 text-bubblegum-600 font-semibold text-sm hover:bg-white/60 hover:border-bubblegum-300 transition-all"
                        >
                            Batal
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white font-semibold text-sm shadow-lg shadow-bubblegum-300/40 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-[0.98]"
                            >
                                <FiSave className="text-base" />
                                {saving ? 'Menyimpan...' : isEdit ? 'Perbarui Surat Tugas' : 'Simpan Draft'}
                            </button>
                        )}
                    </div>
                </fieldset>
            </form>

            {/* ══════════════════════════════
          Pemberi Perintah Search Modal
      ══════════════════════════════ */}
            {showPemberiPerintahModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-bubblegum-100">
                        <div className="p-5 border-b border-bubblegum-100 flex items-center justify-between bg-gradient-to-r from-grape-50 to-bubblegum-50 rounded-t-3xl">
                            <h3 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2">
                                <FiUserCheck className="text-grape-500" /> Pilih Pemberi Perintah
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPemberiPerintahModal(false)}
                                className="p-2 rounded-xl hover:bg-white/60 text-bubblegum-400 hover:text-bubblegum-600 transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 border-b border-bubblegum-50">
                            <p className="text-xs text-bubblegum-400">
                                Menampilkan pejabat dari OPD Anda atau Bupati
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-bubblegum-500 mb-1 uppercase tracking-wide">Filter SKPD</label>
                                <SearchableSelect
                                    options={pemberiPerintahSkpdOptions}
                                    value={pemberiPerintahSkpdOptions.find((o) => o.value === pemberiPerintahSkpd) ?? null}
                                    isLoading={instancesLoading}
                                    onChange={(opt) => {
                                        const val = opt ? Number(opt.value) : null;
                                        setPemberiPerintahSkpd(val);
                                        if (val === BUPATI_SENTINEL) {
                                            // Auto-select Bupati and close modal
                                            autoSelectBupati();
                                        } else if (val) {
                                            const valIdEoffice = instances.find((inst) => inst.id === val)?.id_eoffice ?? null;
                                            searchPemberiPerintah(valIdEoffice ?? undefined);
                                        } else {
                                            searchPemberiPerintah();
                                        }
                                    }}
                                    placeholder="Pilih OPD Anda atau Bupati..."
                                    noOptionsMessage="Tidak ada SKPD"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bubblegum-300" />
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama atau NIP..."
                                        value={pemberiPerintahSearchTerm}
                                        onChange={(e) => setPemberiPerintahSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const isBupati = pemberiPerintahSkpd === BUPATI_SENTINEL;
                                                const skpdEoffice = pemberiPerintahSkpd && pemberiPerintahSkpd !== BUPATI_SENTINEL
                                                    ? instances.find((inst) => inst.id === pemberiPerintahSkpd)?.id_eoffice ?? undefined
                                                    : undefined;
                                                searchPemberiPerintah(skpdEoffice, isBupati);
                                            }
                                        }}
                                        className="input-field pl-10 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const isBupati = pemberiPerintahSkpd === BUPATI_SENTINEL;
                                        const skpdEoffice = pemberiPerintahSkpd && pemberiPerintahSkpd !== BUPATI_SENTINEL
                                            ? instances.find((inst) => inst.id === pemberiPerintahSkpd)?.id_eoffice ?? undefined
                                            : undefined;
                                        searchPemberiPerintah(skpdEoffice, isBupati);
                                    }}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-grape-500 to-bubblegum-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                                >
                                    Cari
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {pemberiPerintahLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 rounded-full border-3 border-grape-200 border-t-grape-500 animate-spin" />
                                    <p className="text-xs text-bubblegum-400 mt-3">Memuat data pejabat...</p>
                                </div>
                            ) : pemberiPerintahResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-bubblegum-300">
                                    <FiUserCheck className="text-3xl mb-2" />
                                    <p className="text-sm font-medium">Tidak ada pejabat ditemukan</p>
                                    <p className="text-xs mt-0.5">Coba pilih SKPD atau ubah kata kunci</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {pemberiPerintahResults.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => selectPemberiPerintah(p)}
                                            className="w-full text-left p-3.5 rounded-2xl hover:bg-grape-50 hover:border-grape-200 transition-all text-sm border-2 border-transparent active:scale-[0.99]"
                                        >
                                            <p className="font-semibold text-bubblegum-800">{p.nama_lengkap}</p>
                                            <p className="text-xs text-bubblegum-400 mt-0.5">
                                                NIP: {p.nip} {p.jabatan && `&bull; ${p.jabatan}`}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════
          Pegawai Search Modal
      ══════════════════════════════ */}
            {showPegawaiModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-bubblegum-100">
                        <div className="p-5 border-b border-bubblegum-100 flex items-center justify-between bg-gradient-to-r from-bubblegum-50 to-grape-50 rounded-t-3xl">
                            <h3 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2">
                                <FiUsers className="text-bubblegum-500" /> Cari Pegawai
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPegawaiModal(false)}
                                className="p-2 rounded-xl hover:bg-white/60 text-bubblegum-400 hover:text-bubblegum-600 transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 border-b border-bubblegum-50">
                            {!form.has_spd && (
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                                    &#9888;&#65039; Tanpa SPD &mdash; hanya boleh 1 pegawai
                                </div>
                            )}
                            {isBupatiPemberiPerintah && (
                                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                                    &#128101; Pemberi perintah adalah <strong>Bupati</strong> &mdash; hanya menampilkan <strong>Kepala SKPD</strong> dari setiap OPD
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-bubblegum-500 mb-1 uppercase tracking-wide">OPD</label>
                                {isBupatiPemberiPerintah ? (
                                    <>
                                        <SearchableSelect
                                            options={allSkpdOptions}
                                            value={allSkpdOptions.find((o) => o.value === selectedSkpd) ?? null}
                                            onChange={(opt) => {
                                                const skpdId = opt ? (opt.value as number) : null;
                                                setSelectedSkpd(skpdId);
                                                if (skpdId) searchPegawai(skpdId);
                                                else setPegawaiResults([]);
                                            }}
                                            placeholder="Pilih OPD..."
                                        />
                                        <p className="text-xs text-bubblegum-400 mt-1">Pilih OPD untuk melihat Kepala SKPD-nya</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="input-field text-sm bg-bubblegum-50/50 cursor-not-allowed opacity-80">
                                            {pegawaiSkpdOption ? pegawaiSkpdOption.label : 'OPD tidak ditemukan'}
                                        </div>
                                        <p className="text-xs text-bubblegum-400 mt-1">Hanya dapat menambahkan pegawai dari OPD yang sama</p>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bubblegum-300" />
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama atau NIP..."
                                        value={pegawaiSearchTerm}
                                        onChange={(e) => setPegawaiSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchPegawai(selectedSkpd ?? undefined)}
                                        className="input-field pl-10 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => searchPegawai(selectedSkpd ?? undefined)}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                                >
                                    Cari
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {pegawaiLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 rounded-full border-3 border-bubblegum-200 border-t-bubblegum-500 animate-spin" />
                                    <p className="text-xs text-bubblegum-400 mt-3">Memuat data pegawai...</p>
                                </div>
                            ) : pegawaiResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-bubblegum-300">
                                    <FiUsers className="text-3xl mb-2" />
                                    <p className="text-sm font-medium">Tidak ada data pegawai</p>
                                    <p className="text-xs mt-0.5">Coba pilih SKPD atau ubah kata kunci</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {pegawaiResults.map((p) => {
                                        const alreadyAdded = form.pegawai.some((e) => e.nip === p.nip);
                                        const limitHit = !form.has_spd && form.pegawai.length >= 1 && !alreadyAdded;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                disabled={alreadyAdded || limitHit}
                                                onClick={() => addPegawai(p)}
                                                className={`w-full text-left p-3.5 rounded-2xl transition-all text-sm border-2 ${alreadyAdded
                                                    ? 'bg-mint-50 border-mint-200 opacity-60 cursor-not-allowed'
                                                    : limitHit
                                                        ? 'bg-gray-50 border-gray-200 opacity-40 cursor-not-allowed'
                                                        : 'border-transparent hover:bg-bubblegum-50 hover:border-bubblegum-200 active:scale-[0.99]'
                                                    }`}
                                            >
                                                <p className="font-semibold text-bubblegum-800">
                                                    {p.nama_lengkap}
                                                    {isBupatiPemberiPerintah && (p.kepala_skpd === 'Y' || p.jenis_pegawai?.toLowerCase() === 'kepala') && (
                                                        <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Kepala SKPD</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-bubblegum-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                                    <span>NIP: {p.nip}</span>
                                                    {p.jabatan && <span>&bull; {p.jabatan}</span>}
                                                    {p.golongan && <span>&bull; Gol. {p.golongan}</span>}
                                                    {alreadyAdded && (
                                                        <span className="text-mint-600 font-semibold bg-mint-100 px-2 py-0.5 rounded-full">&#10003; Sudah ditambahkan</span>
                                                    )}
                                                    {limitHit && (
                                                        <span className="text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">Batas 1 pegawai</span>
                                                    )}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════
          Penandatangan Search Modal
      ══════════════════════════════ */}
            {showPenandatanganModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-bubblegum-100">
                        <div className="p-5 border-b border-bubblegum-100 flex items-center justify-between bg-gradient-to-r from-grape-50 to-mint-50 rounded-t-3xl">
                            <h3 className="text-lg font-bold text-bubblegum-700 flex items-center gap-2">
                                <FiAward className="text-grape-500" /> Pilih Penandatangan
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPenandatanganModal(false)}
                                className="p-2 rounded-xl hover:bg-white/60 text-bubblegum-400 hover:text-bubblegum-600 transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 border-b border-bubblegum-50">
                            <div>
                                <label className="block text-xs font-semibold text-bubblegum-500 mb-1 uppercase tracking-wide">Filter SKPD</label>
                                <select
                                    value={penandatanganSkpd ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value) : null;
                                        setPenandatanganSkpd(val);
                                        searchPenandatangan(val ?? undefined);
                                    }}
                                    className="input-field text-sm"
                                >
                                    <option value="">Semua SKPD</option>
                                    {instances.map((inst) => (
                                        <option key={inst.id} value={inst.id_eoffice ?? ''}>{inst.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bubblegum-300" />
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama atau NIP..."
                                        value={penandatanganSearchTerm}
                                        onChange={(e) => setPenandatanganSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchPenandatangan(penandatanganSkpd ?? undefined)}
                                        className="input-field pl-10 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => searchPenandatangan(penandatanganSkpd ?? undefined)}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-grape-500 to-candy-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                                >
                                    Cari
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {penandatanganLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 rounded-full border-3 border-grape-200 border-t-grape-500 animate-spin" />
                                    <p className="text-xs text-bubblegum-400 mt-3">Memuat data pegawai...</p>
                                </div>
                            ) : penandatanganResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-bubblegum-300">
                                    <FiAward className="text-3xl mb-2" />
                                    <p className="text-sm font-medium">Tidak ada data pegawai</p>
                                    <p className="text-xs mt-0.5">Coba pilih SKPD atau ubah kata kunci</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {penandatanganResults.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => selectPenandatangan(p)}
                                            className="w-full text-left p-3.5 rounded-2xl hover:bg-grape-50 hover:border-grape-200 transition-all text-sm border-2 border-transparent active:scale-[0.99]"
                                        >
                                            <p className="font-semibold text-bubblegum-800">{p.nama_lengkap}</p>
                                            <p className="text-xs text-bubblegum-400 mt-0.5">
                                                NIP: {p.nip} {p.jabatan && `&bull; ${p.jabatan}`}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
