# Example "bind-two-way-convert"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-two-way/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-two-way)

## Description

Demonstrates the use of the `@bind` decorator to create two-way bindings with a value conversion. This is a rare scenario, but the syntax also works for one-way bindings, i.e. `>> TextInput.text` or `<< TextInput.text`.

This app creates an instance of the included `ExampleComponent` class (grey background), which has a  property `myText` that is bound to the `text` property of a `TextInput`. A string set on `myText` will be converted to upper case before it's applied to the `TextInput`. Manually editing the `TextInput` text will convert it to lower case and apply that  to `myText`.

This app exemplifies an **edge case** where a two-way converter is applied differently depending on which end of the binding a change occurs. Specifically, the `ExampleComponent` side is considered dominant: If a mixed-case text is set on `myText` programmatically - in this app by pushing the button at the bottom - it will keep this exact value not matter what. The converter is only used to convert the new value to upper case to apply it to `TextInput`, but the process stops there. There is no "ping pong" game where the value is converted back and forth between `myText` and the `TextInput`.

 If on the other hand text is entered by the user in to the `TextInput` a different logic applies: First the value will be converted to all lower case when applied to `myText`. But since the value of `myText` is supposed to dictate the state of the `TextInput`, the change of `myText` causes the binding to update the `text` value of `TextInput` again using the converter in the other direction. As a result the text in `TextInput` always ends up all upper case.

Two-way bindings also require the `@component` decorator on the custom component class.
