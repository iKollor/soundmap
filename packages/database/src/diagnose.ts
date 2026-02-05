import postgres from 'postgres';

const sql = postgres('postgresql://soundmap:soundmap_dev@localhost:5432/soundmap');

async function diagnose() {
    console.log('🔍 Diagnóstico de la base de datos...\n');

    // Check sounds
    const sounds = await sql`SELECT id, title, status, created_at FROM sounds ORDER BY created_at DESC LIMIT 5`;
    console.log('📢 Sonidos recientes:');
    sounds.forEach(s => console.log(`   - [${s.status}] ${s.title} (${s.id})`));

    // Check assets
    const assets = await sql`SELECT sa.sound_id, sa.type, sa.url, s.title FROM sound_assets sa JOIN sounds s ON sa.sound_id = s.id ORDER BY sa.created_at DESC LIMIT 5`;
    console.log('\n📦 Assets recientes:');
    assets.forEach(a => console.log(`   - [${a.type}] ${a.title}: ${a.url?.substring(0, 60)}...`));

    // Check for sounds without ready status
    const pending = await sql`SELECT COUNT(*) as count FROM sounds WHERE status != 'ready'`;
    console.log(`\n⏳ Sonidos pendientes/processing: ${pending[0].count}`);

    // Check for sounds without MP3 assets
    const noMp3 = await sql`
        SELECT s.id, s.title, s.status 
        FROM sounds s 
        LEFT JOIN sound_assets sa ON s.id = sa.sound_id AND sa.type = 'mp3'
        WHERE sa.id IS NULL
    `;
    console.log(`\n⚠️ Sonidos sin asset MP3: ${noMp3.length}`);
    noMp3.forEach(s => console.log(`   - [${s.status}] ${s.title}`));

    await sql.end();
}

diagnose().catch(console.error);
