module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: [
        'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    ],
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        ecmaFeatures: {
            jsx: true, // Allows for the parsing of JSX
        },
    },
    rules: {
        '@typescript-eslint/ban-ts-ignore': 0,
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
        '@typescript-eslint/no-empty-function': 0,
        // '@typescript-eslint/no-empty-function': [
        //     'error',
        //     {
        //         allow: [
        // 'methods',
        // 'functions',
        // 'arrowFunctions',
        // 'generatorFunctions',
        // 'asyncMethods',
        // 'generatorMethods',
        // 'asyncFunctions',
        // 'getters',
        // 'setters',
        //         ],
        //     },
        // ],
    },
    settings: {
        react: {
            version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
        },
    },
};
