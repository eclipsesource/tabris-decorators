# Example "itempicker-js"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=itempicker-js/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/itempicker-js)

## Description

Note: This is the plain JavaScript variant of the [itempicker-jsx](../itempicker) JavaScript/JSX example.

Demonstrates different approaches to feed the `ItemPicker` with items, provide texts to represent them, and handle selections.

All `ItemPicker` instances are provided 3 items each. They can be selected by the user which displays a unique item id below.

In the first example the items are given as an array of strings. In this scenario the items do not need to converted further. However, the selection can only be handled via theses strings (as demonstrated by setting `selection` to `'Peter'`) or their index (see selection handler), which is not the most convenient (or type-safe) approach.

In the second example items are plain objects, though they are to match the interface of the `Item` class above. As these are now objects we can provide a unique id for each that can be used in the selection. To get the text from the item the `textSource` attribute is used. It's assigned the name of the property that contains the text. This could also be a deeper path (e.g. `'propA.propB'`) or include a converter (`{path: 'prop', converter: value => 'Value: ' + value }`).

The third example uses instances of the `Item` class via a `List` object assigned to the `items` attribute. Using the `List` instead of an array is beneficial since changes to `List` instances are automatically detected and represented in the UI. The transformation to the actual displayed text it managed by the `toString` method override in `Item`.
