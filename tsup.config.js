import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'simple-cli': 'src/simple-cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  shims: true,
  sourcemap: true,
  target: 'node18',
  splitting: false,
  minify: false,
  external: [/^node:/],
});
