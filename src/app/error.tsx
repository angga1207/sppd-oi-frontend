'use client';

import { useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Illustration */}
                <div className="relative mb-8">
                    <div className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 leading-none select-none">
                        500
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-red-100/60 flex items-center justify-center animate-pulse">
                            <FiAlertTriangle className="text-4xl text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Terjadi Kesalahan
                </h1>
                <p className="text-slate-500 mb-2 text-sm leading-relaxed">
                    Maaf, terjadi kesalahan yang tidak terduga pada sistem.
                    <br />Silakan coba muat ulang halaman atau kembali ke dashboard.
                </p>

                {error.digest && (
                    <p className="text-xs text-slate-400 mb-6 font-mono">
                        Kode Error: {error.digest}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600 shadow-lg shadow-blue-300/30 hover:shadow-blue-300/50 transition-all"
                    >
                        <FiRefreshCw className="text-base" />
                        Coba Lagi
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium text-blue-700 bg-white border-2 border-blue-200 hover:bg-blue-50 transition-all"
                    >
                        <FiHome className="text-base" />
                        Ke Dashboard
                    </Link>
                </div>

                {/* Footer */}
                <p className="mt-12 text-xs text-slate-400">
                    e-SPD Kabupaten Ogan Ilir
                </p>
            </div>
        </div>
    );
}
