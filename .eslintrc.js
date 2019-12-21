module.exports = {
    extends: [
        "plugin:prettier/recommended",
        "prettier/standard"
    ],
    env: {
        browser: true,
        es6: true
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    },
    rules: {
        quotes: ["error", "double"],
        semi: ["error", "always"]
    }
};
