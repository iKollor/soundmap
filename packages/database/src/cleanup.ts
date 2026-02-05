import postgres from 'postgres';

const sql = postgres('postgresql://soundmap:soundmap_dev@localhost:5432/soundmap');

async function cleanupOrphanSounds() {
    console.log('🧹 Limpiando sonidos sin assets MP3...');

    // Eliminar sonidos que no tienen un asset MP3 asociado
    const result = await sql`
        DELETE FROM sounds 
        WHERE id NOT IN (
            SELECT DISTINCT sound_id 
            FROM sound_assets 
            WHERE type = 'mp3'
        )
        RETURNING id, title, status
    `;

    console.log(`✅ Eliminados ${result.length} sonidos fantasma:`);
    result.forEach(s => console.log(`   - ${s.title} (${s.status})`));

    await sql.end();
}

cleanupOrphanSounds().catch(console.error);
