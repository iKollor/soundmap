'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { SoundMarker } from '@/components/Map';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthButton } from '@/components/AuthButton';
import { SoundDrawer } from '@/components/SoundDrawer';
import { getSounds, deleteSound } from '@/actions/sounds';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dynamic import for WaveformPlayer (requires browser APIs)
const WaveformPlayer = dynamic(() => import('@/components/WaveformPlayer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-20 bg-secondary/30 rounded-xl animate-pulse" />
    ),
});

// Dynamic import for MapLibre (requires browser APIs)
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

// Reverse geocoding using Nominatim (free OpenStreetMap API)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'MapaSonoroGuayaquil/1.0',
                },
            }
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();

        // Build a user-friendly address from the response
        const address = data.address || {};
        const parts: string[] = [];

        // Priority: specific place name > road > neighbourhood
        if (address.amenity) parts.push(address.amenity);
        else if (address.building) parts.push(address.building);
        else if (address.tourism) parts.push(address.tourism);
        else if (address.leisure) parts.push(address.leisure);

        if (address.road) {
            let road = address.road;
            if (address.house_number) road = `${road} ${address.house_number}`;
            parts.push(road);
        }

        if (address.neighbourhood) parts.push(address.neighbourhood);
        else if (address.suburb) parts.push(address.suburb);

        return parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 2).join(', ') || 'Ubicación desconocida';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Ubicación no disponible';
    }
}



export default function MapView() {
    const { data: session } = useSession();
    const { resolvedTheme } = useTheme();
    const [selectedSound, setSelectedSound] = useState<SoundMarker | null>(null);
    const [sounds, setSounds] = useState<SoundMarker[]>([]);
    const [address, setAddress] = useState<string | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Fetch sounds on mount
    useEffect(() => {
        const fetchSounds = async () => {
            const data = await getSounds();
            setSounds(data);
        };
        fetchSounds();

        // Polling every 10 seconds to update status of processing sounds
        const interval = setInterval(fetchSounds, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkerClick = useCallback(async (sound: SoundMarker) => {
        setSelectedSound(sound);
        setAddress(null);
        setIsLoadingAddress(true);

        // Fetch the address for this location
        const fetchedAddress = await reverseGeocode(sound.latitude, sound.longitude);
        setAddress(fetchedAddress);
        setIsLoadingAddress(false);
    }, []);

    const handleMapClick = useCallback(() => {
        setSelectedSound(null);
        setAddress(null);
    }, []);

    const handleDeleteSound = async () => {
        if (!selectedSound) return;
        const success = await deleteSound(selectedSound.id);
        if (success) {
            setSounds(prev => prev.filter(s => s.id !== selectedSound.id));
            setSelectedSound(null);
        } else {
            alert('Error al eliminar el sonido');
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <Map
                sounds={sounds}
                onMarkerClick={handleMarkerClick}
                onMapClick={handleMapClick}
                theme={resolvedTheme === 'light' ? 'light' : 'dark'}
            />

            <SoundDrawer
                sound={selectedSound}
                isOpen={!!selectedSound}
                onClose={() => { setSelectedSound(null); setAddress(null); }}
                address={address}
                isLoadingAddress={isLoadingAddress}
                onDelete={handleDeleteSound}
                canDelete={session?.user?.id === selectedSound?.ownerId}
            />

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 glass rounded-2xl px-4 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <span className="text-lg">🎧</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-foreground leading-tight">Mapa Sonoro</h1>
                            <p className="text-xs text-muted-foreground">Guayaquil</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        {process.env.NEXT_PUBLIC_ENABLE_MIXER === 'true' ? (
                            <Link
                                href="/mixer"
                                className="bg-secondary/80 hover:bg-secondary text-foreground h-10 px-4 rounded-md hidden sm:inline-flex items-center justify-center text-sm font-medium transition-colors border border-white/10 glass mr-2"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                Mezclador
                            </Link>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="bg-secondary/50 text-muted-foreground h-10 px-4 rounded-md hidden sm:inline-flex items-center justify-center text-sm font-medium border border-white/5 glass mr-2 cursor-not-allowed">
                                            <svg className="w-4 h-4 mr-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                            </svg>
                                            Mezclador (Próximamente)
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Esta función estará disponible muy pronto</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <ThemeToggle className="glass" />
                        <Link
                            href="/subir"
                            className="btn btn-primary h-10 px-4 glass border-none hidden sm:flex"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Subir
                        </Link>
                        <AuthButton className="glass" variant="ghost" />
                    </div>
                </div>
            </header>

            {/* Stats bar - moved to left side to avoid controls */}
            <div className="absolute bottom-20 left-4 glass rounded-xl px-4 py-2.5 z-10">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-muted-foreground">{sounds.length} sonidos</span>
                    </div>
                </div>
            </div>
        </div>
    );
}