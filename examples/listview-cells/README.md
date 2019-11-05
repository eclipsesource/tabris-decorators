# Example "listview-cells"

Demonstrates how to define the look of ListView cells with pure JSX syntax.

All ListView instances are provided a static array of 20 items of different types.

The "Simple" `ListView` defines a single `Cell` binding elements to the `MyItem` properties `text` and `color`. This cell is duplicated as often as needed by `ListView` to display all onscreen items.

The "Mixed" `ListView` defines two different cell types for displaying `MyItem` and simple string items.

The "Selection" `ListView` showcases the selection event API in its simplest configuration. By setting `selectable` the ListView will issue `select` events when a cell is tapped.

The "Actions" `ListView` demonstrates how the selection event property `action` can be set to different pre-defined values depending on which child widget of a cell is interacted with.
