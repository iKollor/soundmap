'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from './AuthButton';
import { ThemeToggle } from './ThemeToggle';
import { Navbar as AceternityNavbar, NavBody, MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle } from "@/components/ui/resizable-navbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const pathname = usePathname();
    const isMixerEnabled = process.env.NEXT_PUBLIC_ENABLE_MIXER === 'true';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    // Hide global navbar on map page as it has its own header
    if (pathname === '/explorar') return null;

    const NavContent = () => (
        <>
            <Link
                href="/explorar"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive('/explorar') ? "text-foreground" : "text-muted-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                Explorar
            </Link>
            {isMixerEnabled ? (
                <Link
                    href="/mixer"
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        isActive('/mixer') ? "text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Mezclador
                </Link>
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed selection:bg-transparent">
                                Mezclador
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Próximamente disponible</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            <Link
                href="/subir"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive('/subir') ? "text-foreground" : "text-muted-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                Subir Sonido
            </Link>
        </>
    );

    return (
        <AceternityNavbar className="top-4">
            <NavBody className="bg-background/80 backdrop-blur-md border border-border/50 shadow-sm">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <span className="font-bold text-lg hidden sm:inline-block">Mapa Sonoro</span>
                    </Link>
                </div>

                {/* Desktop Nav Items */}
                <div className="hidden lg:flex items-center space-x-6">
                    <NavContent />
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <AuthButton />
                </div>
            </NavBody>

            <MobileNav className="lg:hidden"> {/* Changed md:hidden to lg:hidden to match desktop breakpoint */}
                <MobileNavHeader>
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <span className="font-bold">Mapa Sonoro</span>
                    </Link>
                    <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                </MobileNavHeader>
                <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
                    <div className="flex flex-col space-y-4 p-4">
                        <Link href="/" className="font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                            Inicio
                        </Link>
                        <NavContent />
                        <div className="pt-4 flex flex-col gap-4 border-t">
                            <ThemeToggle />
                            <AuthButton />
                        </div>
                    </div>
                </MobileNavMenu>
            </MobileNav>
        </AceternityNavbar>
    );
}
