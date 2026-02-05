import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ features: [] });
    }

    try {
        const response = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=-2.1894&lon=-79.8891`,
            {
                headers: {
                    'User-Agent': 'MapaSonoroGuayaquil/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Photon API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json({ error: 'Search failed', features: [] }, { status: 500 });
    }
}
