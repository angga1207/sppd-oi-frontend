import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

// GET /api/surat-tugas → list, /api/surat-tugas/stats, /api/surat-tugas/123, /api/surat-tugas/123/download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    const isDownload = pathStr.endsWith('/download') || pathStr.endsWith('/regenerate');

    const url = pathStr
      ? `${BACKEND_URL}/surat-tugas/${pathStr}${queryString}`
      : `${BACKEND_URL}/surat-tugas${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: isDownload ? '*/*' : 'application/json',
        Authorization: authHeader,
      },
    });

    // For download endpoints, stream the binary file
    if (isDownload && response.ok && response.headers.get('content-type')?.includes('application/')) {
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition') || '';
      const buffer = await response.arrayBuffer();

      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition || 'attachment',
          'Content-Length': String(buffer.byteLength),
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Gagal terhubung ke server.' },
      { status: 500 }
    );
  }
}

// POST /api/surat-tugas → create, /api/surat-tugas/123/kirim, etc.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';
    const userAgent = request.headers.get('X-User-Agent') || request.headers.get('User-Agent') || '';
    const body = await request.json();

    const url = pathStr
      ? `${BACKEND_URL}/surat-tugas/${pathStr}`
      : `${BACKEND_URL}/surat-tugas`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
        'X-User-Agent': userAgent,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Gagal terhubung ke server.' },
      { status: 500 }
    );
  }
}

// PUT /api/surat-tugas/123
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';
    const userAgent = request.headers.get('X-User-Agent') || request.headers.get('User-Agent') || '';
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/surat-tugas/${pathStr}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
        'X-User-Agent': userAgent,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Gagal terhubung ke server.' },
      { status: 500 }
    );
  }
}

// DELETE /api/surat-tugas/123
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';
    const userAgent = request.headers.get('X-User-Agent') || request.headers.get('User-Agent') || '';

    const response = await fetch(`${BACKEND_URL}/surat-tugas/${pathStr}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
        'X-User-Agent': userAgent,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Gagal terhubung ke server.' },
      { status: 500 }
    );
  }
}
