import { NextRequest, NextResponse } from 'next/server';
import { createOIDCProvider } from '@/lib/oidc-provider';

const provider = createOIDCProvider();

export async function GET(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
