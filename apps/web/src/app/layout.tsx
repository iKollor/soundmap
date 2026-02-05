import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Mapa Sonoro',
    description: 'Explora, escucha y mezcla los sonidos de la ciudad. Un archivo sonoro viviente creado por la comunidad.',
    keywords: ['sonido', 'mapa', 'audio', 'grabaciones', 'soundscape'],
    authors: [{ name: 'Mapa Sonoro' }],
    openGraph: {
        title: 'Mapa Sonoro',
        description: 'Explora los sonidos de la ciudad en un mapa interactivo',
        locale: 'es_EC',
        type: 'website',
    },
    twitter: {
        title: 'Mapa Sonoro',
        description: 'Explora los sonidos de la ciudad en un mapa interactivo',
        card: 'summary_large_image',
    },
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <AuthProvider>
                    <ThemeProvider>
                        <NextTopLoader color="#8b5cf6" showSpinner={false} />
                        <Navbar />
                        {children}
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
