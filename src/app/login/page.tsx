'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff, FiFileText, FiMapPin, FiSend } from 'react-icons/fi';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);
        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bubblegum-900 via-grape-900 to-bubblegum-800">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen relative overflow-hidden">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-bubblegum-900 via-grape-800 to-bubblegum-800 text-white flex-col justify-between p-12 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.04]">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Decorative floating icons */}
                <div className="absolute top-20 right-20 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-bubble-float" style={{ animationDelay: '0s' }}>
                    <FiFileText className="text-2xl text-white/60" />
                </div>
                <div className="absolute top-1/3 right-32 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-bubble-float" style={{ animationDelay: '2s' }}>
                    <FiMapPin className="text-xl text-white/50" />
                </div>
                <div className="absolute bottom-32 right-24 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-bubble-float" style={{ animationDelay: '4s' }}>
                    <FiSend className="text-xl text-white/50" />
                </div>

                {/* Glowing orbs */}
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-bubblegum-500/20 blur-3xl" />
                <div className="absolute -bottom-20 right-0 w-64 h-64 rounded-full bg-grape-500/20 blur-3xl" />

                {/* Top — Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-lg shadow-black/10">
                            <Image src="/logo-oi.png" alt="Logo Ogan Ilir" width={40} height={40} className="object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Kabupaten Ogan Ilir</h2>
                            <p className="text-sm text-white/60">Provinsi Sumatera Selatan</p>
                        </div>
                    </div>
                </div>

                {/* Center — Hero Text */}
                <div className="relative z-10 -mt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/80 mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Sistem Elektronik Terintegrasi
                    </div>
                    <h1 className="text-5xl font-bold leading-tight tracking-tight">
                        e-SPD
                        <span className="block text-2xl font-medium text-white/70 mt-2">Sistem Surat Perjalanan Dinas</span>
                    </h1>
                    <p className="text-base text-white/50 mt-4 max-w-md leading-relaxed">
                        Kelola surat tugas dan surat perjalanan dinas secara digital, cepat, transparan, dan akuntabel.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-3 mt-8">
                        {[
                            { icon: FiFileText, text: 'Surat Tugas Digital' },
                            { icon: FiMapPin, text: 'SPD Terintegrasi' },
                            { icon: FiSend, text: 'Tanda Tangan Elektronik' },
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-white/80">
                                <feat.icon className="text-sm text-white/60" />
                                {feat.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom — Footer */}
                <div className="relative z-10">
                    <div className="h-px bg-white/10 mb-4" />
                    <p className="text-xs text-white/40">
                        &copy; {new Date().getFullYear()} Pemerintah Kabupaten Ogan Ilir &middot; Semua hak dilindungi
                    </p>
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-bubblegum-50/30 to-grape-50/20 p-6 relative">
                {/* Subtle background elements */}
                <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-bubblegum-200/30 blur-3xl" />
                <div className="absolute bottom-10 left-10 w-36 h-36 rounded-full bg-grape-200/20 blur-3xl" />

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile logo (shown only on small screens) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-bubblegum-800 to-grape-800 flex items-center justify-center mb-4 shadow-xl shadow-bubblegum-300/30 overflow-hidden">
                            <Image src="/logo-oi.png" alt="Logo Ogan Ilir" width={52} height={52} className="object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-bubblegum-900">e-SPD Ogan Ilir</h1>
                        <p className="text-sm text-bubblegum-500 mt-1">Sistem Surat Perjalanan Dinas</p>
                    </div>

                    {/* Login Header */}
                    <div className="mb-8 hidden lg:block">
                        <h2 className="text-2xl font-bold text-bubblegum-900">Masuk ke Sistem</h2>
                        <p className="text-sm text-bubblegum-500 mt-1">Gunakan akun Semesta untuk melanjutkan</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm text-center animate-bubble-pop">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-bubblegum-700 mb-2">
                                NIP / Username
                            </label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-bubblegum-400 text-lg group-focus-within:text-bubblegum-600 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan NIP atau Username"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-bubblegum-200 bg-white text-bubblegum-800 placeholder-bubblegum-300 focus:border-bubblegum-500 focus:ring-4 focus:ring-bubblegum-100 outline-none transition-all duration-300"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-bubblegum-700 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-bubblegum-400 text-lg group-focus-within:text-bubblegum-600 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan Password"
                                    className="w-full pl-12 pr-14 py-3.5 rounded-2xl border-2 border-bubblegum-200 bg-white text-bubblegum-800 placeholder-bubblegum-300 focus:border-bubblegum-500 focus:ring-4 focus:ring-bubblegum-100 outline-none transition-all duration-300"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-bubblegum-400 hover:text-bubblegum-600 transition-colors p-1"
                                >
                                    {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-bubblegum-800 to-grape-700 text-white font-semibold text-base shadow-lg shadow-bubblegum-300/40 hover:shadow-xl hover:shadow-bubblegum-400/40 hover:from-bubblegum-700 hover:to-grape-600 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <FiLogIn className="text-lg" />
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center space-y-2">
                        <p className="text-xs text-bubblegum-400">
                            Autentikasi menggunakan Sistem Semesta
                        </p>
                        <p className="text-xs text-bubblegum-300 lg:hidden">
                            &copy; {new Date().getFullYear()} Pemerintah Kabupaten Ogan Ilir
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
