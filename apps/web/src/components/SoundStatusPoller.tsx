'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SoundStatusPoller({ soundId }: { soundId: string }) {
    const router = useRouter();
    const [retries, setRetries] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            // Force a server revalidation by refreshing the router
            // Ideally we'd have an API route to check status specifically
            // but router.refresh() works for server components
            router.refresh();
            setRetries(r => r + 1);
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [router]);

    return null; // Invisible component
}
