# Example "listview-cells-js"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=listview-cells-js/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/listview-cells-js)

## Description

Note: This is the plain JavaScript variant of the [listview-cells-jsx](../listview-cells-jsx) JSX example. Since ListView is optimized for use with JSX some features are currently not supported. Cells must be created with `createCell` just as in `CollectionView`, and the `Cell` properties `itemType`, `itemCheck` and `selectable` are not supported. Mixed cell-types can not be done in any reasonable way, but item selection works via the `ListView.select` helper function.

Demonstrates how to define the look and behavior of ListView cells with widget factories.

All ListView instances are provided a static array of 20 items of different types. Cells are defined via anonymous functional components, i.e. the `createCell` callback. They are self-updating by using the `apply` method.

The "Simple" `ListView` creates a `Cell` binding elements to the `MyItem` properties `text` and `color`.

The "Selection" `ListView` showcases the selection event API in its simplest configuration. By setting `ListView.select` as a listener for the `tap` event the ListView will issue `select` events when a cell is tapped.

The "Actions" `ListView` demonstrates how the selection event property `action` can be set to different pre-defined values depending on which child widget of a cell is interacted with.

The "Zebra" `ListView` demonstrates how to change properties of a cell depending on its index. In this example the colors depend on whether the index is even or uneven. The background is changed via a `itemIndex` change  listener and the foreground is changed via a one-way binding with converter.
