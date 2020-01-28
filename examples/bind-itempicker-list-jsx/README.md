# Example "bind-itempicker-list"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-itempicker-list/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-itempicker-list)

## Description

Demonstrates how to bind an ItemPicker to a `List` of mutable objects.

`Person.ts` contains the models and a factory `generate` to create random items.

In `ExampleComponent.tsx` we define a data-binding enabled component using the `@component` decorator. It contains a `ItemPicker` with its `items` property bound to the component's `persons` property. The currently selected item is bound to the `details` property, which is described in the text below the picker.

In `app.tsx` a `List` is created and assigned to the `persons` property of a newly created `ExampleComponent` instance. The controls under the view allow manipulation of the list or modify an existing items `name`. The `ExampleComponent` will update itself accordingly. If items in the list are modified or replaced the selection and `details` text will be updated. If items are removed or inserted at or above the selected index the selection will be cleared.
