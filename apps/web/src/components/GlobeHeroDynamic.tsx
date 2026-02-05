'use client';

import dynamic from 'next/dynamic';

const GlobeHero = dynamic(() => import('./GlobeHero').then((mod) => mod.GlobeHero), {
    ssr: false,
    loading: () => <div className="absolute top-0 right-0 w-[65%] h-full z-10 pointer-events-none bg-transparent" />,
});

export function GlobeHeroDynamic() {
    return <GlobeHero />;
}
