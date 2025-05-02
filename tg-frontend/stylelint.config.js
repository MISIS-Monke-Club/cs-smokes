/* eslint-disable import/no-default-export */
/** @type {import('stylelint').Config} */
export default {
    extends: ["stylelint-config-standard-scss", "stylelint-config-clean-order"],
    rules: {
        "function-name-case": null,
        "selector-type-case": null,
        "value-keyword-case": null,
        "rule-empty-line-before": [
            "always",
            { severity: "warning", ignore: ["after-comment", "first-nested"] },
        ],
        "font-family-name-quotes": "always-unless-keyword",
        "font-family-no-missing-generic-family-keyword": [
            true,
            { severity: "warning" },
        ],
        "custom-property-pattern": [
            "^([a-z][a-z0-9-]*|[a-z][a-zA-Z0-9]*)$",
            {
                message:
                    "property name expected to be camel case in components or cebab in _properties.scss",
            },
        ],
        "comment-empty-line-before": ["always", { severity: "warning" }],
        "selector-class-pattern": "^[a-z][a-zA-Z0-9]*$", // Camel case
        "declaration-block-no-redundant-longhand-properties": [
            true,
            {
                ignoreLonghands: ["/padding/", "margin/"],
                ignoreShorthands: [
                    "place-content",
                    "border",
                    "padding",
                    "margin",
                    "flex",
                    "grid",
                    "background",
                ],
            },
        ],
        "scss/double-slash-comment-empty-line-before": [
            "always",
            {
                ignore: [
                    "between-comments",
                    "stylelint-commands",
                    "inside-block",
                ],
            },
        ],
        "scss/at-function-pattern": "^[a-z][a-zA-Z0-9]*$", // Camel case
    },
}
