import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "playwright-report/**", "prisma/generated/**", "test-results/**"]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
