# Starter seed : Typescript - Jest

Uses :

- **Jest** as unit testing engine and reporting engine
- **ts-node** to perform conversion from TS to JS
- **prettier & ESLint** for cleaner code
- **Stryker** as mutation testing engine

## Installation

> npm i

## Running tests

> npm test

## Code coverage

The coverage is automatically run with `npm test`. You have a report directly in console. The HTML report can be found in `reports/coverage/lcov-report/index.html`

## Mutation testing

> npm test:mutation

You need green tests to perform the mutation testing.

The mutation report will be located in `reports/mutation/index.html`

Just a test to check that this changed will be sign by my private key
