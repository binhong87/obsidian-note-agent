import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import { copyFileSync, existsSync } from "fs";

const prod = process.argv[2] === "production";
const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*"],
  format: "cjs",
  target: "es2020",
  sourcemap: prod ? false : "inline",
  outfile: "main.js",
  plugins: [sveltePlugin({ preprocess: sveltePreprocess() })],
});

function copyStyles() {
  if (existsSync("main.css")) copyFileSync("main.css", "styles.css");
}

if (prod) {
  await ctx.rebuild();
  copyStyles();
  process.exit(0);
} else {
  // In watch mode, copy styles after each rebuild
  await ctx.watch();
  // Perform initial copy
  copyStyles();
}
