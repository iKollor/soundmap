'use server';

import { syncUserFromKeycloak } from '@soundmap/database';
import { revalidatePath } from 'next/cache';

interface RegisterState {
    error?: string;
    success?: boolean;
}

export async function registerUser(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    if (!email || !password || !firstName || !lastName) {
        return { error: 'Todos los campos son requeridos' };
    }

    try {
        // 1. Get Admin Token (Client Credentials Grant)
        const params = new URLSearchParams();
        params.append('client_id', process.env.KEYCLOAK_CLIENT_ID!);
        params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET!);
        params.append('grant_type', 'client_credentials');

        const tokenRes = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error('Failed to get admin token. Status:', tokenRes.status);
            console.error('Response:', tokenData);
            throw new Error(`Failed to get admin token: ${JSON.stringify(tokenData)}`);
        }

        // 2. Create User in Keycloak
        // Extract Realm Admin URL (remove /protocol/openid-connect/token and adding /admin/realms/{realm}/users)
        const adminUrl = process.env.KEYCLOAK_ISSUER!.replace('/realms/', '/admin/realms/') + '/users';

        const createRes = await fetch(adminUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: email,
                email: email,
                firstName: firstName,
                lastName: lastName,
                enabled: true,
                credentials: [{
                    type: 'password',
                    value: password,
                    temporary: false
                }],
                emailVerified: true,
                requiredActions: []
            })
        });

        if (createRes.status === 409) {
            return { error: 'El usuario ya existe' };
        }

        if (!createRes.ok) {
            const err = await createRes.json();
            console.error('Keycloak create error:', err);
            return { error: 'Error al crear usuario en Keycloak' };
        }

        // Success! The user can now login via signIn('credentials')
        return { success: true };

    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Error interno del servidor' };
    }
}
