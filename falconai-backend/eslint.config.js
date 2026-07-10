import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginImport from "eslint-plugin-import";
import tseslint from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules", "dist", "build"], // Ignore these folders
  },
  {
    languageOptions: {
      parser: tseslintParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
        },
      ],
      "no-console": "warn",
      "no-debugger": "warn",
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": "error",
      "arrow-body-style": ["error", "as-needed"],
    },
  },
];
