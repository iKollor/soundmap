import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getUserStats, getUserSounds } from '@/actions/getUserSounds';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Music, Headphones, Upload, Settings, ChevronRight } from "lucide-react";

export default async function PerfilPage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    const [stats, recentSounds] = await Promise.all([
        getUserStats(),
        getUserSounds(),
    ]);

    const userInitials = session.user?.name
        ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
            {/* Profile Header */}
            <Card className="mb-8 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                <CardContent className="relative pt-0 pb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-10">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                            <AvatarImage src={session.user?.image || ''} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl font-bold">{session.user?.name || 'Usuario'}</h1>
                            <p className="text-muted-foreground">{session.user?.email}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                            <Settings className="w-4 h-4" />
                            Editar perfil
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <Music className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-bold">{stats.totalSounds}</p>
                            <p className="text-sm text-muted-foreground truncate">Sonidos subidos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-bold">{stats.totalListens}</p>
                            <p className="text-sm text-muted-foreground truncate">Reproducciones</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Link
                        href="/mis-sonidos"
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
                    >
                        <div className="flex items-center gap-3">
                            <Music className="w-5 h-5 text-muted-foreground" />
                            <span>Mis Sonidos</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <Link
                        href="/subir"
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
                    >
                        <div className="flex items-center gap-3">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span>Subir Nuevo Sonido</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <Link
                        href="/explorar"
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <span>Explorar Mapa</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Sounds */}
            {recentSounds.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Sonidos Recientes</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/mis-sonidos">Ver todos</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentSounds.slice(0, 3).map((sound, index) => (
                            <Link
                                key={sound.id}
                                href={`/sonido/${sound.id}`}
                                className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${index < 2 ? 'border-b' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                                    <Music className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{sound.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(sound.createdAt).toLocaleDateString('es', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
