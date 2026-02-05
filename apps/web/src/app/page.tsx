import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GlobeHeroDynamic } from '@/components/GlobeHeroDynamic';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default async function HomePage() {
    const isMixerEnabled = process.env.NEXT_PUBLIC_ENABLE_MIXER === 'true';

    return (
        <main className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-background via-background">
                {/* Globe on the right side */}
                <GlobeHeroDynamic />

                {/* Content on the left */}
                <div className="relative container mx-auto px-4 py-24 lg:py-32 z-30 pointer-events-none">
                    <div className="max-w-xl pointer-events-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm text-violet-400 mb-8">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Archivo sonoro comunitario
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
                            Mapa Sonoro
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground mb-10">
                            Explora, escucha y mezcla los sonidos de la ciudad.
                            Un archivo sonoro viviente creado por la comunidad.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg" className="h-14 px-8 text-base">
                                <Link href="/explorar">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    Explorar Mapa
                                </Link>
                            </Button>

                            {isMixerEnabled ? (
                                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500/50">
                                    <Link href="/mixer">
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                        Abrir Mezclador
                                    </Link>
                                </Button>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="lg" className="h-14 px-8 text-base border-violet-500/30 bg-muted/50 text-muted-foreground cursor-not-allowed hover:bg-muted/50">
                                                <svg className="w-5 h-5 mr-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                </svg>
                                                Mezclador (Próximamente)
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Esta función estará disponible muy pronto</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="hover:shadow-lg hover:shadow-violet-500/10 transition-all border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center mb-4">
                                    <span className="text-2xl">🗺️</span>
                                </div>
                                <CardTitle className="text-xl">Mapa 3D Interactivo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Navega por Guayaquil en un mapa 3D con edificios y descubre grabaciones de campo geolocalizadas.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg hover:shadow-fuchsia-500/10 transition-all border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
                            {!isMixerEnabled && (
                                <div className="absolute top-4 right-4 z-10">
                                    <Badge variant="secondary" className="bg-fuchsia-500/10 text-fuchsia-500 hover:bg-fuchsia-500/20 border-fuchsia-500/20">
                                        Próximamente
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/20 flex items-center justify-center mb-4">
                                    <span className="text-2xl">🎚️</span>
                                </div>
                                <CardTitle className="text-xl">Mezclador de 4 Pistas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Crea composiciones únicas mezclando sonidos de la ciudad con controles de volumen, pan y loop.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg hover:shadow-amber-500/10 transition-all border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-4">
                                    <span className="text-2xl">🎤</span>
                                </div>
                                <CardTitle className="text-xl">Contribuye</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Sube tus grabaciones con geolocalización y añade al archivo sonoro comunitario de Guayaquil.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>© 2024 Mapa Sonoro. Desarrollado por Isai Tobar</p>
                </div>
            </footer>
        </main>
    );
}
