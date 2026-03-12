import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

// GET /api/search/full?q=keyword&type=all → full search with AI summary
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';

    const url = `${BACKEND_URL}/search/full${queryString}`;

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
