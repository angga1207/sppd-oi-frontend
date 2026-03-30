'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="id">
            <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f8fafc, #eff6ff, #eef2ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
                        <div style={{
                            fontSize: '120px',
                            fontWeight: 900,
                            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1,
                            userSelect: 'none',
                            marginBottom: '1.5rem',
                        }}>
                            500
                        </div>

                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                            Kesalahan Sistem
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                            Terjadi kesalahan fatal pada aplikasi. Silakan muat ulang halaman.
                        </p>

                        {error.digest && (
                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1.5rem' }}>
                                Kode: {error.digest}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button
                                onClick={reset}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'white',
                                    background: 'linear-gradient(to right, #1d4ed8, #4338ca, #0f766e)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 15px -3px rgba(59,130,246,0.2)',
                                }}
                            >
                                Muat Ulang
                            </button>
                            <a
                                href="/dashboard"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#1d4ed8',
                                    background: 'white',
                                    border: '2px solid #bfdbfe',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                }}
                            >
                                Ke Dashboard
                            </a>
                        </div>

                        <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                            e-SPD Kabupaten Ogan Ilir
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}
