import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    env: {
      NODE_ENV: 'test',
    },
    globalSetup: ['test/setup.ts'],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/server.ts",
        "src/**/index.ts",
        "src/**/*.test.ts",
        "src/**/*.d.ts",
      ],
    },
  },
});
