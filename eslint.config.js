const base = require("@ton/toolchain")
const globals = require("globals")

module.exports = [
  ...base,
  {
    rules: {
      "prettier/prettier": "off",
      "comma-dangle": "off",
      "arrow-parens": "off",
    },
  },
  {
    ignores: [
      "src/executor/emulator-emscripten*",
      "src/config/defaultConfig.ts",
      "src/config/slimConfig.ts",
    ],
  },
  {
    files: ["src/jest/**/*.ts", "src/jest/**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
]
