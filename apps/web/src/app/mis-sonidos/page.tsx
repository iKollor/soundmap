import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getUserSounds } from '@/actions/getUserSounds';
import { deleteSound } from '@/actions/sounds';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddressDisplay } from "@/components/AddressDisplay";
import { Plus, Music, Trash2, ExternalLink } from "lucide-react";

// Status badge styling
const statusConfig = {
    pending: { label: 'Pendiente', variant: 'secondary' as const },
    processing: { label: 'Procesando', variant: 'secondary' as const },
    ready: { label: 'Listo', variant: 'default' as const },
    failed: { label: 'Error', variant: 'destructive' as const },
};

export default async function MisSonidosPage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    const sounds = await getUserSounds();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Sonidos</h1>
                    <p className="text-muted-foreground mt-1">
                        {sounds.length} {sounds.length === 1 ? 'sonido' : 'sonidos'} subidos
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/subir">
                        <Plus className="w-4 h-4" />
                        Subir Sonido
                    </Link>
                </Button>
            </div>

            {/* Sound List */}
            {sounds.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No tienes sonidos todavía</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Comienza a contribuir al mapa sonoro subiendo tu primer sonido
                    </p>
                    <Button asChild>
                        <Link href="/subir">Subir mi primer sonido</Link>
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sounds.map((sound) => (
                        <Card key={sound.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="p-4 sm:flex sm:items-start sm:gap-4">
                                    {/* Mobile Top Row: Icon + Actions */}
                                    <div className="flex items-start justify-between sm:hidden mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                                            <Music className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <Link href={`/sonido/${sound.id}`}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <form action={async () => {
                                                'use server';
                                                await deleteSound(sound.id);
                                            }}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    type="submit"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Desktop Icon */}
                                    <div className="hidden sm:flex w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 items-center justify-center flex-shrink-0">
                                        <Music className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-3 sm:space-y-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <Link
                                                href={`/sonido/${sound.id}`}
                                                className="font-semibold text-lg sm:text-base text-foreground hover:text-primary transition-colors truncate"
                                            >
                                                {sound.title}
                                            </Link>
                                            <Badge
                                                variant={statusConfig[sound.status].variant}
                                                className="w-fit shrink-0 text-[10px] h-5"
                                            >
                                                {statusConfig[sound.status].label}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="uppercase text-[10px] h-5">
                                                {sound.category}
                                            </Badge>
                                            {sound.environment && (
                                                <Badge variant="outline" className="uppercase text-[10px] h-5">
                                                    {sound.environment}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground pt-1">
                                            <AddressDisplay
                                                lat={sound.latitude}
                                                lng={sound.longitude}
                                                fallbackAddress={sound.address}
                                                fallbackCity={sound.city}
                                                className="truncate max-w-full"
                                            />
                                            <span className="hidden sm:inline text-muted-foreground/30">•</span>
                                            <span className="text-xs sm:text-sm">
                                                {new Date(sound.createdAt).toLocaleDateString('es', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Desktop Actions */}
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/sonido/${sound.id}`}>
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        <form action={async () => {
                                            'use server';
                                            await deleteSound(sound.id);
                                        }}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                type="submit"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
