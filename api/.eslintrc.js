module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      sourceType: 'module'
    },
    env: {
      node: true,
      es6: true
    },
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',  // TS rules
      'plugin:prettier/recommended'            // runs Prettier as an ESLint rule
    ],
    rules: {
      'prettier/prettier': 'error'
    }
  }
  