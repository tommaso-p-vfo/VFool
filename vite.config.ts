import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { fileURLToPath } from 'node:url';

// tutto ciò che è peer dependency (e i suoi sub-path) NON va nel bundle
const external = /^(react|react-dom|react-bootstrap|bootstrap)(\/.*)?$/;

export default defineConfig({
    plugins: [
        react(),
        dts({
            tsconfigPath: './tsconfig.build.json',
        }),
    ],
    build: {
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            cssFileName: 'style',          // → dist/style.css
        },
        rolldownOptions: {
            external: (id) => external.test(id),
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
            },
        },
        cssCodeSplit: false,
        sourcemap: true,
        emptyOutDir: true,
    },
});