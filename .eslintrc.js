module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'airbnb-base',
  globals: {
    __static: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    'global-require': 0,
    'import/no-unresolved': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-multi-assign': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
        "error",
        "single"
    ],
    "no-plusplus": [2, { "allowForLoopAfterthoughts": true }],
    "comma-dangle": "off",
    "no-console": "off",
    "no-underscore-dangle": "off",
    "camelcase": "off",
    "no-param-reassign": "off",
    "no-useless-escape": "off",
    "no-restricted-properties": "off",
    "consistent-return": "off",
    "guard-for-in": "off",
    "no-loop-func": "off",
    "curly": ["error", "all"],
    "brace-style": ["error", "1tbs"],
    "default-case": "off",
    "prefer-destructuring": "off",
    "import/no-named-as-default": 0,
    "max-len": ["error", {
        "code": 200
    }],
    "implicit-arrow-linebreak": ["error", "beside"],
    "arrow-parens": ["error", "always"],
    "object-curly-spacing": ["error", "never"],
    "no-unused-vars": ["error", {
        "vars": "all",
        "args": "after-used"
    }],
    "class-methods-use-this": [0],
    "no-throw-literal": [0],
    "operator-assignment": [0]
  }
}
