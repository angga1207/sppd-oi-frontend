'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FiFileText, FiUsers, FiDollarSign, FiMapPin,
  FiTrendingUp, FiTrendingDown, FiNavigation, FiClock,
  FiFilter, FiX, FiBarChart2, FiPieChart,
  FiCalendar, FiChevronDown, FiChevronUp,
  FiDownload, FiActivity, FiLayers, FiGrid,
  FiTable, FiArrowUp, FiArrowDown, FiMinus,
  FiSearch, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import api from '@/lib/api';
import SearchableSelect from '@/components/SearchableSelect';
import type { SelectOption } from '@/components/SearchableSelect';
import type {
  ReportData, ReportInstanceItem, SuratTugas,
  PaginatedResponse, ActiveTripItem,
} from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Legend,
} from 'recharts';

// ─── Constants ───────────────────────────────────
const MONTHS_ID = [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'ditandatangani', label: 'Ditandatangani' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'selesai', label: 'Selesai' },
];

const JENIS_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'luar_kabupaten', label: 'Luar Kabupaten' },
  { value: 'dalam_kabupaten', label: 'Dalam Kabupaten' },
];

const COLORS = {
  primary: '#e91e8c',
  secondary: '#a855f7',
  tertiary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  grape: '#8b5cf6',
};

const PIE_COLORS = ['#e91e8c', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  dikirim: '#f59e0b',
  ditandatangani: '#10b981',
  ditolak: '#ef4444',
  selesai: '#e91e8c',
};

