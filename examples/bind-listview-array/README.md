# Example "bind-listview-array"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-listview-array/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-listview-array)

## Description

Note: A JavaScript/JSX variant of the this TypeScript/JSX example can be found [here](../bind-listview-array-jsx).

Demonstrates how to bind a minimal ListView to an `Array` of strings.

In `ExampleComponent.tsx` we define a data-binding enabled component using the `@component` decorator. It contains a `ListView` with its `items` property bound to the component's `stringList` property.

In `app.tsx` a `List` of 100 items is created and assigned to the `stringList` property of a newly created `ExampleComponent` instance. The controls under the view allow manipulation of the list. The ListView will update itself accordingly.
