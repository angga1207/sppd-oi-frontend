'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bubblegum-gradient">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Bubbles */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white/30 animate-bubble-float backdrop-blur-sm" />
          <div className="absolute top-2 left-2 w-16 h-16 rounded-full bg-white/20 animate-bubble-wobble" />
        </div>
        <p className="text-white text-lg font-medium animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}
