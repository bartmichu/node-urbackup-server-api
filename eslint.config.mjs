import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  jsdoc.configs['flat/recommended'],
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    plugins: {
      jsdoc,
    },
    rules: {
      // "jsdoc/check-examples": 1,
      "jsdoc/check-indentation": 1,
      "jsdoc/check-line-alignment": 1,
      "jsdoc/check-syntax": 1,
      // "jsdoc/informative-docs": 1,
      "jsdoc/match-description": 1,
      "jsdoc/no-bad-blocks": 1,
      "jsdoc/no-blank-block-descriptions": 1,
      "jsdoc/no-defaults": 1,
      // "jsdoc/no-missing-syntax": 1,
      // "jsdoc/no-restricted-syntax": 1,
      // "jsdoc/no-types": 1,
      "jsdoc/require-asterisk-prefix": 1,
      "jsdoc/require-description": 1,
      "jsdoc/require-description-complete-sentence": 1,
      "jsdoc/require-example": 1,
      // "jsdoc/require-file-overview": 1,
      "jsdoc/require-hyphen-before-param-description": 1,
      "jsdoc/require-throws": 1,
      "jsdoc/sort-tags": 1,
    }
  },
  {
    languageOptions: { globals: globals.node }
  },
];