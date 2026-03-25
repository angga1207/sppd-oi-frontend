export interface User {
  id: number;
  name: string;
  username: string | null;
  nik: string | null;
  email: string | null;
  image: string | null;
  role_id: number;
  instance_id: number | null;
  employee_id: number | null;
  jabatan: string | null;
  no_hp: string | null;
  role?: Role;
  instance?: Instance;
  employee?: Employee;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface Instance {
  id: number;
  id_eoffice: number | null;
  name: string;
  alias: string | null;
  code: string | null;
  logo: string | null;
  status: 'active' | 'inactive';
}

export interface Employee {
  id: number;
  semesta_id: number;
  nama_lengkap: string;
  nip: string;
  jenis_pegawai: string;
  instance_id: number | null;
  jabatan: string | null;
  foto_pegawai: string | null;
  eselon: string | null;
  golongan: string | null;
  pangkat: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    token_type: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Province {
  id: string;
  nama: string;
}

export interface Kabupaten {
  id: string;
  id_provinsi: string;
  nama: string;
}

export interface Kecamatan {
  id: string;
  id_kabupaten: string;
  nama: string;
}

// ============ Surat Tugas & SPD ============

export interface PejabatPembuatKomitmen {
  id: number;
  instance_id: number;
  nama: string;
  nip: string;
  jabatan: string | null;
  pangkat: string | null;
  golongan: string | null;
  is_active: boolean;
  instance?: Instance;
  created_at?: string;
  updated_at?: string;
}

export type SuratTugasStatus = 'draft' | 'dikirim' | 'ditandatangani' | 'ditolak' | 'selesai';

export interface KategoriSurat {
  id: number;
  nama: string;
  keterangan: string | null;
  is_active: boolean;
  urutan: number;
}

export interface KlasifikasiNomorSurat {
  id: number;
  parent_id: number | null;
  kode: string;
  klasifikasi: string;
  deskripsi: string | null;
  status: boolean;
  children?: KlasifikasiNomorSurat[];
}

export interface SuratTugasPegawai {
  id: number;
  surat_tugas_id: number;
  semesta_pegawai_id: number | null;
  nip: string;
  nama_lengkap: string;
  jabatan: string | null;
  pangkat: string | null;
  golongan: string | null;
  eselon: string | null;
  id_skpd: number | null;
  nama_skpd: string | null;
  id_jabatan: number | null;
}

export interface SuratPerjalananDinas {
  id: number;
  nomor_spd: string | null;
  tingkat_biaya: string | null;
  tingkat_biaya_label: string | null;
  surat_tugas_id: number;
  surat_tugas_pegawai_id: number;
  status: SuratTugasStatus;
  file_spd: string | null;
  file_spd_signed: string | null;
  signed_at: string | null;
  surat_tugas?: SuratTugas;
  surat_tugas_pegawai?: SuratTugasPegawai;
  laporan_perjalanan_dinas?: LaporanPerjalananDinas;
  pengikut?: SpdPengikut[];
}

export interface SpdPengikut {
  id: number;
  spd_id: number;
  nama: string;
  tanggal_lahir: string | null;
  keterangan: string | null;
}

export interface SpdPengikutFormItem {
  nama: string;
  tanggal_lahir: string;
  keterangan: string;
}

export interface LaporanPerjalananDinas {
  id: number;
  spd_id: number;
  laporan: string;
  lampiran: string[] | null;
}

export interface SuratTugas {
  id: number;
  nomor_surat: string | null;
  klasifikasi_id: number | null;
  kategori_id: number | null;
  pemberi_perintah_nama: string | null;
  pemberi_perintah_nip: string | null;
  pemberi_perintah_jabatan: string | null;
  pemberi_perintah_pangkat: string | null;
  pemberi_perintah_golongan: string | null;
  pemberi_perintah_instance_id: number | null;
  dasar: string | null;
  untuk: string | null;
  has_spd: boolean;
  penandatangan_nama: string | null;
  penandatangan_nip: string | null;
  penandatangan_jabatan: string | null;
  penandatangan_instance_id: number | null;
  ppk_nama: string | null;
  ppk_nip: string | null;
  ppk_jabatan: string | null;
  ppk_pangkat: string | null;
  ppk_golongan: string | null;
  ppk_instance_id: number | null;
  instance_id: number | null;
  jenis_perjalanan: 'luar_kabupaten' | 'dalam_kabupaten' | null;
  tujuan_provinsi_id: string | null;
  tujuan_provinsi_nama: string | null;
  tujuan_kabupaten_id: string | null;
  tujuan_kabupaten_nama: string | null;
  tujuan_kecamatan_id: string | null;
  tujuan_kecamatan_nama: string | null;
  lokasi_tujuan: string | null;
  tanggal_berangkat: string | null;
  lama_perjalanan: number | null;
  tanggal_kembali: string | null;
  tempat_dikeluarkan: string | null;
  tanggal_dikeluarkan: string | null;
  alat_angkut: string | null;
  biaya: string | null;
  sub_kegiatan_kode: string | null;
  sub_kegiatan_nama: string | null;
  kode_rekening: string | null;
  uraian_rekening: string | null;
  keterangan: string | null;
  status: SuratTugasStatus;
  file_surat_tugas: string | null;
  file_surat_tugas_signed: string | null;
  signed_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  klasifikasi?: KlasifikasiNomorSurat;
  kategori?: KategoriSurat;
  instance?: Instance;
  penandatangan_instance?: Instance;
  pemberi_perintah_instance?: Instance;
  ppk_instance?: Instance;
  created_by_user?: User;
  pegawai?: SuratTugasPegawai[];
  surat_perjalanan_dinas?: SuratPerjalananDinas[];
}

export interface SuratTugasFormData {
  instance_id?: number | null;
  klasifikasi_id: number | null;
  kategori_id: number | null;
  nomor_surat: string;
  pemberi_perintah_nama: string;
  pemberi_perintah_nip: string;
  pemberi_perintah_jabatan: string;
  pemberi_perintah_pangkat: string;
  pemberi_perintah_golongan: string;
  pemberi_perintah_instance_id: number | null;
  pemberi_perintah_jenis_pegawai: string;
  dasar: string;
  untuk: string;
  has_spd: boolean;
  penandatangan_nama: string;
  penandatangan_nip: string;
  penandatangan_jabatan: string;
  penandatangan_instance_id: number | null;
  ppk_nama: string;
  ppk_nip: string;
  ppk_jabatan: string;
  ppk_pangkat: string;
  ppk_golongan: string;
  ppk_instance_id: number | null;
  jenis_perjalanan: 'luar_kabupaten' | 'dalam_kabupaten' | '';
  tujuan_provinsi_id: string;
  tujuan_provinsi_nama: string;
  tujuan_kabupaten_id: string;
  tujuan_kabupaten_nama: string;
  tujuan_kecamatan_id: string;
  tujuan_kecamatan_nama: string;
  lokasi_tujuan: string;
  tanggal_berangkat: string;
  lama_perjalanan: number | null;
  tanggal_kembali: string;
  tempat_dikeluarkan: string;
  tanggal_dikeluarkan: string;
  alat_angkut: string;
  biaya: number | null;
  sub_kegiatan_kode: string;
  sub_kegiatan_nama: string;
  kode_rekening: string;
  uraian_rekening: string;
  keterangan: string;
  pegawai: PegawaiFormItem[];
}

// SiCaram API types
export interface SiCaramSubKegiatan {
  id: number;
  fullcode: string;
  name: string;
  kode_rekening: SiCaramRekening[];
}

export interface SiCaramRekening {
  id: number;
  fullcode: string;
  name: string;
  pagu_induk: number;
}

export interface PegawaiFormItem {
  semesta_pegawai_id: number | null;
  nip: string;
  nama_lengkap: string;
  jabatan: string;
  pangkat: string;
  golongan: string;
  eselon: string;
  id_skpd: number | null;
  nama_skpd: string;
  id_jabatan: number | null;
  jenis_pegawai?: string | null;
  kepala_skpd?: boolean | string | null;
  foto_pegawai?: string | null;
  email?: string | null;
  no_hp?: string | null;
}

// Semesta API pegawai response
export interface SemestaPegawai {
  id: number;
  nip: string;
  nama_lengkap: string;
  jabatan: string | null;
  golongan: string | null;
  pangkat: string | null;
  eselon: string | null;
  id_skpd: number;
  skpd?: { id: number; nama_skpd: string };
  ref_jabatan_baru?: unknown;
  id_jabatan?: number;
  jenis_pegawai?: string | null;
  kepala_skpd?: boolean | string | null;
  foto_pegawai?: string | null;
  email?: string | null;
  no_hp?: string | null;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface SuratTugasStats {
  total: number;
  draft: number;
  dikirim: number;
  ditandatangani: number;
  ditolak: number;
  selesai: number;
  total_spd: number;
}

// ============ Dashboard ============

export interface DashboardSummaryPeriod {
  total_st: number;
  total_spd: number;
  draft: number;
  dikirim: number;
  ditandatangani: number;
  ditolak: number;
  selesai: number;
}

export interface DashboardSummary {
  tahun_ini: DashboardSummaryPeriod;
  bulan_ini: DashboardSummaryPeriod;
  spd_aktif: number;
}

export interface ChartJenisSuratItem {
  bulan: string;
  st_saja: number;
  st_spd: number;
}

export interface ChartDomestikItem {
  bulan: string;
  dalam_negeri: number;
  luar_negeri: number;
}

export interface ChartPerangkatDaerahItem {
  instance_id: number;
  nama: string;
  total: number;
}

export interface TopPegawaiItem {
  nip: string;
  nama_lengkap: string;
  jabatan: string | null;
  nama_skpd: string | null;
  total_tugas: number;
}

export interface TopProvinsiItem {
  tujuan_provinsi_id: string;
  tujuan_provinsi_nama: string;
  total: number;
}

export interface TopKabupatenItem {
  tujuan_kabupaten_id: string;
  tujuan_kabupaten_nama: string;
  total: number;
}

export interface TopKecamatanItem {
  tujuan_kecamatan_id: string;
  tujuan_kecamatan_nama: string;
  total: number;
}

export interface ChartKlasifikasiItem {
  kode: string;
  nama: string;
  total: number;
}

export interface ChartAlatAngkutItem {
  alat_angkut: string;
  total: number;
}

export interface TopOpdPerjalananItem {
  instance_id: number;
  nama: string;
  total: number;
}

export interface TopOpdBiayaItem {
  instance_id: number;
  nama: string;
  total_biaya: number;
  total_spd: number;
}

export interface ChartKategoriItem {
  id: number;
  nama: string;
  total: number;
}

export interface ActiveTripItem {
  id: number;
  nomor_surat: string | null;
  untuk: string | null;
  status: string;
  kategori_id: number | null;
  instance_id: number | null;
  tujuan_kabupaten_nama: string | null;
  tujuan_provinsi_nama: string | null;
  lokasi_tujuan: string | null;
  tanggal_berangkat: string | null;
  tanggal_kembali: string | null;
  lama_perjalanan: number | null;
  penandatangan_nama: string | null;
  jenis_perjalanan: string | null;
  has_spd: boolean;
  created_at: string;
  instance?: { id: number; name: string; alias: string | null } | null;
  kategori?: { id: number; nama: string } | null;
  pegawai?: { id: number; surat_tugas_id: number; nama_lengkap: string; nip: string; jabatan: string | null }[];
}

export interface DashboardData {
  year: number;
  summary: DashboardSummary;
  chart_jenis_surat: ChartJenisSuratItem[];
  chart_domestik_internasional: ChartDomestikItem[];
  chart_perangkat_daerah: ChartPerangkatDaerahItem[];
  top_pegawai: TopPegawaiItem[];
  top_provinsi: TopProvinsiItem[];
  top_kabupaten: TopKabupatenItem[];
  top_kecamatan: TopKecamatanItem[];
  chart_klasifikasi: ChartKlasifikasiItem[];
  chart_alat_angkut: ChartAlatAngkutItem[];
  top_opd_perjalanan: TopOpdPerjalananItem[];
  top_opd_biaya: TopOpdBiayaItem[];
  chart_kategori: ChartKategoriItem[];
  chart_jenis_perjalanan: ChartJenisPerjalananItem[];
  active_trips: ActiveTripItem[];
}

export interface ChartJenisPerjalananItem {
  jenis: string;
  total_st: number;
  total_spd: number;
}

export interface LogSurat {
  id: number;
  aksi: string;
  label: string;
  color: string;
  keterangan: string | null;
  user: {
    id: number;
    name: string;
    username: string | null;
  } | null;
  ip_address: string | null;
  created_at: string;
}

// ============ Notifications ============

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: 'surat_dikirim' | 'surat_ditandatangani' | 'surat_ditolak';
  data: {
    surat_tugas_id?: number;
    nomor_surat?: string;
    sender_name?: string;
    signer_name?: string;
    rejector_name?: string;
    alasan?: string;
    url?: string;
  } | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  surat_dikirim: 'Surat Dikirim',
  surat_ditandatangani: 'Surat Ditandatangani',
  surat_ditolak: 'Surat Ditolak',
};

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  surat_dikirim: 'candy',
  surat_ditandatangani: 'mint',
  surat_ditolak: 'red',
};

// ============ Activity Log ============

export interface ActivityLogItem {
  id: number;
  user_id: number;
  action: string;
  description: string;
  label: string;
  color: string;
  properties: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export const ACTIVITY_LOG_ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  create_surat: 'Membuat Surat Tugas',
  update_surat: 'Mengubah Surat Tugas',
  delete_surat: 'Menghapus Surat Tugas',
  kirim_surat: 'Mengirim Surat Tugas',
  tandatangani_surat: 'Menandatangani Surat Tugas',
  tolak_surat: 'Menolak Surat Tugas',
  revisi_surat: 'Merevisi Surat Tugas',
  selesai_surat: 'Menyelesaikan Surat Tugas',
  download_surat: 'Mengunduh Dokumen',
  submit_laporan: 'Submit Laporan SPD',
  update_spd: 'Mengubah SPD',
};

export const ACTIVITY_LOG_ACTION_COLORS: Record<string, string> = {
  login: 'mint',
  logout: 'gray',
  create_surat: 'blue',
  update_surat: 'amber',
  delete_surat: 'red',
  kirim_surat: 'candy',
  tandatangani_surat: 'mint',
  tolak_surat: 'red',
  revisi_surat: 'orange',
  selesai_surat: 'grape',
  download_surat: 'sky',
  submit_laporan: 'blue',
  update_spd: 'amber',
};

// ============ Reports / Laporan ============

export interface ReportOverview {
  total_surat_tugas: number;
  total_spd: number;
  total_pegawai_ditugaskan: number;
  total_biaya: number;
  rata_rata_lama_perjalanan: number;
  total_destinasi: number;
}

export interface ReportTrendBulanan {
  bulan: string;
  bulan_full: string;
  nomor: number;
  total_st: number;
  total_spd: number;
  total_biaya: number;
  ditandatangani: number;
  selesai: number;
}

export interface ReportStatusDistribution {
  status: string;
  label: string;
  total: number;
}

export interface ReportJenisPerjalanan {
  jenis: string;
  label: string;
  total_st: number;
  total_biaya: number;
}

export interface ReportTingkatBiaya {
  tingkat: string;
  label: string;
  total: number;
}

export interface ReportDestinationItem {
  tujuan_provinsi_nama?: string;
  tujuan_kabupaten_nama?: string;
  total: number;
  total_biaya: number;
}

export interface ReportTopDestinations {
  provinsi: ReportDestinationItem[];
  kabupaten: (ReportDestinationItem & { tujuan_provinsi_nama: string })[];
}

export interface ReportTopPegawai {
  nip: string;
  nama_lengkap: string;
  jabatan: string | null;
  nama_skpd: string | null;
  golongan: string | null;
  eselon: string | null;
  total_tugas: number;
}

export interface ReportOpdRanking {
  instance_id: number;
  nama: string;
  total_st: number;
  total_spd: number;
  total_biaya: number;
}

export interface ReportBiayaBulanan {
  bulan: string;
  bulan_full: string;
  total_biaya: number;
  jumlah_spd: number;
  rata_rata: number;
}

export interface ReportBiayaAnalysis {
  bulanan: ReportBiayaBulanan[];
  total_biaya: number;
  total_spd: number;
  rata_rata_per_spd: number;
}

export interface ReportAlatAngkut {
  alat_angkut: string;
  total: number;
  total_biaya: number;
}

export interface ReportKlasifikasi {
  kode: string;
  nama: string;
  total: number;
}

export interface ReportKategori {
  id: number;
  nama: string;
  total: number;
}

export interface ReportDurasiItem {
  label: string;
  total: number;
}

export interface ReportDurasiAnalysis {
  distribusi: ReportDurasiItem[];
  rata_rata: number;
  terlama: number;
  tersingkat: number;
}

export interface ReportHeatmapItem {
  date: string;
  count: number;
}

export interface ReportYearComparison {
  tahun_ini: number;
  tahun_lalu: number;
  surat_tugas: { current: number; previous: number; growth_percent: number };
  spd: { current: number; previous: number; growth_percent: number };
  biaya: { current: number; previous: number; growth_percent: number };
}

export interface ReportData {
  year: number;
  month: number | null;
  filters_applied: {
    instance_id: number | null;
    jenis_perjalanan: string | null;
    status: string | null;
  };
  is_all_opd: boolean;
  overview: ReportOverview;
  trend_bulanan: ReportTrendBulanan[];
  status_distribution: ReportStatusDistribution[];
  jenis_perjalanan_breakdown: ReportJenisPerjalanan[];
  tingkat_biaya_distribution: ReportTingkatBiaya[];
  top_destinations: ReportTopDestinations;
  top_pegawai: ReportTopPegawai[];
  opd_ranking: ReportOpdRanking[];
  biaya_analysis: ReportBiayaAnalysis;
  alat_angkut_distribution: ReportAlatAngkut[];
  klasifikasi_breakdown: ReportKlasifikasi[];
  kategori_breakdown: ReportKategori[];
  durasi_analysis: ReportDurasiAnalysis;
  daily_heatmap: ReportHeatmapItem[];
  comparison_prev_year: ReportYearComparison;
  active_trips: ActiveTripItem[];
}

export interface ReportInstanceItem {
  id: number;
  name: string;
  alias: string | null;
}
