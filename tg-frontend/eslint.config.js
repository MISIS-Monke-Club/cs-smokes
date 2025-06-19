/* eslint-disable import/no-default-export */
import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"
import prettier from "eslint-plugin-prettier"
import importPlugin from "eslint-plugin-import"
import fsdEslint from "@conarti/eslint-plugin-feature-sliced"
import pluginReactHooks from "eslint-plugin-react-hooks"
/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: [
            "node_modules/**/*",
            "dist/**/*",
            ".storybook/**/*",
            "./coverage/**/*",
            "./public/**/*"
        ],
    },
    {
        files: ["src/*.{js,mjs,cjs,ts,jsx,tsx}"],
    },
    {
        settings: {
            react: {
                version: "detect",
            },
        },
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                allowDefaultProject: [
                    "*.js",
                    "*.mjs",
                    "*.ts",
                    "*.tsx",
                    "*.jsx",
                ],
            },
        },
    },
    pluginJs.configs.recommended,
    // ...tseslint.configs.strict,
    // ...tseslint.configs.stylistic,
    ...tseslint.configs.recommendedTypeCheckedOnly,
    pluginReact.configs.flat["jsx-runtime"],
    {
        plugins: {
            react: pluginReact,
            prettier: prettier,
            import: importPlugin,
            "@conarti/feature-sliced": fsdEslint,
            "react-hooks": pluginReactHooks,
        },
        rules: {
            "no-console": ["error", { allow: ["warn", "error"] }],
            "react/prop-types": ["error"],
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",
            "@typescript-eslint/no-duplicate-type-constituents": "error",
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/no-unsafe-argument": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "@typescript-eslint/consistent-generic-constructors": [
                "error",
                "type-annotation",
            ],
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "no-type-imports",
                },
            ],
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "prettier/prettier": "warn",
            "import/no-default-export": "error",
            "import/default": "error",
            "import/order": "warn",
            "@conarti/feature-sliced/layers-slices": "error",
            "@conarti/feature-sliced/absolute-relative": "error",
            "@conarti/feature-sliced/public-api": "error",
        },
    },
    {
        // Overriding rules and disabling no-default-export for .stories
        files: ["**/*.stories.@(js|jsx|ts|tsx)", ".storybook/**/*"],
        rules: {
            "import/no-default-export": "off",
        },
    },
    {
        settings: {
            "import/resolver": {
                typescript: {
                    project: "./tsconfig.json",
                },
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
            },
        },
    },
]
