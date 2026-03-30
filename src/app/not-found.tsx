'use client';

import Link from 'next/link';
import { FiHome, FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Illustration */}
                <div className="relative mb-8">
                    <div className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-blue-100/60 flex items-center justify-center animate-pulse">
                            <FiSearch className="text-4xl text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Halaman Tidak Ditemukan
                </h1>
                <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                    Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
                    <br />Periksa kembali URL atau kembali ke halaman utama.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600 shadow-lg shadow-blue-300/30 hover:shadow-blue-300/50 transition-all"
                    >
                        <FiHome className="text-base" />
                        Ke Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium text-blue-700 bg-white border-2 border-blue-200 hover:bg-blue-50 transition-all"
                    >
                        <FiArrowLeft className="text-base" />
                        Kembali
                    </button>
                </div>

                {/* Footer */}
                <p className="mt-12 text-xs text-slate-400">
                    e-SPD Kabupaten Ogan Ilir
                </p>
            </div>
        </div>
    );
}
