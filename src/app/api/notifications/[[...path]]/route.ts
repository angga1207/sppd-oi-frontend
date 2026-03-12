import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

// GET /api/notifications → list, /api/notifications/unread-count, etc.
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
      ? `${BACKEND_URL}/notifications/${pathStr}${queryString}`
      : `${BACKEND_URL}/notifications${queryString}`;

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

// POST /api/notifications/fcm-token, /api/notifications/{id}/read, /api/notifications/read-all
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';

    let body = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine for some endpoints
    }

    const url = pathStr
      ? `${BACKEND_URL}/notifications/${pathStr}`
      : `${BACKEND_URL}/notifications`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
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

// DELETE /api/notifications/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join('/') : '';
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(`${BACKEND_URL}/notifications/${pathStr}`, {
      method: 'DELETE',
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
