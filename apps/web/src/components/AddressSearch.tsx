'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface PhotonResult {
    geometry: {
        coordinates: [number, number]; // [lng, lat]
    };
    properties: {
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        state?: string;
        country?: string;
        osm_key?: string;
        osm_value?: string;
    };
}

interface AddressSearchProps {
    onSelect: (result: {
        lat: number;
        lng: number;
        address: string;
        city?: string;
        country?: string;
    }) => void;
    placeholder?: string;
    className?: string;
}

export default function AddressSearch({ onSelect, placeholder = 'Buscar dirección...', className = '' }: AddressSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PhotonResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchAddress = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Using internal proxy to avoid CORS issues
            const response = await fetch(
                `/api/geocode?q=${encodeURIComponent(searchQuery)}`
            );

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data.features || []);
            setIsOpen(true);
        } catch (error) {
            console.error('Address search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchAddress(value);
        }, 300);
    };

    const handleSelect = (result: PhotonResult) => {
        const props = result.properties;
        const [lng, lat] = result.geometry.coordinates;

        // Build address string
        const addressParts: string[] = [];
        if (props.name && props.name !== props.street) addressParts.push(props.name);
        if (props.street) {
            let street = props.street;
            if (props.housenumber) street += ` ${props.housenumber}`;
            addressParts.push(street);
        }
        if (props.city) addressParts.push(props.city);

        const address = addressParts.join(', ') || props.name || 'Ubicación seleccionada';

        setQuery(address);
        setIsOpen(false);
        onSelect({
            lat,
            lng,
            address,
            city: props.city,
            country: props.country,
        });
    };

    const formatResultLabel = (result: PhotonResult) => {
        const props = result.properties;
        const parts: string[] = [];

        if (props.name) parts.push(props.name);
        if (props.street && props.street !== props.name) {
            let street = props.street;
            if (props.housenumber) street += ` ${props.housenumber}`;
            parts.push(street);
        }
        if (props.city) parts.push(props.city);
        if (props.country) parts.push(props.country);

        return parts.join(', ');
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-11 rounded-lg bg-white/5 border border-white/10 pl-10 pr-4 text-white placeholder:text-muted-foreground focus:border-violet-500 transition-colors"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Results dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 py-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {results.map((result, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3"
                        >
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-white/90 line-clamp-2">
                                {formatResultLabel(result)}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
