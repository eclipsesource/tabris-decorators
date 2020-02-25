# Example "bind-listview-array-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-listview-array-jsx/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-listview-array-jsx)

## Description

Note: This is a JavaScript/JSX variant of the [bind-listview-array](../bind-listview-array) TypeScript/JSX example.

Demonstrates how to bind a minimal ListView to an `Array` of strings.

In `ExampleComponent.jsx` we define a data-binding enabled component using the `@component` decorator. It contains a `ListView` with its `items` property bound to the component's `stringList` property.

In `app.jsx` a `List` of 100 items is created and assigned to the `stringList` property of a newly created `ExampleComponent` instance. The controls under the view allow manipulation of the list. The ListView will update itself accordingly.
