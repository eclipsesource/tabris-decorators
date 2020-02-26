# Example "bind-two-way-model-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-two-way-model-jsx/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-two-way-model-jsx)

## Description

Note: This is a JavaScript/JSX variant of the [bind-two-way-model](../bind-two-way-model) TypeScript/JSX example.

Demonstrates the use of the `@bindAll` decorator to create two-way bindings between a model assigned to a component and the children of that component. The app creates an instance of the `ExampleComponent` class (grey background), which has a `model` property that can be assigned a `Model` instance by tapping the check box at the top.

In `ExampleComponent` the `model` property is configured via `@bindAll` to establish two two-way bindings. The model property `myText` is bound to the `text` property of the `TextInput` with the id `input1`. The other property `myNumber` is bound to the `selection` property of the `Slider` with the id `input2`.

By interacting with the two input widgets the user can change the values of the model, if it is currently assigned to the component. If the `model` is property is set to `null` the two widget properties are set back to their initial values. In case of the `TextView` this is the a placeholder text, and for the `Slider` selection it is `0`. The `Model` instance keeps the modified values, so if it is assigned again the widgets will display them again.

Two-way bindings require the `@component` decorator on the custom component class and `@property` decorators on the model properties. To make it a type-safe binding the `@property` decorators require a `type` or `typeGuard` option.
