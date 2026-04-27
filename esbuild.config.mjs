import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import { copyFileSync, existsSync, mkdirSync, renameSync } from "fs";

const prod = process.argv[2] === "production";

mkdirSync("dist", { recursive: true });

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*"],
  format: "cjs",
  target: "es2020",
  sourcemap: prod ? false : "inline",
  outfile: "dist/main.js",
  plugins: [sveltePlugin({ preprocess: sveltePreprocess() })],
});

function copyAssets() {
  if (existsSync("dist/main.css")) renameSync("dist/main.css", "dist/styles.css");
  copyFileSync("manifest.json", "dist/manifest.json");
}

if (prod) {
  await ctx.rebuild();
  copyAssets();
  process.exit(0);
} else {
  await ctx.watch();
  copyAssets();
}
