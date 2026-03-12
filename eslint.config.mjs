import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: {
    css: true,
  },
  ignores: [
    'public/data/*.json',
    'server/**',
    'docs/**',
    '**/*.md',
  ],
  rules: {
    'no-alert': 'off',
    'ts/no-use-before-define': 'off',
    'e18e/prefer-static-regex': 'off',
    'perfectionist/sort-imports': 'off',
    'perfectionist/sort-named-imports': 'off',
    'perfectionist/sort-modules': 'off',
  },
})
