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
    // PocketBase 가 생성하는 파일들 — 손으로 고치는 대상이 아니므로 린트 제외.
    // (backend/pb_data/types.d.ts 하나에서만 560개 이상의 문제가 보고됨)
    "backend/pb_data/**",
    "backend/pb_migrations/**",
  ]),
]);

export default eslintConfig;
