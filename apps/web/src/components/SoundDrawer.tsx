'use client';

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { SoundMarker } from "@/components/Map";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { X, MapPin, ExternalLink } from "lucide-react";

const WaveformPlayer = dynamic(() => import('@/components/WaveformPlayer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-20 bg-secondary/30 rounded-xl animate-pulse" />
    ),
});

interface SoundDrawerProps {
    sound: SoundMarker | null;
    isOpen: boolean;
    onClose: () => void;
    address: string | null;
    isLoadingAddress: boolean;
    onDelete?: () => void;
    canDelete: boolean;
}

export function SoundDrawer({
    sound,
    isOpen,
    onClose,
    address,
    isLoadingAddress,
    onDelete,
    canDelete
}: SoundDrawerProps) {
    if (!sound) return null;

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-2xl">
                    <DrawerHeader className="relative">
                        <DrawerTitle className="text-2xl font-bold flex items-center gap-3">
                            {/* Clickable icon that links to detail page */}
                            <Link
                                href={`/sonido/${sound.id}`}
                                className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0"
                                title="Ver página completa"
                            >
                                <span className="text-xl">🎵</span>
                            </Link>
                            {/* Clickable title */}
                            <Link
                                href={`/sonido/${sound.id}`}
                                className="hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/50"
                            >
                                {sound.title}
                            </Link>
                        </DrawerTitle>
                        <DrawerDescription className="flex flex-col gap-1.5 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {isLoadingAddress ? (
                                    <span className="animate-pulse">Buscando ubicación...</span>
                                ) : (
                                    <span>{address || 'Ubicación no disponible'}</span>
                                )}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs">
                                <span>Grabado por: <span className="font-medium text-foreground">{sound.authorName}</span></span>
                            </span>
                        </DrawerDescription>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 rounded-full"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </DrawerHeader>

                    {/* data-vaul-no-drag prevents drawer from intercepting touch/click events */}
                    <div className="p-4 pt-0" data-vaul-no-drag>
                        {sound.audioUrl ? (
                            <WaveformPlayer audioUrl={sound.audioUrl} />
                        ) : (
                            <div className="flex items-center justify-center h-20 bg-secondary/30 rounded-xl text-muted-foreground text-sm">
                                Audio no disponible
                            </div>
                        )}
                    </div>

                    <DrawerFooter className="flex-row justify-between gap-2">
                        {/* Link to full detail page */}
                        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:bg-transparent hover:text-foreground">
                            <Link href={`/sonido/${sound.id}`}>
                                Ver detalles
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </Button>

                        <div className="flex gap-2">
                            {canDelete && (
                                <Button variant="destructive" onClick={onDelete}>
                                    Eliminar
                                </Button>
                            )}
                            <DrawerClose asChild>
                                <Button variant="outline">Cerrar</Button>
                            </DrawerClose>
                        </div>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
