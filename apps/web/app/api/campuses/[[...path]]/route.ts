import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.INTERNAL_API_URL ?? 'http://api:3001';

function unavailable(): NextResponse {
  return NextResponse.json({ message: 'La session serveur API est indisponible.' }, { status: 503 });
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const token = process.env.API_SESSION_TOKEN;
  if (!token) return unavailable();

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  try {
    return await fetch(`${apiUrl}/campuses/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: "L'API est indisponible." }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxy(request, (await context.params).path ?? []);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxy(request, (await context.params).path ?? []);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxy(request, (await context.params).path ?? []);
}