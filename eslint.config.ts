import antfu from '@antfu/eslint-config'
import { createSlopConfig } from 'eslint-plugin-slop'

export default antfu({
  ignores: [
    'dist',
  ],
  typescript: true,
  yaml: false,
  rules: {
    'antfu/no-top-level-await': 'off',
    'curly': ['error', 'multi-line'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'style/quotes': ['error', 'single', { avoidEscape: true }],
    'antfu/if-newline': 'off',
    'style/max-statements-per-line': ['error', { max: 2 }],
    'ts/no-redeclare': 'off',
    'node/prefer-global/process': 'off',
    'ts/no-empty-object-type': 'off',
    'ts/no-use-before-define': 'off',
    'no-console': 'off',
    'node/prefer-global/buffer': 'off',
    'e18e/prefer-static-regex': 'off',
    'ts/method-signature-style': 'off',
    'antfu/top-level-function': 'off',
  },
}, ...createSlopConfig({
  cwd: import.meta.dirname,
  inspection: 'full',
}))
