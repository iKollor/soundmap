'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/components/ThemeProvider';

interface DisplayMapProps {
    lat: number;
    lng: number;
    zoom?: number;
}

export default function DisplayMap({ lat, lng, zoom = 14 }: DisplayMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const marker = useRef<maplibregl.Marker | null>(null);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!mapContainer.current) return;

        // Initialize display-only map
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: resolvedTheme === 'dark' ? '/maps/dark.json' : '/maps/light.json',
            center: [lng, lat],
            zoom: zoom,
            interactive: false, // Read-only
            attributionControl: false
        });

        // Add marker at sound location
        marker.current = new maplibregl.Marker({ color: '#8b5cf6' })
            .setLngLat([lng, lat])
            .addTo(map.current);

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []); // Run once on mount

    // Handle theme changes
    useEffect(() => {
        if (!map.current) return;
        map.current.setStyle(resolvedTheme === 'dark' ? '/maps/dark.json' : '/maps/light.json');
    }, [resolvedTheme]);

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-xl">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Overlay gradient for aesthetics */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-xl" />
        </div>
    );
}
