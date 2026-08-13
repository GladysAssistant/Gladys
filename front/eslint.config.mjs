import js from '@eslint/js';
import json from '@eslint/json';
import prettierConfig from 'eslint-config-prettier';
import compat from 'eslint-plugin-compat';
import cypress from 'eslint-plugin-cypress';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: ['build/**', 'coverage/**', 'old-sw.js'],
  },
  {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
  },
  {
    files: ['**/*.{js,jsx}'],
    ...compat.configs['flat/recommended'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        expect: true,
        browser: true,
        global: true,
      },
    },
    plugins: {
      promise,
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        pragma: 'h',
        version: '16.0',
      },
      polyfills: ['fetch', 'Promise'],
    },
    rules: {
      // Preact rules (previously provided by eslint-config-preact).
      'react/no-deprecated': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': ['warn', { ignoreTranspilerName: false }],
      'react/jsx-no-bind': [
        'warn',
        {
          ignoreRefs: true,
          allowFunctions: true,
          allowArrowFunctions: true,
        },
      ],
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'off',
      'react/self-closing-comp': 'error',
      'react/prefer-es6-class': 'error',
      'react/prefer-stateless-function': 'warn',
      'react/require-render-return': 'error',
      'react/no-danger': 'warn',
      'react/no-did-mount-set-state': 'error',
      'react/no-did-update-set-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-string-refs': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-caller': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'warn',
      'no-empty-pattern': 'off',
      'no-empty': 'off',
      'no-iterator': 'error',
      'no-lonely-if': 'error',
      'no-multi-str': 'warn',
      'no-new-wrappers': 'error',
      'no-proto': 'error',
      'no-shadow-restricted-names': 'error',
      'no-shadow': 'off',
      'no-undef-init': 'error',
      'no-unneeded-ternary': 'error',
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      'no-useless-call': 'warn',
      'no-useless-computed-key': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-rename': 'warn',
      'no-var': 'warn',
      strict: ['error', 'never'],

      // Gladys specific rules.
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'prefer-template': 'error',
      'no-async-promise-executor': 'off',
      'promise/prefer-await-to-then': 'warn',
      'react/forbid-dom-props': [
        'warn',
        {
          forbid: [{ propName: 'style', message: 'Using inline style is not recommended. Please use a .css file.' }],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Decorator[expression.callee.name='connect']",
          message:
            'The @connect decorator is not allowed anymore. Please use connect() function instead. See doc: https://github.com/developit/unistore',
        },
      ],
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    files: ['cypress/**/*.js'],
    plugins: cypress.configs.recommended.plugins,
    languageOptions: cypress.configs.recommended.languageOptions,
    rules: {
      ...cypress.configs.recommended.rules,
      'promise/prefer-await-to-then': 'off',
    },
  },
  {
    files: ['**/*.json'],
    ignores: ['package-lock.json'],
    language: 'json/json',
    ...json.configs.recommended,
  },
  {
    files: ['**/*.{js,jsx}'],
    ...prettierConfig,
  },
];
