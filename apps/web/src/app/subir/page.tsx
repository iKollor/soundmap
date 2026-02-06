import UploadForm from '@/components/UploadForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

// Allow up to 5 minutes for large file uploads
export const maxDuration = 300;

export default async function SubirPage() {
    const session = await auth();
    if (!session) redirect('/auth/signin');

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-background">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
                        Sube tu Paisaje Sonoro
                    </h1>
                    <p className="text-muted-foreground">
                        Comparte los sonidos de Guayaquil con el mundo. Asegúrate de tener los derechos del audio.
                    </p>
                </div>

                <UploadForm />
            </div>
        </div>
    );
}
