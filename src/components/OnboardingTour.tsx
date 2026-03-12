'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX, FiHelpCircle } from 'react-icons/fi';

export interface TourStep {
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: TourStep[];
    storageKey: string;
    onComplete?: () => void;
    onStart?: () => void;
    onEnd?: () => void;
}

interface TooltipPosition {
    top: number;
    left: number;
    arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

function getTooltipPosition(
    targetRect: DOMRect,
    tooltipWidth: number,
    tooltipHeight: number,
    preferredPosition?: 'top' | 'bottom' | 'left' | 'right'
): TooltipPosition {
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const gap = 12;

    const centerX = targetRect.left + scrollX + targetRect.width / 2;
    const centerY = targetRect.top + scrollY + targetRect.height / 2;

    // Try preferred position first, then fallback
    const positions: Array<'bottom' | 'top' | 'left' | 'right'> = preferredPosition
        ? [preferredPosition, 'bottom', 'top', 'right', 'left']
        : ['bottom', 'top', 'right', 'left'];

    for (const pos of positions) {
        let top = 0, left = 0;
        if (pos === 'bottom') {
            top = targetRect.bottom + scrollY + gap;
            left = centerX - tooltipWidth / 2;
            if (top + tooltipHeight - scrollY < viewportH && left >= scrollX && left + tooltipWidth <= viewportW + scrollX) {
                return { top, left: Math.max(8, Math.min(left, viewportW + scrollX - tooltipWidth - 8)), arrowPosition: 'top' };
            }
        }
        if (pos === 'top') {
            top = targetRect.top + scrollY - tooltipHeight - gap;
            left = centerX - tooltipWidth / 2;
            if (top - scrollY >= 0) {
                return { top, left: Math.max(8, Math.min(left, viewportW + scrollX - tooltipWidth - 8)), arrowPosition: 'bottom' };
            }
        }
        if (pos === 'right') {
            top = centerY - tooltipHeight / 2;
            left = targetRect.right + scrollX + gap;
            if (left + tooltipWidth <= viewportW + scrollX) {
                return { top: Math.max(scrollY + 8, top), left, arrowPosition: 'left' };
            }
        }
        if (pos === 'left') {
            top = centerY - tooltipHeight / 2;
            left = targetRect.left + scrollX - tooltipWidth - gap;
            if (left >= scrollX) {
                return { top: Math.max(scrollY + 8, top), left, arrowPosition: 'right' };
            }
        }
    }

    // Fallback: bottom
    return {
        top: targetRect.bottom + scrollY + gap,
        left: Math.max(8, centerX - tooltipWidth / 2),
        arrowPosition: 'top',
    };
}

export default function OnboardingTour({ steps, storageKey, onComplete, onStart, onEnd }: OnboardingTourProps) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );

    const positionTooltip = useCallback(() => {
        if (!isActive || currentStep >= steps.length) return;
        const step = steps[currentStep];
        const target = document.querySelector(step.targetSelector);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Delay positioning to allow scroll to settle
        setTimeout(() => {
            const updatedRect = target.getBoundingClientRect();
            setTargetRect(updatedRect);
            const tw = Math.min(380, window.innerWidth - 32);
            const th = 180; // estimated height
            const pos = getTooltipPosition(updatedRect, tw, th, step.position);
            setTooltipPos(pos);
        }, 350);
    }, [isActive, currentStep, steps]);

    useEffect(() => {
        if (isActive) {
            // Position tooltip on step change; runs after render so targets are in DOM
            const rafId = requestAnimationFrame(() => positionTooltip());
            window.addEventListener('resize', positionTooltip);
            return () => {
                cancelAnimationFrame(rafId);
                window.removeEventListener('resize', positionTooltip);
            };
        }
    }, [isActive, positionTooltip]);

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
        onStart?.();
    }, [onStart]);

    const endTour = useCallback(() => {
        setIsActive(false);
        setTooltipPos(null);
        setTargetRect(null);
        try { localStorage.setItem(storageKey, 'completed'); } catch { /* */ }
        onComplete?.();
        onEnd?.();
    }, [storageKey, onComplete, onEnd]);

    const goNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((p) => p + 1);
        } else {
            endTour();
        }
    }, [currentStep, steps.length, endTour]);

    const goPrev = useCallback(() => {
        if (currentStep > 0) setCurrentStep((p) => p - 1);
    }, [currentStep]);

    // Close on Escape
    useEffect(() => {
        if (!isActive) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') endTour();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isActive, endTour]);

    // Auto-start on first visit
    useEffect(() => {
        if (!mounted) return;
        try {
            const done = localStorage.getItem(storageKey);
            if (!done && steps.length > 0) {
                // Delay auto-start to ensure page is rendered
                const timer = setTimeout(() => startTour(), 1500);
                return () => clearTimeout(timer);
            }
        } catch { /* */ }
    }, [mounted, storageKey, steps.length, startTour]);

    if (!mounted) return null;

    const step = steps[currentStep];
    const arrowClass = tooltipPos?.arrowPosition === 'top'
        ? 'before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-white'
        : tooltipPos?.arrowPosition === 'bottom'
            ? 'before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-white'
            : tooltipPos?.arrowPosition === 'left'
                ? 'before:absolute before:-left-2 before:top-1/2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-r-white'
                : 'before:absolute before:-right-2 before:top-1/2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-l-white';

    return (
        <>
            {/* Floating help button */}
            {!isActive && (
                <button
                    onClick={startTour}
                    className="fixed bottom-6 right-6 z-[9990] w-12 h-12 rounded-full bg-gradient-to-br from-grape-500 to-bubblegum-500 text-white shadow-xl shadow-grape-300/40 hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
                    title="Panduan pengisian form"
                >
                    <FiHelpCircle className="text-xl group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Tour overlay */}
            {isActive && createPortal(
                <>
                    {/* Semi-transparent overlay */}
                    <div
                        className="fixed inset-0 z-[9998] bg-bubblegum-200/20 transition-all duration-300"
                        // onClick={endTour}
                    />

                    {/* Target highlight box */}
                    {targetRect && (
                        <div
                            className="fixed z-[9999] rounded-xl bg-white/10 border-3 border-bubblegum-400 pointer-events-none transition-all duration-300 shadow-lg shadow-white/50"
                            style={{
                                top: targetRect.top - 6,
                                left: targetRect.left - 6,
                                width: targetRect.width + 12,
                                height: targetRect.height + 12,
                            }}
                        />
                    )}

                    {/* Tooltip */}
                    {tooltipPos && step && (
                        <div
                            ref={tooltipRef}
                            className={`absolute z-[10000] rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${arrowClass}`}
                            style={{
                                top: tooltipPos.top,
                                left: tooltipPos.left,
                                width: Math.min(380, window.innerWidth - 32),
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.12)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Accent header bar */}
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)',
                                    padding: '12px 16px 10px',
                                    position: 'relative',
                                }}
                            >
                                {/* Close button */}
                                <button
                                    onClick={endTour}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        padding: '4px',
                                        borderRadius: '6px',
                                        color: 'rgba(255,255,255,0.7)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                >
                                    <FiX style={{ fontSize: '14px' }} />
                                </button>

                                {/* Step counter badge */}
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: '#ffffff',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Langkah {currentStep + 1} dari {steps.length}
                                </span>

                                {/* Title */}
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: '#ffffff',
                                        lineHeight: '1.4',
                                        paddingRight: '24px',
                                    }}
                                >
                                    {step.title}
                                </h3>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '14px 16px 16px' }}>
                                {/* Description */}
                                <p
                                    style={{
                                        margin: '0 0 14px',
                                        fontSize: '13.5px',
                                        color: '#374151',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    {step.description}
                                </p>

                                {/* Progress bar */}
                                <div
                                    style={{
                                        height: '4px',
                                        borderRadius: '999px',
                                        backgroundColor: '#e2e8f0',
                                        overflow: 'hidden',
                                        marginBottom: '14px',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: '999px',
                                            background: 'linear-gradient(90deg, #1e3a8a, #4338ca)',
                                            width: `${((currentStep + 1) / steps.length) * 100}%`,
                                            transition: 'width 0.5s ease',
                                        }}
                                    />
                                </div>

                                {/* Navigation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <button
                                        onClick={endTour}
                                        style={{
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px 0',
                                            fontWeight: 500,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                                    >
                                        Lewati
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {currentStep > 0 && (
                                            <button
                                                onClick={goPrev}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '6px 12px',
                                                    borderRadius: '10px',
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#1e3a8a',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    border: '1px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                            >
                                                <FiChevronLeft style={{ fontSize: '14px' }} /> Sebelumnya
                                            </button>
                                        )}
                                        <button
                                            onClick={goNext}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '6px 16px',
                                                borderRadius: '10px',
                                                background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(30,58,138,0.35)',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,138,0.5)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,58,138,0.35)')}
                                        >
                                            {currentStep < steps.length - 1 ? (
                                                <>Selanjutnya <FiChevronRight style={{ fontSize: '14px' }} /></>
                                            ) : (
                                                'Selesai!'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </>
    );
}
