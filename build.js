const esbuild = require('esbuild');

async function build() {
    await esbuild.build({
        entryPoints: ['src/popup.js'],
        bundle: true,
        outfile: 'dist/popup.js',
        minify: false,
        sourcemap: true,
        platform: 'browser',
        target: 'es2020',
    });
    console.log('Build complete: dist/popup.js');
}

build().catch(() => process.exit(1));
