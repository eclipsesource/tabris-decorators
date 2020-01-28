# Example "bind-and-convert"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-and-convert/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-and-convert)

## Description

Demonstrates the use of converter functions and template syntax in one-way bindings. This app creates an instance of the included `ExampleComponent` class and a checkbox that allows to change the property values of that instance.

The `ExampleComponent` property `myTime` is of the type `Date` and is converted to a string to bind to the `text` properties of multiple `TextView` children. Three variations are included, one directly using the `to` helper function, one using a custom converter function (`toTimeString`), and one using the raw data binding configuration object.

The other property `myText` is a `string` that is embedded in to another string as part of the binding. In the first variant this is done via the `template` attribute prefix, but converter functions can also achieve the same effect, as the last two variants demonstrate.

One-way bindings require the `@component` decorator on the custom component class and the `@property` decorator on the component properties.
