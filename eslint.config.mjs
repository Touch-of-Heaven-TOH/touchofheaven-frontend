import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Static assets, never source to lint - notably the vendored MapLibre
    // worker bundle (components/map/BusinessMap.tsx explains why it lives
    // here instead of going through the bundler).
    "public/**",
  ]),
]);

export default eslintConfig;
