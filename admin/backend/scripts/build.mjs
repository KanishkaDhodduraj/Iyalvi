import { build } from "esbuild";

await build({
  entryPoints: ["src/application.mts"],
  outfile: "src/app.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  external: ["express", "sharp"],
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
});
