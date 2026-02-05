import postgres from 'postgres';

const sql = postgres('postgresql://soundmap:soundmap_dev@localhost:5432/soundmap');

async function fullDiagnose() {
    console.log('🔍 DIAGNÓSTICO COMPLETO\n');

    // 1. All sounds
    const sounds = await sql`
        SELECT s.id, s.title, s.status, s.latitude, s.longitude, s.created_at
        FROM sounds s
        ORDER BY s.created_at DESC
    `;
    console.log('📢 TODOS LOS SONIDOS:');
    sounds.forEach(s => console.log(`   [${s.status}] ${s.title} @ (${s.latitude?.toFixed(4)}, ${s.longitude?.toFixed(4)})`));

    // 2. All assets
    const assets = await sql`
        SELECT sa.sound_id, sa.type, sa.url, s.title
        FROM sound_assets sa
        JOIN sounds s ON sa.sound_id = s.id
        ORDER BY sa.created_at DESC
    `;
    console.log('\n📦 TODOS LOS ASSETS:');
    assets.forEach(a => console.log(`   [${a.type}] ${a.title}: ${a.url}`));

    // 3. Ready sounds with MP3
    const ready = await sql`
        SELECT s.id, s.title, s.status, s.latitude, s.longitude, sa.url as audio_url
        FROM sounds s
        JOIN sound_assets sa ON s.id = sa.sound_id AND sa.type = 'mp3'
        WHERE s.status = 'ready'
    `;
    console.log('\n✅ SONIDOS LISTOS CON MP3 (lo que debería mostrar el mapa):');
    if (ready.length === 0) {
        console.log('   ⚠️ NINGUNO - Por eso el mapa está vacío!');
    } else {
        ready.forEach(s => console.log(`   ${s.title} @ (${s.latitude?.toFixed(4)}, ${s.longitude?.toFixed(4)}) - ${s.audio_url}`));
    }

    // 4. Count summary
    const byStatus = await sql`SELECT status, COUNT(*) as count FROM sounds GROUP BY status`;
    console.log('\n📊 RESUMEN POR STATUS:');
    byStatus.forEach(s => console.log(`   ${s.status}: ${s.count}`));

    await sql.end();
}

fullDiagnose().catch(console.error);
