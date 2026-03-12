import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// GET /api/scan/st/123 or /api/scan/spd/123 → proxy to backend web route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;

    if (type !== 'st' && type !== 'spd') {
      return NextResponse.json(
        { valid: false, message: 'Tipe dokumen tidak valid.' },
        { status: 400 }
      );
    }

    // Remove /api suffix for web routes
    const baseUrl = BACKEND_URL.replace(/\/api$/, '');
    const url = `${baseUrl}/scan/${type}/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { valid: false, message: 'Gagal terhubung ke server verifikasi.' },
      { status: 500 }
    );
  }
}
