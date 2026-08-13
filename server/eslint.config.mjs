import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import { configs as jsdocConfigs } from 'eslint-plugin-jsdoc';
import mocha from 'eslint-plugin-mocha';
import promise from 'eslint-plugin-promise';
import globals from 'globals';

// Selectors shared between the base config and the test override.
const restrictedSyntax = [
  {
    selector: 'ForInStatement',
    message:
      'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
  },
  {
    selector: 'ForOfStatement',
    message:
      'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
  },
  {
    selector: 'LabeledStatement',
    message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
  },
  {
    selector: 'WithStatement',
    message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
  },
  // Replaces the old eslint-plugin-no-call rules on queryInterface.
  {
    selector: "CallExpression[callee.object.name='queryInterface'][callee.property.name='removeColumn']",
    message: 'queryInterface.removeColumn is not allowed in migrations, it breaks backward compatibility.',
  },
  {
    selector: "CallExpression[callee.object.name='queryInterface'][callee.property.name='changeColumn']",
    message: 'queryInterface.changeColumn is not allowed in migrations, it breaks backward compatibility.',
  },
];

const jsdocRulesOff = Object.fromEntries(
  [
    'jsdoc/check-alignment',
    'jsdoc/check-param-names',
    'jsdoc/check-tag-names',
    'jsdoc/check-types',
    'jsdoc/no-defaults',
    'jsdoc/no-undefined-types',
    'jsdoc/require-description',
    'jsdoc/require-description-complete-sentence',
    'jsdoc/require-example',
    'jsdoc/require-hyphen-before-param-description',
    'jsdoc/require-jsdoc',
    'jsdoc/require-param',
    'jsdoc/require-param-description',
    'jsdoc/require-param-name',
    'jsdoc/require-param-type',
    'jsdoc/require-returns',
    'jsdoc/require-returns-check',
    'jsdoc/require-returns-description',
    'jsdoc/require-returns-type',
    'jsdoc/tag-lines',
    'jsdoc/valid-types',
  ].map((rule) => [rule, 'off']),
);

export default [
  {
    ignores: ['.nyc_output/**', 'apidoc/**', 'jsdoc/**', 'static/**', 'persist/**', 'doc/**'],
  },
  js.configs.recommended,
  importX.recommended,
  jsdocConfigs['flat/recommended'],
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        BigInt: true,
      },
    },
    plugins: {
      mocha,
      promise,
    },
    settings: {
      jsdoc: {
        captionRequired: true,
      },
    },
    rules: {
      // Best practices (inherited from the previous airbnb-base configuration).
      'array-callback-return': ['error', { allowImplicit: true }],
      'block-scoped-var': 'error',
      camelcase: ['error', { properties: 'never' }],
      'class-methods-use-this': 'error',
      'consistent-return': 'error',
      curly: ['error', 'all'],
      'default-case': ['error', { commentPattern: '^no default$' }],
      'default-param-last': 'warn',
      'dot-notation': ['error', { allowKeywords: true }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'grouped-accessor-pairs': 'error',
      'guard-for-in': 'error',
      'new-cap': ['error', { newIsCap: true, capIsNew: false }],
      'no-alert': 'error',
      'no-array-constructor': 'error',
      'no-await-in-loop': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': 'warn',
      'no-continue': 'error',
      'no-control-regex': 'off',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implied-eval': 'error',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-loop-func': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-object-constructor': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-plusplus': 'error',
      'no-proto': 'error',
      'no-restricted-globals': ['error', 'isFinite', 'isNaN'],
      'no-restricted-properties': [
        'error',
        { object: 'arguments', property: 'callee', message: 'arguments.callee is deprecated' },
        { property: '__defineGetter__', message: 'Please use Object.defineProperty instead.' },
        { property: '__defineSetter__', message: 'Please use Object.defineProperty instead.' },
        { object: 'Math', property: 'pow', message: 'Use the exponentiation operator (**) instead.' },
      ],
      'no-restricted-syntax': ['error', ...restrictedSyntax],
      'no-return-assign': ['error', 'always'],
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-shadow': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-underscore-dangle': ['error', { enforceInMethodNames: true }],
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],
      'no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': ['error', { ignoreDestructuring: false, ignoreImport: false, ignoreExport: false }],
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-void': 'error',
      'object-shorthand': ['error', 'always', { ignoreConstructors: false, avoidQuotes: true }],
      'one-var': ['error', 'never'],
      'operator-assignment': ['error', 'always'],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
      'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
      'prefer-exponentiation-operator': 'error',
      'prefer-numeric-literals': 'error',
      'prefer-object-spread': 'error',
      'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      radix: 'error',
      'symbol-description': 'error',
      'vars-on-top': 'error',
      yoda: 'error',

      // Import hygiene.
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-amd': 'error',
      'import-x/no-dynamic-require': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['**/*.test.js', 'test/**/*.js'],
        },
      ],
      'import-x/no-mutable-exports': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-unresolved': ['error', { commonjs: true, caseSensitive: true }],
      'import-x/no-useless-path-segments': ['error', { commonjs: true }],
      'import-x/no-webpack-loader-syntax': 'error',
      'import-x/order': ['error', { groups: [['builtin', 'external']] }],

      // JSDoc documentation requirements.
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/no-defaults': 'off',
      'jsdoc/no-undefined-types': 'error',
      // The codebase heavily relies on `any` and `Function` in JSDoc types.
      'jsdoc/reject-any-type': 'off',
      'jsdoc/reject-function-type': 'off',
      'jsdoc/require-description': ['error', { descriptionStyle: 'tag' }],
      'jsdoc/require-description-complete-sentence': 'warn',
      'jsdoc/require-example': 'error',
      'jsdoc/require-hyphen-before-param-description': 'error',
      'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: true } }],
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-check': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/tag-lines': 'off',
      'jsdoc/valid-types': 'error',

      // Async code style.
      'mocha/no-exclusive-tests': 'error',
      'promise/prefer-await-to-then': 'warn',
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        should: true,
        TEST_BACKEND_APP: true,
      },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntax,
        {
          selector: "VariableDeclarator[init.callee.name='require'][init.arguments.0.value='sinon']",
          message:
            "Test files must use a per-file sinon sandbox: require('sinon').createSandbox(). The shared singleton accumulates every fake of the whole suite and makes sinon.reset() slower for everyone.",
        },
      ],
    },
  },
  {
    files: ['**/*.controller.js'],
    rules: jsdocRulesOff,
  },
  {
    files: ['services/netatmo/**/*.js', 'test/services/netatmo/**/*.js'],
    rules: {
      'no-underscore-dangle': 'off',
    },
  },
  {
    files: ['test/services/netatmo/**/*.js'],
    rules: {
      'no-promise-executor-return': 'off',
    },
  },
  prettierConfig,
];
