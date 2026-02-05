import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false, // Disable dts to avoid TS5074 and speed up build
    clean: true,
    // Bundle internal packages so they are included in the final file
    // and don't need to be resolved at runtime from node_modules
    noExternal: ['@soundmap/database', '@soundmap/shared'],
});
