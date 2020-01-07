# Example "bind-two-way-change-events"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=bind-two-way-change-events,dev=--dev/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/bind-two-way-change-events)

## Description

Demonstrates that two-way bindings created via the `@bind` decorator trigger property change events on the component instance. This app creates an instance of the included `ExampleComponent` class (grey background), which has properties that can be changed by interacting with the component. The current value of the properties are displayed below the component.

The `ExampleComponent` property `myNumber` is bound to the `selection` property of a `Slider` with the id `source1`. Moving the slider changes the value of `myNumber` and notifies change listeners registered via `onMyNumberChanged`. In `app.tsx` this is used to update the value of the progress bar below the component.

The other property `myText` is bound to the `text` property of a `TextInput` with the id `source2`. Editing the text changes the value of `myText` and notifies change listeners registered via `onMyTextChanged`. In `app.tsx` this is used to update the value of the text view below the component.

Two-way bindings also require the `@component` decorator on the custom component class.
