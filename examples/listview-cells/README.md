# Example "listview-cells"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=listview-cells,dev=--dev/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/listview-cells)


## Description
Demonstrates how to define the look of ListView cells with pure JSX syntax.

All ListView instances are provided a static array of 20 items of different types.

The "Simple" `ListView` defines a single `Cell` binding elements to the `MyItem` properties `text` and `color`. This cell is duplicated as often as needed by `ListView` to display all onscreen items.

The "Mixed" `ListView` defines two different cell types for displaying `MyItem` and simple string items.

The "Selection" `ListView` showcases the selection event API in its simplest configuration. By setting `selectable` the ListView will issue `select` events when a cell is tapped.

The "Actions" `ListView` demonstrates how the selection event property `action` can be set to different pre-defined values depending on which child widget of a cell is interacted with.

The "Zebra" `ListView` demonstrates how to change properties of a cell depending on its index. In this example the colors depend on whether the index is even or uneven. The background is changed via a `itemIndex` change  listener and the foreground is changed via a one-way binding with converter.
