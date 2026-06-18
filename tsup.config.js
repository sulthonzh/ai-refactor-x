import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/simple-cli.ts', 'test/*.js'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  shims: true,
  sourcemap: true,
  target: 'node18',
  splitting: false,
  minify: false,
});