# Example "bind-one-way"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-one-way/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-one-way)

## Description

Note: This TypeScript example uses no JSX syntax, only decorators. A JavaScript/JSX variant can be found [here](../bind-one-way-jsx), and a TypeScript/JSX variant [here](../bind-one-way).

Demonstrates the use of the `@bind` decorator to create one-way bindings from a custom component instance to its children. This app creates an instance of the included `ExampleComponent` class and checkboxes that allow to change the property values of that instance.

The `ExampleComponent` property `myText` is bound to the `text` properties of a `TextView` child. It has a fallback value (the original `text`) that will be displayed when the property `myText` is set to `undefined`. In this example that is the case when the first checkbox is not checked.

The other property `myObject` is of the type `Model`, which is defined in the same file as `ExampleComponent`. In the component the `Model` field `someNumber` is bound to the `ProgressBar` property `selection` by using a converter to extract `someNumber`.

Nested in `Model` is another `OtherModel` whose property `someString` is bound to the last `TextView`. **This requires the `otherModel` property to be "observing"**, i.e. for its `@property` decorator to have `observe` set to `true`. Alternatively, the `@prop` decorator can be used. If `otherModel` wasn't observing its contained object, a change to `someString` would not be recognized. This applies to all properties of objects nested within the bound value. (However, the JSX data binding syntax does not have this requirement, only `@bind`/`@bindAll`.)

Using `@bind` decorators require the `@component` decorator on the custom component class. The models either need to use the decorators, or use the `ObservableData` class from the `tabris` module. This is demonstrated with the `OtherModel` class.

A similar example is [`bind-two-way-convert`](../bind-two-way-convert), which also uses `@bind` with a converter, but for a two-way binding.
