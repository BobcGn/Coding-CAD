import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
  worker: {
    format: "es"
  },
  resolve: {
    conditions: ["browser"]
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.svelte.ts"],
    setupFiles: ["./src/test/setup.ts"]
  }
});
