import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    alias: { obsidian: new URL("./tests/fixtures/obsidian-mock.ts", import.meta.url).pathname },
  },
});
