import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // TypeScript-specific rules
  {
    files: ["src/**/*.ts", "src/**/*.tsx"], // Apply only to TypeScript files
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json", // Enable type-aware linting
        tsconfigRootDir: process.cwd(), // Ensure correct resolution
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, // TypeScript recommended rules
      ...prettierPlugin.configs.recommended.rules, // Prettier recommended rules
    },
  },
];
