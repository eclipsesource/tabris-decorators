---
---
# @event

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

Apply this decorators to a property of the type `Listeners` (or `ChangeListeners`) to define a custom event for this class without explicitly creating a `Listeners` instance. The instance will instead be created lazily. The property becomes effectively read-only, but does not have to be marked with `readonly` (though it can be). The name of the property __must__ start with 'on', e.g. `'onMyEvent'`. The decorator can be used in abstract classes, but not interfaces. However, interfaces can define a property that is then implemented with `@event`.

`Listeners` is generic with one type parameter `EventData` that defines the event object interface. It needs at least a `target` property whose type should must match the type of the decorated class. The `type` and `timeStamp` event properties are added implicitly:

```ts
class SomeClass extends SomeOtherClass {
  // Provides plain EventObject instances:
  @event onMyEvent: Listeners<{target: SomeClass}>;
  // EventObject with additional event data:
  @event onFoo: Listeners<{<target: SomeClass, foo: string}>;
}
```

`ChangeListeners` is generic with two parameter. The first is `Target` and must match the decorated class. The second is `Property` and must be the name (a string) of the property that changes:

```ts
class SomeClass extends SomeOtherClass {
  @event onSelectionChanged: ChangeListeners<SomeClass, 'selection'>;
  @property selection: number; // will (due to the naming) fire 'selectionChanged'
}
```
