# Example "labeled-input"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=labeled-input/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/labeled-input)

## Description

Note: A JavaScript/JSX variant of the this TypeScript/JSX example can be found [here](../labeled-input-jsx).

Demonstrates the use of one-way and two-way bindings in a realistic example component called `LabeledInput`. The component consists of a `TextView` with its `text` bound to the component `labelText` property (one-way) and a `TextInput` with its `text` bound to the component `text` property (two-way).

In `app.tsx` two instances of the component are created. Entering text in the first one and hitting enter moves the focus to the second one. Entering text there and hitting enter again displays a message using the entered texts.

One-way and two-way bindings require the `@component` decorator on the custom component class.
