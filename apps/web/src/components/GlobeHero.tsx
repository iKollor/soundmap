'use client';

import { World } from "@/components/ui/globe";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";

// Position type for arcs
type Position = {
    order: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    arcAlt: number;
    color: string;
};

// Violet/Fuchsia color palette matching the app theme
const ARC_COLORS_DARK = [
    "#d946ef", // fuchsia-500
];
const ARC_COLORS_LIGHT = [
    "#8952e1", // fuchsia-500
];
// Globe configuration - seamless blend with background
const darkGlobeConfig = {
    pointSize: 4,
    globeColor: "#8952e1",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#8952e1",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#e433ff",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
    transitionSpeed: 5,
};

const lightGlobeConfig = {
    pointSize: 4,
    globeColor: "#FFFFFF",
    showAtmosphere: true,
    atmosphereColor: "#7c3aed", // violet-600
    atmosphereAltitude: 0.1,
    emissive: "#a855f7", // purple-500
    emissiveIntensity: 0.2, // Slightly higher for light mode visibility
    shininess: 1,
    polygonColor: "rgba(179, 42, 216,0.5)",
    ambientLight: "#ffffff",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
    opacity: 0.2, // Very transparent
    transitionSpeed: 5,
};


function getRandomColorDark() {
    return ARC_COLORS_DARK[Math.floor(Math.random() * ARC_COLORS_DARK.length)];
}

function getRandomColorLight() {
    return ARC_COLORS_LIGHT[Math.floor(Math.random() * ARC_COLORS_LIGHT.length)];
}

// Major cities around the world for diverse arc endpoints
const WORLD_CITIES = [
    { lat: -2.1894, lng: -79.8891, name: 'Guayaquil' },
    { lat: -12.0464, lng: -77.0428, name: 'Lima' },
    { lat: -33.4489, lng: -70.6693, name: 'Santiago' },
    { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires' },
    { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro' },
    { lat: -23.5505, lng: -46.6333, name: 'Sao Paulo' },
    { lat: 4.7110, lng: -74.0721, name: 'Bogota' },
    { lat: 10.4806, lng: -66.9036, name: 'Caracas' },
    { lat: 19.4326, lng: -99.1332, name: 'Mexico City' },
    { lat: 40.7128, lng: -74.0060, name: 'New York' },
    { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
    { lat: 51.5074, lng: -0.1278, name: 'London' },
    { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
    { lat: 40.4168, lng: -3.7038, name: 'Madrid' },
    { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
    { lat: 22.3193, lng: 114.1694, name: 'Hong Kong' },
    { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
    { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
];

// Generate arcs connecting Guayaquil to cities worldwide
function generateWorldwideArcs(isDarkMode: boolean): Position[] {
    const arcs: Position[] = [];
    const guayaquil = WORLD_CITIES[0];

    // Create arcs from Guayaquil to other cities
    for (let i = 1; i < WORLD_CITIES.length; i++) {
        const city = WORLD_CITIES[i];
        arcs.push({
            order: i,
            startLat: guayaquil.lat,
            startLng: guayaquil.lng,
            endLat: city.lat,
            endLng: city.lng,
            arcAlt: 0.15 + Math.random() * 0.2, // Higher arcs for longer distances
            color: isDarkMode ? getRandomColorDark() : getRandomColorLight(),
        });
    }

    // Add some inter-city connections (not through Guayaquil)
    const citySample = WORLD_CITIES.slice(1);
    for (let i = 0; i < 6; i++) {
        const from = citySample[Math.floor(Math.random() * citySample.length)];
        const to = citySample[Math.floor(Math.random() * citySample.length)];
        if (from !== to) {
            arcs.push({
                order: 100 + i,
                startLat: from.lat,
                startLng: from.lng,
                endLat: to.lat,
                endLng: to.lng,
                arcAlt: 0.1 + Math.random() * 0.15,
                color: isDarkMode ? getRandomColorDark() : getRandomColorLight(),
            });
        }
    }

    return arcs;
}

export function GlobeHero() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [globeReady, setGlobeReady] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = !mounted || resolvedTheme === "dark";
    const worldwideArcs = useMemo(() => generateWorldwideArcs(isDarkMode), [isDarkMode]);

    const config = useMemo(() => {
        const baseConfig = !mounted || resolvedTheme === "dark" ? darkGlobeConfig : lightGlobeConfig;
        return {
            ...baseConfig,
            onGlobeReady: () => setGlobeReady(true)
        };
    }, [mounted, resolvedTheme]);

    return (
        <div className="absolute top-0 right-0 w-[65%] h-full z-10 pointer-events-none">
            {/* Position globe so it's cut off at the left edge */}
            <div className="absolute -right-[15%] top-1/2 -translate-y-1/2 w-[900px] h-[900px] lg:w-[1100px] lg:h-[1100px]">
                {/* Gradient fade on the left to blend into content - NOT blocking pointer events */}
                <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={globeReady ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 1.0, ease: "backInOut" }} // Faster fade to let the 3D zoom shine
                    className="w-full h-full"
                >
                    <World
                        globeConfig={config}
                        data={worldwideArcs}
                    />
                </motion.div>
            </div>
        </div>
    );
}
