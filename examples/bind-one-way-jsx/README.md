# Example "bind-one-way-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-one-way-jsx/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-one-way-jsx)

## Description

This is the JavaScript/JSX variant of the [bind-one-way](../bind-one-way) TypeScript/JSX example.

Demonstrates the use of the `bind` JSX attribute prefix to create one-way bindings from a custom component instance to its children. This app creates an instance of the included `ExampleComponent` class and a checkbox that allows to change the property values of that instance.

The `ExampleComponent` property `myText` is bound to the `text` properties of multiple `TextView` children. The first two variants have the same effect, just using different syntax. The third variant demonstrates how to define a fallback value. It will be displayed when the property `myText` is set to `undefined`, which is the case when the checkbox is not checked.

The other property `myObject` is of the type `Model`, which is defined in the same file as `ExampleComponent`. In the component the `Model` field `someNumber` is bound to the `ProgressBar` property `selection`. Nested in `Model` is another `OtherModel` whose property `someString` is bound to the last `TextView`. Since its `text` property has an initial text set, this value will be used as the fallback if the model is detached.

One-way bindings require the `@component` decorator on the custom component class and a `@property` or `@prop` decorator on the component properties. The models either need to use the decorators, or use the `ObservableData` class from the `tabris` module. This is demonstrated with the `OtherModel` class.
