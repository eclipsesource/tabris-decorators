# Example "bind-two-way"

Demonstrates the use of the `@bind` decorator to create two-way bindings between a custom component instance and its children. This app creates an instance of the included `ExampleComponent` class (grey background), which has properties that can be changed by interacting with the component. Below the component is a button to change the property values of that instance, and another one to print them on screen.

The `ExampleComponent` property `myNumber` is bound the `selection` property of a `Slider` with the id `source1`. Moving the slider changes the value of `myNumber`, as can be seen by pressing the "print current values" button. If `myNumber` is changed from outside the component - e.g. by pressing "change values", the slider position is updated accordingly.

The other property `myText` is bound the `text` property of a `TextInput` with the id `source2`. Editing the text changes the value of `myText`, as can be seen by pressing the "print current values" button. If `myText` is changed from outside the component - e.g. by pressing "change values", the `TextInput` text is updated accordingly.

Two-way bindings also require the `@component` decorator on the custom component class.
