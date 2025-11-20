import { NextResponse } from 'next/server';

// POST İsteği (Hyperliquid için)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, payload } = body;

    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Hata olsa bile JSON dönmeye çalış
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // Hata olursa boş obje dön, sunucuyu çökertme
    return NextResponse.json({ success: false, error: 'Proxy Error' }, { status: 200 });
  }
}

// GET İsteği (Binance için)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const res = await fetch(targetUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Proxy Error' }, { status: 200 });
  }
}