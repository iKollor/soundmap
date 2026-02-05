'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/components/ThemeProvider';

interface MiniMapProps {
    onLocationSelect: (loc: { lat: number; lng: number }) => void;
    initialLocation?: { lat: number; lng: number };
}

export default function MiniMap({ onLocationSelect, initialLocation }: MiniMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const marker = useRef<maplibregl.Marker | null>(null);
    const { resolvedTheme } = useTheme();
    const [isLocating, setIsLocating] = useState(false);

    // Function to set marker at position
    const setMarkerAt = useCallback((lat: number, lng: number) => {
        if (!map.current) return;

        if (!marker.current) {
            marker.current = new maplibregl.Marker({ color: '#8b5cf6' })
                .setLngLat([lng, lat])
                .addTo(map.current);
        } else {
            marker.current.setLngLat([lng, lat]);
        }

        onLocationSelect({ lat, lng });
    }, [onLocationSelect]);

    // Function to fly to location
    const flyTo = useCallback((lat: number, lng: number, zoom = 15) => {
        if (!map.current) return;
        map.current.flyTo({
            center: [lng, lat],
            zoom,
            duration: 1500,
        });
    }, []);

    // Expose flyTo and setMarkerAt via custom event
    useEffect(() => {
        const handleFlyTo = (e: CustomEvent<{ lat: number; lng: number }>) => {
            const { lat, lng } = e.detail;
            flyTo(lat, lng);
            setMarkerAt(lat, lng);
        };

        window.addEventListener('minimap:flyto', handleFlyTo as EventListener);
        return () => window.removeEventListener('minimap:flyto', handleFlyTo as EventListener);
    }, [flyTo, setMarkerAt]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: resolvedTheme === 'dark' ? '/maps/dark.json' : '/maps/light.json',
            center: [-79.8891, -2.1894], // Guayaquil
            zoom: 11,
            interactive: true
        });

        map.current.on('click', (e) => {
            const { lat, lng } = e.lngLat;
            setMarkerAt(lat, lng);
        });

        // Set initial location if provided
        if (initialLocation) {
            setTimeout(() => {
                setMarkerAt(initialLocation.lat, initialLocation.lng);
                flyTo(initialLocation.lat, initialLocation.lng, 14);
            }, 500);
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [flyTo, setMarkerAt, initialLocation, resolvedTheme]);

    // Note: The above effect intentionally recreates the map when dependencies change
    // to ensure proper initialization with the correct theme and location

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMarkerAt(latitude, longitude);
                flyTo(latitude, longitude, 16);
                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsLocating(false);
                if (error.code === error.PERMISSION_DENIED) {
                    alert('Permiso de ubicación denegado. Habilita la ubicación en tu navegador.');
                } else {
                    alert('No se pudo obtener tu ubicación');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Geolocation button */}
            <button
                type="button"
                onClick={handleGeolocation}
                disabled={isLocating}
                className="absolute top-3 left-3 w-10 h-10 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-white/20 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Usar mi ubicación"
            >
                {isLocating ? (
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
            </button>

            {/* Crosshair in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v4m0 8v4m-8-8h4m8 0h4" />
                </svg>
            </div>
        </div>
    );
}
