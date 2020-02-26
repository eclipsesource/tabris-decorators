# Example "labeled-input-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=labeled-input-jsx/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/labeled-input-jsx)

## Description

Note: This is the JavaScript/JSX variant of the [labeled-input](../labeled-input) TypeScript/JSX example.

Demonstrates the use of one-way and two-way bindings in a realistic example component called `LabeledInput`. The component consists of a `TextView` with its `text` bound to the component `labelText` property (one-way) and a `TextInput` with its `text` bound to the component `text` property (two-way).

In `app.jsx` two instances of the component are created. Entering text in the first one and hitting enter moves the focus to the second one. Entering text there and hitting enter again displays a message using the entered texts.

One-way and two-way bindings require the `@component` decorator on the custom component class.
