# Example "bind-one-way"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-one-way,dev=--dev/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-one-way)

## Description

Demonstrates the use of the `bind` JSX attribute prefix to create one-way bindings from a custom component instance to its children. This app creates an instance of the included `ExampleComponent` class and a checkbox that allows to change the property values of that instance.

The `ExampleComponent` property `myText` is bound to the `text` properties of multiple `TextView` children. The first two variants have the same effect, just using different syntax. The third variant demonstrates how to define a fallback value. It will be displayed when the property `myText` is set to `undefined`, which is the case when the checkbox is not checked.

The other property `myObject` is of the type `Model`, which is defined in the same file as `ExampleComponent`. In the component the `Model` field `someString` is bound to the `TextView` property `text` and `someNumber` to the `ProgressBar` property `selection` properties, once with and without a fallback value.

One-way bindings require the `@component` decorator on the custom component class and the `@property` decorator on the component properties.
