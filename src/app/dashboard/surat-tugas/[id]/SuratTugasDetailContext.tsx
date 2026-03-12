'use client';

import { createContext, useContext } from 'react';
import type { SuratTugas, SuratTugasStatus } from '@/lib/types';

export const statusConfig: Record<SuratTugasStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    draft: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
    dikirim: { label: 'Menunggu Tanda Tangan', color: 'text-candy-700', bg: 'bg-candy-50', border: 'border-candy-200', dot: 'bg-candy-400' },
    ditandatangani: { label: 'Ditandatangani', color: 'text-mint-700', bg: 'bg-mint-50', border: 'border-mint-200', dot: 'bg-mint-400' },
    ditolak: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
    selesai: { label: 'Selesai', color: 'text-grape-700', bg: 'bg-grape-50', border: 'border-grape-200', dot: 'bg-grape-400' },
};

export interface Permissions {
    can_edit: boolean;
    can_send: boolean;
    can_sign: boolean;
    can_reject: boolean;
    can_revise: boolean;
    can_complete: boolean;
    can_delete: boolean;
    is_creator: boolean;
    is_signer: boolean;
}

export interface SuratTugasDetailContextType {
    data: SuratTugas;
    loading: boolean;
    actionLoading: string;
    permissions: Permissions;
    fetchData: () => Promise<void>;
    handleAction: (action: string, confirmMsg: string) => Promise<void>;
    handleDownload: (type: 'st' | 'spd', itemId: number | string) => Promise<void>;
    handleRegenerate: () => Promise<void>;
}

export const SuratTugasDetailContext = createContext<SuratTugasDetailContextType | null>(null);

export function useSuratTugasDetail() {
    const ctx = useContext(SuratTugasDetailContext);
    if (!ctx) throw new Error('useSuratTugasDetail must be used within SuratTugasDetailProvider');
    return ctx;
}

export function useSuratTugasDetailOptional() {
    return useContext(SuratTugasDetailContext);
}
