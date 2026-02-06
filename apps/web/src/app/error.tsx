'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    const isConnectionError =
        error.message?.includes('connection') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT');

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <div className="text-6xl mb-4">
                        {isConnectionError ? '🔌' : '⚠️'}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isConnectionError ? 'Error de Conexión' : 'Algo salió mal'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isConnectionError
                            ? 'No pudimos conectarnos a los servicios necesarios. Esto puede ser temporal.'
                            : 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'}
                    </p>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-left">
                        <p className="text-sm font-mono text-red-600 dark:text-red-400">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        Intentar de nuevo
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                    >
                        Ir al inicio
                    </button>
                </div>

                {isConnectionError && (
                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg text-sm text-left space-y-2">
                        <p className="font-semibold text-blue-700 dark:text-blue-400">
                            💡 Consejos:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Verifica tu conexión a internet</li>
                            <li>Espera unos segundos e intenta nuevamente</li>
                            <li>Si el problema persiste, contacta al administrador</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
