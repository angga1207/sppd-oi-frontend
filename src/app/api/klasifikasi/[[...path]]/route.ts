import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

// GET /api/klasifikasi, /api/klasifikasi/123
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

    const url = pathStr
      ? `${BACKEND_URL}/klasifikasi/${pathStr}${queryString}`
      : `${BACKEND_URL}/klasifikasi${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
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
