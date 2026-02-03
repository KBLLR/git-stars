import js from "@eslint/js";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "public/data.json",
      "src/frontend/data.json",
      "scripts/.cache/**",
      "src_legacy/**",
    ],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  {
    files: [
      "scripts/**/*.js",
      "tests/**/*.js",
      "vite.config.js",
      "eslint.config.js",
      "src/analytics/**/*.js",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
      },
    },
  },
  {
    files: ["public/**/*.js", "src/frontend/**/*.js", "logs/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        URL: "readonly",
        Blob: "readonly",
        alert: "readonly",
        console: "readonly",
        fetch: "readonly",
        Event: "readonly",
        URLSearchParams: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        confirm: "readonly",
      },
    },
    rules: {
      "no-alert": "off",
    },
  },
];
