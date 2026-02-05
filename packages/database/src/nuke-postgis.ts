import postgres from 'postgres';

const sql = postgres('postgresql://soundmap:soundmap_dev@localhost:5432/soundmap');

async function nukePostGIS() {
    console.log('☢️ Eliminando TODOS los triggers y funciones PostGIS...');

    // Lista todos los triggers en la tabla sounds
    const triggers = await sql`
        SELECT trigger_name FROM information_schema.triggers 
        WHERE event_object_table = 'sounds'
    `;

    console.log(`Encontrados ${triggers.length} triggers:`, triggers.map(t => t.trigger_name));

    // Eliminar cada trigger
    for (const t of triggers) {
        console.log(`   🗑️ Eliminando trigger: ${t.trigger_name}`);
        await sql.unsafe(`DROP TRIGGER IF EXISTS "${t.trigger_name}" ON sounds CASCADE`);
    }

    // Eliminar funciones PostGIS comunes
    const functions = [
        'update_sound_geom',
        'sounds_geom_trigger',
        'set_sound_geom',
    ];

    for (const fn of functions) {
        console.log(`   🗑️ Eliminando función: ${fn}`);
        await sql.unsafe(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
    }

    await sql.end();
    console.log('✅ Limpieza completa. Ahora puedes subir sonidos.');
}

nukePostGIS().catch(console.error);
