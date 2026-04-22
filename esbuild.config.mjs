import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

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
if (prod) { await ctx.rebuild(); process.exit(0); } else { await ctx.watch(); }
