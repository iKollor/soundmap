import postgres from 'postgres';

const sql = postgres('postgresql://soundmap:soundmap_dev@localhost:5432/soundmap');

async function removeTrigger() {
    console.log('🗑️ Eliminando trigger PostGIS obsoleto...');

    // Drop trigger first
    await sql`DROP TRIGGER IF EXISTS update_sound_geom_trigger ON sounds`;
    console.log('✅ Trigger eliminado');

    // Drop function
    await sql`DROP FUNCTION IF EXISTS update_sound_geom()`;
    console.log('✅ Función eliminada');

    await sql.end();
    console.log('✅ Listo para subir sonidos');
}

removeTrigger().catch(console.error);
