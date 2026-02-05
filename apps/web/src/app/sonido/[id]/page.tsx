import { db, sounds, soundAssets, eq, type Sound, type SoundAsset, type User } from '@soundmap/database';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import WaveformPlayer from '@/components/WaveformPlayer';
import SoundStatusPoller from '@/components/SoundStatusPoller';
import DisplayMap from '@/components/DisplayMap';
import { AddressDisplay } from '@/components/AddressDisplay';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type SoundWithDetails = Sound & {
    user: User;
    assets: SoundAsset[];
};

async function getSound(id: string): Promise<SoundWithDetails | null> {
    const sound = await db.query.sounds.findFirst({
        where: eq(sounds.id, id),
        with: {
            user: true,
        },
    });

    if (!sound) return null;

    const assets = await db.query.soundAssets.findMany({
        where: eq(soundAssets.soundId, id),
    });

    return { ...sound, assets };
}

export default async function SoundPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sound = await getSound(id);

    if (!sound) notFound();

    const isProcessing = sound.status === 'processing' || sound.status === 'pending';
    const mp3Asset = sound.assets.find(a => a.type === 'mp3');
    const originalAsset = sound.assets.find(a => a.type === 'original');

    // Fallback audio URL
    const audioUrl = mp3Asset?.url || (isProcessing ? null : originalAsset?.url);
    const userInitials = sound.user.displayName
        ? sound.user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl mt-20">
            <div className="grid gap-8">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-primary hover:bg-primary/90 uppercase">
                            {sound.category}
                        </Badge>
                        {sound.environment && (
                            <Badge variant="secondary" className="uppercase">
                                {sound.environment}
                            </Badge>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{sound.title}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 bg-secondary/30 pr-3 py-1 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={sound.user.avatarUrl || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{sound.user.displayName || 'Usuario Anónimo'}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4 hidden sm:block" />
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(sound.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                        <Separator orientation="vertical" className="h-4 hidden sm:block" />
                        <AddressDisplay
                            lat={sound.latitude}
                            lng={sound.longitude}
                            fallbackAddress={sound.address}
                            fallbackCity={sound.city}
                        />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Player & Metadata */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Player Card */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-0">
                                {isProcessing ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                                        <SoundStatusPoller soundId={id} />
                                        <div className="relative w-16 h-16">
                                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-semibold">Procesando audio...</h3>
                                            <p className="text-muted-foreground max-w-md">
                                                Estamos optimizando el archivo y generando su espectrograma.
                                            </p>
                                        </div>
                                    </div>
                                ) : sound.status === 'failed' ? (
                                    <Alert variant="destructive" className="m-6">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <AlertTitle>Error de procesamiento</AlertTitle>
                                        <AlertDescription>
                                            Ocurrió un problema al procesar este audio. Por favor intenta subirlo nuevamente.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="p-6">
                                        {audioUrl && <WaveformPlayer audioUrl={audioUrl} />}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Description & Tags */}
                        <div className="space-y-6">
                            {sound.description && (
                                <div className="prose prose-invert max-w-none text-foreground">
                                    <h3 className="text-lg font-semibold mb-2">Acerca de este sonido</h3>
                                    <p className="text-muted-foreground leading-relaxed text-lg">{sound.description}</p>
                                </div>
                            )}

                            {sound.tags && sound.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {sound.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="px-3 py-1 font-normal text-sm hover:bg-secondary/80 bg-secondary/50">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Technical Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Detalles Técnicos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sample Rate</p>
                                        <p className="font-mono font-medium">{sound.sampleRate ? `${sound.sampleRate / 1000} kHz` : '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bit Depth</p>
                                        <p className="font-mono font-medium">{sound.bitDepth ? `${sound.bitDepth} bit` : '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canales</p>
                                        <p className="font-mono font-medium">
                                            {sound.channels === 1 ? 'Mono' : sound.channels === 2 ? 'Stereo' : `${sound.channels || '—'} ch`}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</p>
                                        <p className="font-mono font-medium lowercase">{mp3Asset ? 'MP3' : originalAsset?.url.split('.').pop() || '—'}</p>
                                    </div>
                                </div>

                                {sound.equipment && (
                                    <>
                                        <Separator className="my-4" />
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Equipo Grabación</p>
                                                <p className="text-foreground font-medium">{sound.equipment}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Map */}
                    <div className="space-y-6">
                        <Card className="overflow-hidden border-border/50 sticky top-24">
                            <div className="h-[300px] w-full relative">
                                <DisplayMap lat={sound.latitude} lng={sound.longitude} />
                                {(sound.city || sound.address) && (
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-lg p-3 flex items-center gap-3 shadow-lg">
                                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div className="overflow-hidden min-w-0">
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ubicación</div>
                                                {sound.address ? (
                                                    <div className="text-sm font-medium text-foreground truncate">{sound.address}</div>
                                                ) : sound.city ? (
                                                    <div className="text-sm font-medium text-foreground truncate">{sound.city}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 h-9 bg-background/50" asChild>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${sound.latitude},${sound.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0C7.8 0 4.2 2.6 2.6 6.3c-1.3 2.8-1.1 6.1.6 8.8.4.7.9 1.3 1.5 1.9L12 24l7.3-7c.6-.6 1.1-1.2 1.5-1.9 1.7-2.7 1.9-6 .6-8.8C19.8 2.6 16.2 0 12 0zm0 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
                                            </svg>
                                            Google Maps
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 h-9 bg-background/50" asChild>
                                        <a
                                            href={`https://maps.apple.com/?ll=${sound.latitude},${sound.longitude}&q=${encodeURIComponent(sound.title)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {/* Apple Maps navigation arrow icon */}
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                            </svg>
                                            Apple Maps
                                        </a>
                                    </Button>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Coordenadas</div>
                                    <div className="font-mono text-xs text-foreground/70 select-all cursor-pointer hover:text-foreground transition-colors">
                                        {sound.latitude.toFixed(6)}, {sound.longitude.toFixed(6)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
