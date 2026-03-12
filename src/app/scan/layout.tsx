import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Verifikasi Dokumen | e-SPD Ogan Ilir',
    description: 'Halaman verifikasi keaslian dokumen Surat Tugas dan SPD Kabupaten Ogan Ilir',
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
