import postgres from 'postgres';

const sql = postgres('postgresql://soundmap:soundmap_dev@localhost:5432/soundmap');

async function fixStuckSound() {
    console.log('🔧 Arreglando sonido atascado...');

    // Get the stuck sound
    const stuck = await sql`
        SELECT id, title FROM sounds WHERE status = 'processing' LIMIT 1
    `;

    if (stuck.length === 0) {
        console.log('✅ No hay sonidos atascados');
        await sql.end();
        return;
    }

    const soundId = stuck[0].id;
    console.log(`📢 Sonido encontrado: ${stuck[0].title} (${soundId})`);

    // Check if there's already an MP3 asset
    const existing = await sql`
        SELECT url FROM sound_assets WHERE sound_id = ${soundId} AND type = 'mp3'
    `;

    if (existing.length > 0) {
        console.log('✅ Asset MP3 ya existe, actualizando status...');
        await sql`UPDATE sounds SET status = 'ready' WHERE id = ${soundId}`;
    } else {
        // Create a dummy MP3 URL (needs to be manually verified)
        const mp3Url = `http://localhost:3900/sounds/${soundId}/audio.mp3`;
        console.log(`⚠️ Creando asset MP3: ${mp3Url}`);

        await sql`
            INSERT INTO sound_assets (sound_id, type, url, mime_type, file_size)
            VALUES (${soundId}, 'mp3', ${mp3Url}, 'audio/mpeg', 0)
        `;
        await sql`UPDATE sounds SET status = 'ready' WHERE id = ${soundId}`;
    }

    console.log('✅ Sonido actualizado a "ready"');
    await sql.end();
}

fixStuckSound().catch(console.error);
