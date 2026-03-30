'use client';

import Link from 'next/link';
import { FiSearch, FiHome, FiArrowLeft } from 'react-icons/fi';

export default function DashboardNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <div className="max-w-md w-full text-center">
                <div className="relative mb-6">
                    <div className="text-[120px] font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-teal-500 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100/60 flex items-center justify-center animate-pulse">
                            <FiSearch className="text-3xl text-blue-400" />
                        </div>
                    </div>
                </div>

                <h1 className="text-xl font-bold text-slate-800 mb-2">
                    Halaman Tidak Ditemukan
                </h1>
                <p className="text-slate-500 text-sm mb-6">
                    Halaman yang Anda cari tidak tersedia di dashboard ini.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-linear-to-r from-blue-700 via-indigo-600 to-teal-600 shadow-lg shadow-blue-300/30 hover:shadow-blue-300/50 transition-all"
                    >
                        <FiHome className="text-base" />
                        Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium text-blue-700 bg-white border-2 border-blue-200 hover:bg-blue-50 transition-all"
                    >
                        <FiArrowLeft className="text-base" />
                        Kembali
                    </button>
                </div>
            </div>
        </div>
    );
}
