'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect } from 'react';
import { registerUser } from '@/actions/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
            type="submit"
            disabled={pending}
        >
            {pending ? (
                <div className="w-5 h-5 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    Registrarse &rarr;
                    <BottomGradient />
                </>
            )}
        </button>
    );
}

const initialState = {
    error: '',
    success: false
};

export default function SignUpPage() {
    const [state, formAction] = useActionState(registerUser, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            // Redirect to login after successful registration with a flag
            // Using setTimeout to allow user to see success message if wanted, 
            // or just redirect immediately. Let's redirect immediately for flow.
            router.push('/auth/signin?registered=true');
        }
    }, [state?.success, router]);

    return (
        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black border border-white/10">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 mb-4 shadow-lg shadow-fuchsia-500/25">
                    <span className="text-3xl">🚀</span>
                </div>
                <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                    Crear Cuenta
                </h2>
                <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
                    Únete a la comunidad de Mapa Sonoro
                </p>
            </div>

            <form action={formAction} className="my-8">
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                    <LabelInputContainer>
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" name="firstName" type="text" placeholder="Juan" required />
                    </LabelInputContainer>
                    <LabelInputContainer>
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input id="lastName" name="lastName" type="text" placeholder="Pérez" required />
                    </LabelInputContainer>
                </div>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" required />
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
                </LabelInputContainer>

                {state?.error && (
                    <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {state.error}
                    </div>
                )}

                <SubmitButton />

                <p className="text-xs text-center text-neutral-600 dark:text-neutral-400 mt-4 px-4">
                    Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
                </p>

                <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
            </form>

            <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/signin" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                    Inicia Sesión
                </Link>
            </div>
        </div>
    );
}

const BottomGradient = () => {
    return (
        <>
            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </>
    );
};

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex flex-col space-y-2 w-full", className)}>
            {children}
        </div>
    );
};
