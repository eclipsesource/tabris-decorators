# Example "bind-listview-array"

Demonstrates how to bind a minimal ListView to an `Array` of strings.

In `ExampleComponent.tsx` we define a data-binding enabled component using the `@component` decorator. It contains a `ListView` with its `items` property bound to the component's `stringList` property.

In `app.tsx` a `List` of 100 items is created and assigned to the `stringList` property of a newly created `ExampleComponent` instance. The controls under the view allow manipulation of the list. The ListView will update itself accordingly.