# Example "bind-two-way-model-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-two-way-model-jsx/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-two-way-model-jsx)

## Description

Note: This is a JavaScript/JSX variant of the [bind-two-way-model](../bind-two-way-model) TypeScript/JSX example.

Demonstrates the use of the `@bindAll` decorator to create bindings between a model assigned to a component and the children of that component. The app creates an instance of the `ExampleComponent` class (grey background), which has a `model` property that can be assigned a `Model` instance by tapping the check box at the top.

In `ExampleComponent` the `model` property is configured via `@bindAll` to establish two two-way bindings and two one-way bindings. The model property `myText` is bound to the `text` property of the `TextInput` using an id selector. Another property `myNumber` is bound to the `selection` property of the `Slider` using a type selector, and one-way to a `TextView`. Finally, `myColor` is bound one-way to the background of the component itself via the `:host` selector, making it yellow while the model is set.

In addition `@bindAll` registers a listener on the model event `blink` which triggers a short animation. The context (`this`) in the listener is always the component so APIs like `_find` are accessible.

By interacting with the two input widgets the user can change the values of the model, if it is currently assigned to the component. If the `model` is property is set to `null` the widget properties are set back to their initial values. In case of the first `TextView` this is the a placeholder text, and for the `Slider` selection it is `0`. The component background and second `TextView` text will be reset to the value they had on creation. The `Model` instance keeps the modified values, so if it is assigned again the widgets will display them again.

Tap the "Blink" button to trigger the `blink` event on the model and thus play the animation.

Two-way bindings require the `@component` decorator on the custom component class and `@property` or `@prop` decorators on the model properties. To make it a type-safe binding (optional) the `@property` decorators require a `type` or `typeGuard` option.