// ─── Formatters ──────────────────────────────────
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`;
  return formatRupiah(value);
}

// ─── Shared Components ───────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-bubblegum-100/50 p-3.5 text-sm">
      <p className="font-semibold text-bubblegum-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <strong>{typeof p.value === 'number' && p.dataKey?.includes('biaya') ? formatRupiah(p.value) : formatNumber(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function BiayaTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-bubblegum-100/50 p-3.5 text-sm">
      <p className="font-semibold text-bubblegum-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <strong>{formatRupiah(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) return <span className="inline-flex items-center gap-0.5 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5"><FiArrowUp className="w-3 h-3" />{value}%</span>;
  if (value < 0) return <span className="inline-flex items-center gap-0.5 text-xs font-semibold bg-red-50 text-red-600 rounded-full px-2 py-0.5"><FiArrowDown className="w-3 h-3" />{Math.abs(value)}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs font-semibold bg-gray-50 text-gray-500 rounded-full px-2 py-0.5"><FiMinus className="w-3 h-3" />0%</span>;
}

function SkeletonCard() {
  return <div className="glass-card rounded-3xl p-5 animate-pulse"><div className="h-12 w-12 rounded-2xl bg-bubblegum-200 mb-3" /><div className="h-8 w-20 rounded-lg bg-bubblegum-100 mb-2" /><div className="h-4 w-32 rounded bg-bubblegum-100" /></div>;
}

function SkeletonChart() {
  return <div className="glass-card rounded-3xl p-6 animate-pulse"><div className="h-5 w-48 rounded bg-bubblegum-100 mb-4" /><div className="h-64 rounded-2xl bg-bubblegum-50" /></div>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-bubblegum-400 to-grape-500 flex items-center justify-center shadow-lg shadow-bubblegum-300/30">
        <Icon className="text-white text-lg" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-bubblegum-800">{title}</h3>
        {subtitle && <p className="text-xs text-bubblegum-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────
type TabId = 'overview' | 'charts' | 'table';

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
        active
          ? 'bg-linear-to-r from-bubblegum-500 to-grape-500 text-white shadow-lg shadow-bubblegum-300/40 scale-[1.02]'
          : 'bg-white/60 text-bubblegum-600 hover:bg-white hover:text-bubblegum-700 hover:shadow-md'
      }`}
    >
      <Icon className="text-base" /> {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════
// Main Report Page
// ═══════════════════════════════════════════════════
export default function LaporanPage() {
  // ─── State ─────────────────────────────────────
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [jenisPerjalanan, setJenisPerjalanan] = useState('');
  const [status, setStatus] = useState('');
  const [instances, setInstances] = useState<ReportInstanceItem[]>([]);

  // Detail table
  const [tableData, setTableData] = useState<PaginatedResponse<SuratTugas> | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tableSearch, setTableSearch] = useState('');
  const [tableSortBy, setTableSortBy] = useState('tanggal_dikeluarkan');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('desc');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const opts = [];
    for (let y = current; y >= current - 5; y--) opts.push(y);
    return opts;
  }, []);

  // ─── Data Fetching ─────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { year };
      if (month) params.month = month;
      if (instanceId) params.instance_id = instanceId;
      if (jenisPerjalanan) params.jenis_perjalanan = jenisPerjalanan;
      if (status) params.status = status;

      const res = await api.get('/reports', { params });
      if (res.data.success) setData(res.data.data);
    } catch { /* fail silently */ } finally {
      setLoading(false);
    }
  }, [year, month, instanceId, jenisPerjalanan, status]);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await api.get('/reports/instances');
      if (res.data.success) setInstances(res.data.data);
    } catch { /* */ }
  }, []);

  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const params: Record<string, string | number> = { year, page: tablePage, per_page: 15, sort_by: tableSortBy, sort_dir: tableSortDir };
      if (month) params.month = month;
      if (instanceId) params.instance_id = instanceId;
      if (jenisPerjalanan) params.jenis_perjalanan = jenisPerjalanan;
      if (status) params.status = status;
      if (tableSearch) params.search = tableSearch;

      const res = await api.get('/reports/detail-table', { params });
      if (res.data.success) setTableData(res.data.data);
    } catch { /* */ } finally {
      setTableLoading(false);
    }
  }, [year, month, instanceId, jenisPerjalanan, status, tablePage, tableSearch, tableSortBy, tableSortDir]);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);
  useEffect(() => { fetchReport(); }, [fetchReport]);
  useEffect(() => { if (activeTab === 'table') fetchTable(); }, [activeTab, fetchTable]);

  // Reset table page on filter change
  useEffect(() => { setTablePage(1); }, [year, month, instanceId, jenisPerjalanan, status, tableSearch]);

  const activeFilterCount = [month, instanceId, jenisPerjalanan, status].filter(Boolean).length;

  const clearFilters = () => {
    setMonth(''); setInstanceId(''); setJenisPerjalanan(''); setStatus('');
  };

  // ─── Render ────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-bubblegum-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-bubblegum-500 to-grape-500 flex items-center justify-center shadow-lg shadow-bubblegum-300/40">
                <FiBarChart2 className="text-white text-lg" />
              </div>
              Laporan & Analisis
            </h1>
            <p className="text-bubblegum-500 mt-1 ml-13">Analisis komprehensif data surat tugas dan perjalanan dinas</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Year selector */}
            <div className="w-44">
              <SearchableSelect
                options={yearOptions.map((y) => ({ value: y, label: `Tahun ${y}` }))}
                value={{ value: year, label: `Tahun ${year}` }}
                onChange={(opt) => { if (opt) setYear(Number(opt.value)); }}
                placeholder="Tahun"
                isClearable={false}
              />
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 shadow-sm ${
                filtersOpen || activeFilterCount > 0
                  ? 'bg-linear-to-r from-bubblegum-500 to-grape-500 text-white shadow-bubblegum-300/40'
                  : 'bg-white border border-bubblegum-200 text-bubblegum-600 hover:bg-bubblegum-50'
              }`}
            >
              <FiFilter className="text-base" />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white/30 text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
              {filtersOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>
        </div>

        {/* ═══ Filters Panel ═══ */}
        {filtersOpen && (
          <div className="mt-5 pt-5 border-t border-bubblegum-100/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-bubblegum-500 mb-1.5 block">Bulan</label>
                <SearchableSelect
                  options={MONTHS_ID.map((m) => ({ value: m.value, label: m.label })) as SelectOption[]}
                  value={month ? (MONTHS_ID.find((m) => m.value === month) ? { value: month, label: MONTHS_ID.find((m) => m.value === month)!.label } : null) : null}
                  onChange={(opt) => setMonth(opt ? String(opt.value) : '')}
                  placeholder="Semua Bulan"
                />
              </div>
              {instances.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-bubblegum-500 mb-1.5 block">OPD / Instansi</label>
                  <SearchableSelect
                    options={instances.map((i) => ({ value: String(i.id), label: i.name }))}
                    value={instanceId ? (instances.find((i) => String(i.id) === instanceId) ? { value: instanceId, label: instances.find((i) => String(i.id) === instanceId)!.name } : null) : null}
                    onChange={(opt) => setInstanceId(opt ? String(opt.value) : '')}
                    placeholder="Semua OPD"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-bubblegum-500 mb-1.5 block">Jenis Perjalanan</label>
                <SearchableSelect
                  options={JENIS_OPTIONS.filter((j) => j.value !== '').map((j) => ({ value: j.value, label: j.label })) as SelectOption[]}
                  value={jenisPerjalanan ? (JENIS_OPTIONS.find((j) => j.value === jenisPerjalanan) ? { value: jenisPerjalanan, label: JENIS_OPTIONS.find((j) => j.value === jenisPerjalanan)!.label } : null) : null}
                  onChange={(opt) => setJenisPerjalanan(opt ? String(opt.value) : '')}
                  placeholder="Semua Jenis"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-bubblegum-500 mb-1.5 block">Status</label>
                <SearchableSelect
                  options={STATUS_OPTIONS.filter((s) => s.value !== '').map((s) => ({ value: s.value, label: s.label })) as SelectOption[]}
                  value={status ? (STATUS_OPTIONS.find((s) => s.value === status) ? { value: status, label: STATUS_OPTIONS.find((s) => s.value === status)!.label } : null) : null}
                  onChange={(opt) => setStatus(opt ? String(opt.value) : '')}
                  placeholder="Semua Status"
                />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <button onClick={clearFilters} className="text-xs text-bubblegum-500 hover:text-bubblegum-700 flex items-center gap-1 underline underline-offset-2">
                  <FiX className="w-3 h-3" /> Hapus semua filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Tab Navigation ═══ */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={FiGrid} label="Ringkasan" />
        <TabButton active={activeTab === 'charts'} onClick={() => setActiveTab('charts')} icon={FiPieChart} label="Grafik & Analisis" />
        <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')} icon={FiTable} label="Data Detail" />
      </div>

      {/* ═══ Tab Content ═══ */}
      {activeTab === 'overview' && <OverviewTab data={data} loading={loading} year={year} />}
      {activeTab === 'charts' && <ChartsTab data={data} loading={loading} />}
      {activeTab === 'table' && (
        <DetailTableTab
          data={tableData}
          loading={tableLoading}
          search={tableSearch}
          onSearchChange={setTableSearch}
          page={tablePage}
          onPageChange={setTablePage}
          sortBy={tableSortBy}
          sortDir={tableSortDir}
          onSort={(col) => {
            if (col === tableSortBy) setTableSortDir(d => d === 'asc' ? 'desc' : 'asc');
            else { setTableSortBy(col); setTableSortDir('desc'); }
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Overview Tab
// ═══════════════════════════════════════════════════
function OverviewTab({ data, loading, year }: { data: ReportData | null; loading: boolean; year: number }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({ length: 4 }).map((_, i) => <SkeletonChart key={i} />)}</div>
      </div>
    );
  }
  if (!data) return <EmptyState />;

  const { overview, comparison_prev_year: cmp, trend_bulanan: rawTrend, status_distribution, jenis_perjalanan_breakdown, biaya_analysis } = data;
  const activeTrips = data.active_trips ?? [];

  // Surat selesai sudah pasti ditandatangani, jadi gabungkan ke hitungan ditandatangani
  const trend_bulanan = rawTrend.map((item) => ({
    ...item,
    ditandatangani: (item.ditandatangani || 0) + (item.selesai || 0),
  }));

  return (
    <div className="space-y-6">
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={FiFileText} title="Surat Tugas" value={overview.total_surat_tugas}
          gradient="from-bubblegum-400 to-bubblegum-600" shadow="shadow-bubblegum-300/40"
          growth={cmp.surat_tugas.growth_percent} prevValue={cmp.surat_tugas.previous}
        />
        <StatCard
          icon={FiNavigation} title="SPD" value={overview.total_spd}
          gradient="from-grape-400 to-grape-600" shadow="shadow-grape-300/40"
          growth={cmp.spd.growth_percent} prevValue={cmp.spd.previous}
        />
        <StatCard
          icon={FiUsers} title="Pegawai" value={overview.total_pegawai_ditugaskan}
          gradient="from-blue-400 to-blue-600" shadow="shadow-blue-300/40"
          subtitle="untuk ditugaskan"
        />
        <StatCard
          icon={FiDollarSign} title="Total Biaya" value={formatRupiahShort(overview.total_biaya)}
          gradient="from-emerald-400 to-emerald-600" shadow="shadow-emerald-300/40"
          growth={cmp.biaya.growth_percent} isRupiah
        />
        <StatCard
          icon={FiClock} title="Rata-rata Durasi" value={`${overview.rata_rata_lama_perjalanan} hari`}
          gradient="from-amber-400 to-amber-600" shadow="shadow-amber-300/40"
        />
        <StatCard
          icon={FiMapPin} title="Destinasi" value={overview.total_destinasi}
          gradient="from-cyan-400 to-cyan-600" shadow="shadow-cyan-300/40"
          subtitle="kab/kota tujuan"
        />
      </div>

      {/* ─── Active Trips ─── */}
      {activeTrips.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border-l-4 border-emerald-400">
          <SectionTitle icon={FiActivity} title={`Perjalanan Dinas Aktif (${activeTrips.length})`} subtitle="Sedang dalam perjalanan dinas saat ini" />
          <div className="space-y-3">
            {activeTrips.map((trip: ActiveTripItem) => {
              const daysLeft = trip.tanggal_kembali
                ? Math.max(0, Math.ceil((new Date(trip.tanggal_kembali).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <a
                  key={trip.id}
                  href={`/dashboard/surat-tugas/${trip.id}`}
                  className="block rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 hover:border-emerald-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <FiNavigation className="text-sm" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-bubblegum-800 group-hover:text-emerald-700 transition-colors">
                          {trip.nomor_surat || 'Belum bernomor'}
                        </h4>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                          Aktif
                        </span>
                        {daysLeft !== null && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {daysLeft === 0 ? 'Kembali hari ini' : `${daysLeft} hari lagi`}
                          </span>
                        )}
                      </div>
                      {trip.untuk && (
                        <p className="text-xs text-bubblegum-500 mt-1 line-clamp-1" dangerouslySetInnerHTML={{ __html: trip.untuk }} />
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-bubblegum-400 flex-wrap">
                        {trip.tujuan_kabupaten_nama && (
                          <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {trip.tujuan_kabupaten_nama}</span>
                        )}
                        {trip.tanggal_berangkat && (
                          <span className="flex items-center gap-1">
                            <FiCalendar className="text-[10px]" />
                            {new Date(trip.tanggal_berangkat).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            {trip.tanggal_kembali ? ` — ${new Date(trip.tanggal_kembali).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                          </span>
                        )}
                        {trip.instance && (
                          <span className="flex items-center gap-1"><FiUsers className="text-[10px]" /> {trip.instance.name}</span>
                        )}
                      </div>
                      {trip.pegawai && trip.pegawai.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                          {trip.pegawai.slice(0, 3).map((p) => (
                            <span key={p.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white border border-bubblegum-100 text-bubblegum-600">
                              {p.nama_lengkap}
                            </span>
                          ))}
                          {trip.pegawai.length > 3 && (
                            <span className="text-[10px] text-bubblegum-400">+{trip.pegawai.length - 3} lainnya</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Year Comparison Banner ─── */}
      <div className="glass-card rounded-3xl p-6 border-l-4 border-grape-400">
        <h3 className="text-sm font-bold text-bubblegum-700 mb-3 flex items-center gap-2">
          <FiActivity className="text-grape-500" /> Perbandingan Tahun {cmp.tahun_lalu} vs {cmp.tahun_ini}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ComparisonCard label="Surat Tugas" current={cmp.surat_tugas.current} previous={cmp.surat_tugas.previous} growth={cmp.surat_tugas.growth_percent} />
          <ComparisonCard label="SPD" current={cmp.spd.current} previous={cmp.spd.previous} growth={cmp.spd.growth_percent} />
          <ComparisonCard label="Biaya" current={cmp.biaya.current} previous={cmp.biaya.previous} growth={cmp.biaya.growth_percent} isRupiah />
        </div>
      </div>

      {/* ─── Mini Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiTrendingUp} title="Tren Bulanan" subtitle={`Tahun ${year}`} />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend_bulanan}>
              <defs>
                <linearGradient id="gradST" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSPD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9a7c9a' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="total_st" name="Surat Tugas" stroke={COLORS.primary} fill="url(#gradST)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.primary }} />
              <Area type="monotone" dataKey="total_spd" name="SPD" stroke={COLORS.secondary} fill="url(#gradSPD)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.secondary }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiPieChart} title="Distribusi Status" subtitle="Surat Tugas" />
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={280}>
              <PieChart>
                <Pie data={status_distribution.filter(s => s.total > 0)} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius="85%" innerRadius="55%" paddingAngle={3} strokeWidth={0}>
                  {status_distribution.filter(s => s.total > 0).map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number | undefined) => formatNumber(val ?? 0)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {status_distribution.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                  <span className="text-bubblegum-600 flex-1 truncate">{s.label}</span>
                  <span className="font-bold text-bubblegum-800">{s.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Jenis Perjalanan & Biaya ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jenis Perjalanan */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiNavigation} title="Jenis Perjalanan Dinas" />
          <div className="space-y-4 mt-2">
            {jenis_perjalanan_breakdown.map((j, i) => {
              const total = jenis_perjalanan_breakdown.reduce((a, b) => a + b.total_st, 0);
              const pct = total > 0 ? (j.total_st / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-bubblegum-700">{j.label}</span>
                    <span className="text-sm font-bold text-bubblegum-800">{j.total_st} ST</span>
                  </div>
                  <div className="h-3 rounded-full bg-bubblegum-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: i === 0 ? `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` : `linear-gradient(90deg, ${COLORS.tertiary}, ${COLORS.info})`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-bubblegum-400 mt-1">{formatRupiah(j.total_biaya)} total biaya</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Biaya Trend */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiDollarSign} title="Tren Anggaran Bulanan" subtitle={formatRupiah(biaya_analysis.total_biaya)} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={biaya_analysis.bulanan} barSize={20}>
              <defs>
                <linearGradient id="gradBiaya" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.success} />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9a7c9a' }} tickFormatter={(v) => formatRupiahShort(v)} />
              <Tooltip content={<BiayaTooltip />} />
              <Bar dataKey="total_biaya" name="Total Biaya" fill="url(#gradBiaya)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-bubblegum-400">Rata-rata per SPD: <strong className="text-bubblegum-700">{formatRupiah(biaya_analysis.rata_rata_per_spd)}</strong></span>
            <span className="text-bubblegum-400">Total SPD: <strong className="text-bubblegum-700">{biaya_analysis.total_spd}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Charts Tab
// ═══════════════════════════════════════════════════
function ChartsTab({ data, loading }: { data: ReportData | null; loading: boolean }) {
  if (loading) {
    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({ length: 8 }).map((_, i) => <SkeletonChart key={i} />)}</div>;
  }
  if (!data) return <EmptyState />;

  const { tingkat_biaya_distribution, top_destinations, top_pegawai, opd_ranking, alat_angkut_distribution, klasifikasi_breakdown, kategori_breakdown, durasi_analysis, biaya_analysis, trend_bulanan: rawTrend } = data;

  // Surat selesai sudah pasti ditandatangani, jadi gabungkan ke hitungan ditandatangani
  const trend_bulanan = rawTrend.map((item) => ({
    ...item,
    ditandatangani: (item.ditandatangani || 0) + (item.selesai || 0),
  }));

  return (
    <div className="space-y-6">
      {/* ─── Row 1: Tingkat Biaya & Alat Angkut ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tingkat Biaya Radar */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiLayers} title="Distribusi Tingkat Biaya SPD" />
          {tingkat_biaya_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={tingkat_biaya_distribution}>
                <PolarGrid stroke="#e8d8e8" />
                <PolarAngleAxis dataKey="tingkat" tick={{ fontSize: 12, fill: '#8b5c8b' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9a7c9a' }} />
                <Radar name="Jumlah SPD" dataKey="total" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : <NoData />}
          <div className="mt-3 space-y-1.5">
            {tingkat_biaya_distribution.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-bubblegum-500 truncate flex-1">{t.label}</span>
                <span className="font-bold text-bubblegum-800 ml-2">{t.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alat Angkut */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiNavigation} title="Moda Transportasi" subtitle="Berdasarkan alat angkut" />
          {alat_angkut_distribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={alat_angkut_distribution}
                    dataKey="total"
                    nameKey="alat_angkut"
                    cx="50%" cy="50%"
                    outerRadius="80%"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                    strokeWidth={0}
                  >
                    {alat_angkut_distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number | undefined, name: string | undefined) => [`${val ?? 0} SPD - ${formatRupiah(alat_angkut_distribution.find(a => a.alat_angkut === (name ?? ''))?.total_biaya ?? 0)}`, name ?? '']} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : <NoData />}
        </div>
      </div>

      {/* ─── Row 2: Destinasi ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Provinsi */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiMapPin} title="Top Provinsi Tujuan" />
          {top_destinations.provinsi.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, top_destinations.provinsi.length * 40)}>
              <BarChart data={top_destinations.provinsi} layout="vertical" barSize={16}>
                <defs>
                  <linearGradient id="gradProv" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.primary} />
                    <stop offset="100%" stopColor={COLORS.secondary} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
                <YAxis type="category" dataKey="tujuan_provinsi_nama" tick={{ fontSize: 11, fill: '#8b5c8b' }} width={130} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total" name="Total ST" fill="url(#gradProv)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </div>

        {/* Top Kab/Kota */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiMapPin} title="Top Kabupaten/Kota Tujuan" />
          {top_destinations.kabupaten.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, top_destinations.kabupaten.length * 40)}>
              <BarChart data={top_destinations.kabupaten} layout="vertical" barSize={16}>
                <defs>
                  <linearGradient id="gradKab" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.tertiary} />
                    <stop offset="100%" stopColor={COLORS.info} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
                <YAxis type="category" dataKey="tujuan_kabupaten_nama" tick={{ fontSize: 11, fill: '#8b5c8b' }} width={140} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total" name="Total ST" fill="url(#gradKab)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </div>
      </div>

      {/* ─── Row 3: Top Pegawai ─── */}
      <div className="glass-card rounded-3xl p-6">
        <SectionTitle icon={FiUsers} title="Pegawai Paling Sering Ditugaskan" subtitle="Top 15" />
        {top_pegawai.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bubblegum-100">
                  <th className="text-left py-3 px-3 text-bubblegum-500 font-semibold">#</th>
                  <th className="text-left py-3 px-3 text-bubblegum-500 font-semibold">Pegawai</th>
                  <th className="text-left py-3 px-3 text-bubblegum-500 font-semibold">Jabatan</th>
                  <th className="text-left py-3 px-3 text-bubblegum-500 font-semibold">OPD</th>
                  <th className="text-right py-3 px-3 text-bubblegum-500 font-semibold">Total Tugas</th>
                </tr>
              </thead>
              <tbody>
                {top_pegawai.map((p, i) => (
                  <tr key={i} className="border-b border-bubblegum-50 hover:bg-bubblegum-50/50 transition-colors">
                    <td className="py-3 px-3">
                      {i < 3 ? (
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                          i === 0 ? 'bg-linear-to-br from-amber-400 to-amber-600' : i === 1 ? 'bg-linear-to-br from-gray-300 to-gray-500' : 'bg-linear-to-br from-orange-300 to-orange-500'
                        }`}>{i + 1}</span>
                      ) : <span className="text-bubblegum-400">{i + 1}</span>}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-bubblegum-800">{p.nama_lengkap}</p>
                      <p className="text-xs text-bubblegum-400">{p.nip}</p>
                    </td>
                    <td className="py-3 px-3 text-bubblegum-600">{p.jabatan || '-'}</td>
                    <td className="py-3 px-3 text-bubblegum-600 max-w-50 truncate">{p.nama_skpd || '-'}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 bg-bubblegum-50 text-bubblegum-700 font-bold px-3 py-1 rounded-full text-xs">
                        {p.total_tugas} tugas
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <NoData />}
      </div>

      {/* ─── Row 4: OPD Ranking ─── */}
      {opd_ranking.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiBarChart2} title="Ranking OPD / Perangkat Daerah" subtitle="Berdasarkan total ST, SPD, dan biaya" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bubblegum-100">
                  <th className="text-left py-3 px-3 text-bubblegum-500 font-semibold">#</th>
                  <th className="text-left py-3 px-3 text-bubblegum-500 font-semibold">OPD</th>
                  <th className="text-right py-3 px-3 text-bubblegum-500 font-semibold">ST</th>
                  <th className="text-right py-3 px-3 text-bubblegum-500 font-semibold">SPD</th>
                  <th className="text-right py-3 px-3 text-bubblegum-500 font-semibold">Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {opd_ranking.map((o, i) => (
                  <tr key={i} className="border-b border-bubblegum-50 hover:bg-bubblegum-50/50 transition-colors">
                    <td className="py-3 px-3 text-bubblegum-400">{i + 1}</td>
                    <td className="py-3 px-3 font-medium text-bubblegum-800">{o.nama}</td>
                    <td className="py-3 px-3 text-right text-bubblegum-700 font-semibold">{o.total_st}</td>
                    <td className="py-3 px-3 text-right text-grape-600 font-semibold">{o.total_spd}</td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-semibold">{formatRupiah(o.total_biaya)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Row 5: Klasifikasi & Kategori ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Klasifikasi */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiLayers} title="Klasifikasi Surat" />
          {klasifikasi_breakdown.length > 0 ? (
            <div className="space-y-3">
              {klasifikasi_breakdown.map((k, i) => {
                const maxTotal = klasifikasi_breakdown[0]?.total || 1;
                const pct = (k.total / maxTotal) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-bubblegum-600 truncate flex-1" title={k.nama}><strong className="text-bubblegum-800">{k.kode}</strong> — {k.nama}</span>
                      <span className="text-xs font-bold text-bubblegum-800 ml-2">{k.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-bubblegum-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <NoData />}
        </div>

        {/* Kategori */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiGrid} title="Kategori Surat" />
          {kategori_breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kategori_breakdown}
                  dataKey="total"
                  nameKey="nama"
                  cx="50%" cy="50%"
                  outerRadius="80%"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#c9a0c9' }}
                  strokeWidth={0}
                >
                  {kategori_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number | undefined) => formatNumber(val ?? 0)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </div>
      </div>

      {/* ─── Row 6: Durasi Analysis & Achievement Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Durasi */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiClock} title="Analisis Durasi Perjalanan" />
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MiniMetric label="Rata-rata" value={`${durasi_analysis.rata_rata} hari`} />
            <MiniMetric label="Terlama" value={`${durasi_analysis.terlama} hari`} />
            <MiniMetric label="Tersingkat" value={`${durasi_analysis.tersingkat} hari`} />
          </div>
          {durasi_analysis.distribusi.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={durasi_analysis.distribusi} barSize={28}>
                <defs>
                  <linearGradient id="gradDurasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.warning} />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9a7c9a' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total" name="Jumlah ST" fill="url(#gradDurasi)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </div>

        {/* Achievement line chart - penandatangan vs selesai  */}
        <div className="glass-card rounded-3xl p-6">
          <SectionTitle icon={FiTrendingUp} title="Progres Penyelesaian Bulanan" />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend_bulanan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9a7c9a' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ditandatangani" name="Ditandatangani (termasuk Selesai)" stroke={COLORS.success} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.success }} />
              <Line type="monotone" dataKey="selesai" name="Selesai" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.primary }} />
              <Line type="monotone" dataKey="total_st" name="Total ST" stroke={COLORS.tertiary} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Row 7: Biaya per Bulan Line + Bar ─── */}
      <div className="glass-card rounded-3xl p-6">
        <SectionTitle icon={FiDollarSign} title="Detail Anggaran Perjalanan Dinas per Bulan" subtitle={`Total: ${formatRupiah(biaya_analysis.total_biaya)} | Rata-rata/SPD: ${formatRupiah(biaya_analysis.rata_rata_per_spd)}`} />
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={biaya_analysis.bulanan} barSize={24}>
            <defs>
              <linearGradient id="gradBiayaFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.9} />
                <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e4f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9a7c9a' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9a7c9a' }} tickFormatter={(v) => formatRupiahShort(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9a7c9a' }} />
            <Tooltip content={<BiayaTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="total_biaya" name="Total Biaya" fill="url(#gradBiayaFull)" radius={[8, 8, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="jumlah_spd" name="Jumlah SPD" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Detail Table Tab
// ═══════════════════════════════════════════════════
function DetailTableTab({
  data, loading, search, onSearchChange, page, onPageChange, sortBy, sortDir, onSort,
}: {
  data: PaginatedResponse<SuratTugas> | null;
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  onPageChange: (p: number) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
}) {
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      dikirim: 'bg-amber-50 text-amber-600',
      ditandatangani: 'bg-emerald-50 text-emerald-600',
      ditolak: 'bg-red-50 text-red-600',
      selesai: 'bg-bubblegum-50 text-bubblegum-600',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const SortIndicator = ({ col }: { col: string }) => {
    if (sortBy !== col) return <FiChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <FiChevronUp className="w-3 h-3 text-bubblegum-500" /> : <FiChevronDown className="w-3 h-3 text-bubblegum-500" />;
  };

  const ThSortable = ({ col, label, align = 'left' }: { col: string; label: string; align?: 'left' | 'right' }) => (
    <th
      className={`py-3 px-3 text-bubblegum-500 font-semibold cursor-pointer hover:text-bubblegum-700 transition-colors select-none text-${align}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">{label}<SortIndicator col={col} /></span>
    </th>
  );

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <SectionTitle icon={FiTable} title="Data Detail Surat Tugas" />
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-bubblegum-400" />
          <input
            type="text"
            placeholder="Cari nomor surat, tujuan, pegawai..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-2xl border border-bubblegum-200 bg-white text-sm text-bubblegum-800 focus:border-bubblegum-500 focus:ring-2 focus:ring-bubblegum-200 outline-none w-full sm:w-80 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-bubblegum-50 animate-pulse" />)}</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-225">
              <thead>
                <tr className="border-b-2 border-bubblegum-100">
                  <th className="py-3 px-3 text-left text-bubblegum-500 font-semibold w-8">#</th>
                  <ThSortable col="nomor_surat" label="Nomor Surat" />
                  <ThSortable col="tanggal_dikeluarkan" label="Tanggal" />
                  <th className="py-3 px-3 text-left text-bubblegum-500 font-semibold">Tujuan</th>
                  <th className="py-3 px-3 text-left text-bubblegum-500 font-semibold">Pegawai</th>
                  <ThSortable col="lama_perjalanan" label="Durasi" align="right" />
                  <ThSortable col="biaya" label="Biaya" align="right" />
                  <ThSortable col="status" label="Status" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((st, i) => (
                  <tr key={st.id} className="border-b border-bubblegum-50 hover:bg-bubblegum-50/50 transition-colors">
                    <td className="py-3 px-3 text-bubblegum-400">{(data.current_page - 1) * data.per_page + i + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-bubblegum-800">{st.nomor_surat || '-'}</p>
                      {st.instance && <p className="text-xs text-bubblegum-400 truncate max-w-50">{st.instance.name}</p>}
                    </td>
                    <td className="py-3 px-3 text-bubblegum-600 whitespace-nowrap">{st.tanggal_dikeluarkan ? new Date(st.tanggal_dikeluarkan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                    <td className="py-3 px-3">
                      <p className="text-bubblegum-700">{st.tujuan_kabupaten_nama || st.tujuan_provinsi_nama || '-'}</p>
                      {st.lokasi_tujuan && <p className="text-xs text-bubblegum-400 truncate max-w-45">{st.lokasi_tujuan}</p>}
                    </td>
                    <td className="py-3 px-3">
                      {st.pegawai && st.pegawai.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-2">
                            {st.pegawai.slice(0, 3).map((p, pi) => (
                              <div key={pi} className="w-7 h-7 rounded-full bg-linear-to-br from-bubblegum-300 to-grape-400 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white" title={p.nama_lengkap}>
                                {p.nama_lengkap.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-bubblegum-500">{st.pegawai.length} org</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-bubblegum-600">{st.lama_perjalanan ? `${st.lama_perjalanan} hari` : '-'}</td>
                    <td className="py-3 px-3 text-right text-bubblegum-700 font-medium">{st.biaya ? formatRupiah(Number(st.biaya)) : '-'}</td>
                    <td className="py-3 px-3">{statusBadge(st.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-bubblegum-100">
            <p className="text-xs text-bubblegum-400">
              Menampilkan {(data.current_page - 1) * data.per_page + 1}–{Math.min(data.current_page * data.per_page, data.total)} dari {data.total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={data.current_page <= 1}
                onClick={() => onPageChange(data.current_page - 1)}
                className="w-9 h-9 rounded-xl border border-bubblegum-200 flex items-center justify-center text-bubblegum-500 hover:bg-bubblegum-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: Math.min(5, data.last_page) }, (_, i) => {
                let p: number;
                if (data.last_page <= 5) p = i + 1;
                else if (data.current_page <= 3) p = i + 1;
                else if (data.current_page >= data.last_page - 2) p = data.last_page - 4 + i;
                else p = data.current_page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                      p === data.current_page
                        ? 'bg-linear-to-r from-bubblegum-500 to-grape-500 text-white shadow-md shadow-bubblegum-300/40'
                        : 'border border-bubblegum-200 text-bubblegum-600 hover:bg-bubblegum-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={data.current_page >= data.last_page}
                onClick={() => onPageChange(data.current_page + 1)}
                className="w-9 h-9 rounded-xl border border-bubblegum-200 flex items-center justify-center text-bubblegum-500 hover:bg-bubblegum-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState message="Tidak ada data surat tugas yang sesuai dengan filter." />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Utility Components
// ═══════════════════════════════════════════════════

function StatCard({
  icon: Icon, title, value, gradient, shadow, growth, prevValue, subtitle, isRupiah,
}: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  gradient: string;
  shadow: string;
  growth?: number;
  prevValue?: number;
  subtitle?: string;
  isRupiah?: boolean;
}) {
  return (
    <div className={`glass-card rounded-3xl p-5 hover:scale-[1.03] transition-all duration-300 ${shadow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl bg-linear-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
          <Icon className="text-white text-lg" />
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <p className="text-2xl font-bold text-bubblegum-800">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="text-xs font-semibold text-bubblegum-600 mt-1">{title}</p>
      {subtitle && <p className="text-[10px] text-bubblegum-400 leading-tight">{subtitle}</p>}
      {prevValue !== undefined && (
        <p className="text-[10px] text-bubblegum-400 mt-0.5">Tahun lalu: {isRupiah ? formatRupiahShort(prevValue) : formatNumber(prevValue)}</p>
      )}
    </div>
  );
}

function ComparisonCard({ label, current, previous, growth, isRupiah }: { label: string; current: number; previous: number; growth: number; isRupiah?: boolean }) {
  const fmt = isRupiah ? formatRupiahShort : formatNumber;
  return (
    <div className="rounded-2xl bg-bubblegum-50/50 p-4 text-center">
      <p className="text-xs text-bubblegum-500 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-bubblegum-800">{fmt(current)}</p>
      <div className="flex items-center justify-center gap-2 mt-1">
        <span className="text-xs text-bubblegum-400">vs {fmt(previous)}</span>
        <GrowthBadge value={growth} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bubblegum-50/70 p-3 text-center">
      <p className="text-lg font-bold text-bubblegum-800">{value}</p>
      <p className="text-[10px] text-bubblegum-400 mt-0.5">{label}</p>
    </div>
  );
}

function NoData() {
  return <div className="flex items-center justify-center h-48 text-bubblegum-300 text-sm">Tidak ada data</div>;
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="glass-card rounded-3xl p-12 text-center">
      <div className="w-20 h-20 rounded-3xl bg-bubblegum-50 flex items-center justify-center mx-auto mb-4">
        <FiBarChart2 className="text-bubblegum-300 text-3xl" />
      </div>
      <p className="text-bubblegum-500 font-medium">{message || 'Belum ada data laporan.'}</p>
      <p className="text-xs text-bubblegum-300 mt-1">Coba ubah filter atau pilih tahun yang berbeda.</p>
    </div>
  );
}
