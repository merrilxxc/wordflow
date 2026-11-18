import * as esbuild from 'esbuild';
const r = await esbuild.build({
  entryPoints: ['src/world/entry.js'],
  bundle: true, minify: true, format: 'iife', target: ['es2019'],
  outfile: 'world3d.js',
  legalComments: 'none',
  alias: { 'three/addons': 'node_modules/three/examples/jsm' },
  nodePaths: ['node_modules'],
  logLevel: 'info'
});
