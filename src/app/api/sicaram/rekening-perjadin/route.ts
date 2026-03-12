import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const { searchParams } = new URL(request.url);

    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      params.set(key, value);
    }

    const url = `${BACKEND_URL}/sicaram/rekening-perjadin?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
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
