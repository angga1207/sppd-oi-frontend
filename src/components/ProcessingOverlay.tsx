'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ProcessingOverlayProps {
    isVisible: boolean;
    title?: string;
    subtitle?: string;
    steps?: { label: string; status: 'pending' | 'active' | 'done' | 'error' }[];
}

export default function ProcessingOverlay({
    isVisible,
    title = 'Memproses...',
    subtitle,
    steps,
}: ProcessingOverlayProps) {
    // Prevent page navigation and scrolling while visible
    useEffect(() => {
        if (!isVisible) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Proses sedang berjalan. Yakin ingin meninggalkan halaman?';
            return e.returnValue;
        };

        // Block back/forward navigation
        const handlePopState = (e: PopStateEvent) => {
            e.preventDefault();
            window.history.pushState(null, '', window.location.href);
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            document.body.style.overflow = '';
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-99999 flex items-center justify-center"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    padding: '40px 48px',
                    maxWidth: '440px',
                    width: '90%',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                }}
            >
                {/* Spinner */}
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            border: '4px solid #e2e8f0',
                            borderTopColor: '#1e3a8a',
                            animation: 'spin 0.8s linear infinite',
                        }}
                    />
                </div>

                {/* Title */}
                <h2
                    style={{
                        margin: '0 0 8px',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#0f172a',
                    }}
                >
                    {title}
                </h2>

                {/* Subtitle */}
                {subtitle && (
                    <p
                        style={{
                            margin: '0 0 20px',
                            fontSize: '14px',
                            color: '#64748b',
                            lineHeight: '1.5',
                        }}
                    >
                        {subtitle}
                    </p>
                )}

                {/* Steps progress */}
                {steps && steps.length > 0 && (
                    <div style={{ textAlign: 'left', marginTop: '16px' }}>
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 0',
                                    borderBottom: i < steps.length - 1 ? '1px solid #f1f5f9' : 'none',
                                }}
                            >
                                {/* Status indicator */}
                                <div style={{ flexShrink: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {step.status === 'done' && (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="10" fill="#10b981" />
                                            <path d="M6 10l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {step.status === 'active' && (
                                        <div
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: '3px solid #e2e8f0',
                                                borderTopColor: '#1e3a8a',
                                                animation: 'spin 0.8s linear infinite',
                                            }}
                                        />
                                    )}
                                    {step.status === 'pending' && (
                                        <div
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: '#e2e8f0',
                                            }}
                                        />
                                    )}
                                    {step.status === 'error' && (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="10" fill="#ef4444" />
                                            <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: step.status === 'active' ? 600 : 400,
                                        color: step.status === 'done' ? '#10b981'
                                            : step.status === 'active' ? '#0f172a'
                                                : step.status === 'error' ? '#ef4444'
                                                    : '#94a3b8',
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Warning */}
                <p
                    style={{
                        margin: '20px 0 0',
                        fontSize: '12px',
                        color: '#f59e0b',
                        fontWeight: 500,
                    }}
                >
                    ⚠ Jangan tutup atau pindah halaman selama proses berlangsung
                </p>
            </div>

            {/* Global spinner keyframe animation */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>,
        document.body
    );
}
