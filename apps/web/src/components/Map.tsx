'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapMarker } from './MapMarker';

// Guayaquil coordinates
const GUAYAQUIL_CENTER: [number, number] = [-79.8891, -2.1894];
const DEFAULT_ZOOM = 13;
const DEFAULT_PITCH = 45;
const DEFAULT_BEARING = -17.6;

export interface SoundMarker {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    category?: string;
    environment?: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    audioUrl?: string;
    ownerId?: string;
    authorName: string;
}

interface MapProps {
    sounds?: SoundMarker[];
    onMarkerClick?: (sound: SoundMarker) => void;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
    className?: string;
    theme?: 'light' | 'dark';
}

interface MapState {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
}

export default function Map({
    sounds = [],
    onMarkerClick,
    onMapClick,
    className = 'w-full h-full',
    theme = 'dark'
}: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Store map state to preserve position on theme change
    const mapStateRef = useRef<MapState>({
        center: GUAYAQUIL_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
    });

    // Map style based on theme
    const mapStyleUrl = theme === 'dark' ? '/maps/dark.json' : '/maps/light.json';

    // Save current map state
    const saveMapState = useCallback(() => {
        if (map.current) {
            const center = map.current.getCenter();
            mapStateRef.current = {
                center: [center.lng, center.lat],
                zoom: map.current.getZoom(),
                pitch: map.current.getPitch(),
                bearing: map.current.getBearing(),
            };
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return; // Prevent re-initialization

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyleUrl, // Initial style
            center: mapStateRef.current.center,
            zoom: mapStateRef.current.zoom,
            pitch: mapStateRef.current.pitch,
            bearing: mapStateRef.current.bearing,
            maxZoom: 18,
            minZoom: 3,
        });

        // Add navigation controls - positioned lower to avoid header
        map.current.addControl(
            new maplibregl.NavigationControl({ visualizePitch: true }),
            'bottom-right'
        );
        map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');
        map.current.addControl(
            new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
            }),
            'bottom-right'
        );

        map.current.on('load', () => setIsLoaded(true));

        // Save state on move
        map.current.on('moveend', saveMapState);

        // Handle map clicks for adding new sounds
        map.current.on('click', (e) => {
            onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });

        return () => {
            saveMapState();
            map.current?.remove();
            map.current = null;
        };
        // Removed mapStyleUrl from dependencies to prevent re-init
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onMapClick, saveMapState]);

    // Handle theme changes separately
    useEffect(() => {
        if (map.current) {
            map.current.setStyle(mapStyleUrl);
        }
    }, [mapStyleUrl]);

    // Update markers when sounds change
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        // Add new markers
        sounds.forEach((sound) => {
            // TEMPORARILY SHOW ALL SOUNDS FOR DEBUGGING
            // if (sound.status !== 'ready') return;

            // Create container for React marker with explicit dimensions
            const el = document.createElement('div');
            el.className = 'sound-marker-container';
            // CRITICAL: Set explicit dimensions to establish positioning context for tooltip centering
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // Render React component into the DOM element
            const root = createRoot(el);
            root.render(
                <MapMarker
                    sound={sound}
                    onClick={() => onMarkerClick?.(sound)}
                />
            );

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([sound.longitude, sound.latitude])
                .addTo(map.current!);

            markersRef.current.push(marker);
        });
    }, [sounds, isLoaded, onMarkerClick]);

    return (
        <div className={`relative ${className}`}>
            <div ref={mapContainer} className="w-full h-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-white/80 text-sm font-medium">Cargando mapa...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
