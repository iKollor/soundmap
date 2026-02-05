'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressDisplayProps {
    lat: number;
    lng: number;
    fallbackAddress?: string | null;
    fallbackCity?: string | null;
    className?: string;
}

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
        else if (address.road) parts.push(address.road);
        else if (address.neighbourhood) parts.push(address.neighbourhood);

        // Add suburb/city for context
        if (address.suburb) parts.push(address.suburb);
        else if (address.city_district) parts.push(address.city_district);

        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);

        return parts.length > 0 ? parts.join(', ') : data.display_name || 'Ubicación desconocida';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Ubicación no disponible';
    }
}

export function AddressDisplay({ lat, lng, fallbackAddress, fallbackCity, className }: AddressDisplayProps) {
    const [address, setAddress] = useState<string | null>(fallbackAddress || fallbackCity || null);
    const [isLoading, setIsLoading] = useState(!fallbackAddress && !fallbackCity);

    useEffect(() => {
        // If we already have an address from DB, don't fetch
        if (fallbackAddress) return;

        const fetchAddress = async () => {
            setIsLoading(true);
            const fetchedAddress = await reverseGeocode(lat, lng);
            setAddress(fetchedAddress);
            setIsLoading(false);
        };

        fetchAddress();
    }, [lat, lng, fallbackAddress]);

    return (
        <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
            <MapPin className="w-4 h-4 shrink-0" />
            {isLoading ? (
                <span className="animate-pulse">Buscando ubicación...</span>
            ) : (
                <span className="truncate">{address}</span>
            )}
        </div>
    );
}
