import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

// GET /api/spd, /api/spd/123, /api/spd/123/download
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
    const isDownload = pathStr.endsWith('/download');

    const url = pathStr
      ? `${BACKEND_URL}/spd/${pathStr}${queryString}`
      : `${BACKEND_URL}/spd${queryString}`;

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

// PUT /api/spd/123
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

    const response = await fetch(`${BACKEND_URL}/spd/${pathStr}`, {
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

// POST /api/spd/123/laporan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';
    const userAgent = request.headers.get('X-User-Agent') || request.headers.get('User-Agent') || '';
    const contentType = request.headers.get('Content-Type') || '';

    let fetchOptions: RequestInit;

    // Handle multipart form data (for file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      fetchOptions = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
          'X-User-Agent': userAgent,
        },
        body: formData,
      };
    } else {
      const body = await request.json();
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
          'X-User-Agent': userAgent,
        },
        body: JSON.stringify(body),
      };
    }

    const response = await fetch(`${BACKEND_URL}/spd/${pathStr}`, fetchOptions);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Gagal terhubung ke server.' },
      { status: 500 }
    );
  }
}
