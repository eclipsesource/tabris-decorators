# Example "connect-js"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-one-way/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/connect-jsx)

## Description

Note: A TypeScript/JSX variant of the this plain JavaScript example can be found [here](../connect). A plain JavaScript variant can be found [here](../connect-js).

Demonstrates the use of the `connect` decorator function to connect custom components to a redux store. This app sets up a redux store with a root state object containing a string  and a number property `myString` and `myNumber`. Two actions are supported by that store: `SET_RANDOM_NUMBER` sets `myNumber` to a random number, and `TOGGLE_STRING` sets `myString` to `'HelloWorld'` or `'Another Hello World'` depending on the actions' `checked` boolean property.

The file `types.d.ts` makes this configuration known globally for the IDEs that support JavaScript projects with TypeScript declarations, i.e. Visual Studio Code. It also defines some type aliases that can be used in JsDoc annotations. The file has no impact at runtime.

The app then creates instances of two components connected to the store:

The `ExampleComponent` is a custom component with a `text` property and a `toggle` event. The `text` property controls what text the component displays and is mapped to the `myString` property of the root state object. The `toggle` event can be triggered by the components `CheckBox` and is mapped to the `TOGGLE_STRING` action. Therefore checking/unchecking the check box toggles the message.

The `FunctionalComponent` is a functional component that produces a `Composite` that wraps a single `Button` widget. (It could also directly return a button, it is done this way to showcase the usage of the `apply` feature of `connect`.) The button's `text` property is mapped to the `myNumber` property of the root state object. The button's select event is mapped to the `SET_RANDOM_NUMBER` action. Therefore tapping the button changes its text.
