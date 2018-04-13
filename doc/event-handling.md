# Event Handling

The `@event` decorator together with the `Listeners` class provides an extended event handling API that sits on top of the one built into Tabris.js. This API is optimized for TypeScript and works, for example, very well with an MVP pattern and dependency injection.

More specifically it...

* Improves type safety
* Is useable even in classes that don't extend `Widget`
* Can be [combined with `@property`](./data-binding.md) to auto-generate change events
* Simplifies adding custom events to your own UI component
* Simplifies defining custom events on interfaces and abstract classes
* Provides methods designed for use with promises and `async`/`await`

## @event

Apply this to a property of the type `Listeners` (or `ChangeListeners`) to define a custom event for this class. The name of the property __must__ start with 'on', e.g. 'onMyEvent'. The decorator can be used in abstract classes, but not interfaces. However, interfaces can define a property that is then implemented with `@event`.

`Listeners` is generic with one optional type parameter that defines the data available on the `EventObject` instance given to the listeners, _in addition to `target`, `type` and `timeStamp`_.

`ChangeListeners` is generic with two optional parameter that define the types of `value` and `target` on the `EventObject` instance.

When used on a widget the `Listeners` instance will be integrated in the existing event system. Events triggered via one API will also be issued via the other.

Here are some examples declarations. Detailed explanations are given below in "Listeners Interface".

```ts
class SomeClass extends SomeOtherClass {
  @event public readonly onMyEvent: Listeners; // issues plain EventObject instances
  @event public readonly onFoo: Listeners<{foo: string}>; // EventObject with additional event data
  @event public readonly onCustomEvent1: Listeners<EventObject<this>>; // Sets type of `event.target` to `PlainClass`
  @event public readonly onCustomEvent2: Listeners<{target?: PlainClass}>; // almost the same, but more convenient to trigger
  @property public selection: number; // will (due to the naming) trigger the event below:
  @event public readonly onSelectionChanged: ChangeListeners<number>;
  @event public readonly onResize: Listeners<WidgetResizeEvent>; // On a widget this would delegate to the existing resize event
}
```

## Listeners Interface

The `Listeners` interface, usually created by `@event`, is a function to register listeners and also doubles as an object that offers API to trigger events, de-register listeners and more.

```ts
let target = new PlainClass();
target.onMyEvent(() => console.log('myEvent fired'));
target.onMyEvent.trigger(); // -> "myEvent fired"

```

All methods on the `Listeners` instance are permanently bound to that instance. They can therefore be assigned to local variables without issues:

```ts
let triggerMyEvent = target.onMyEvent.trigger;
triggerMyEvent();

```

### listeners.addListener(listener: Function)

Registers a listener to be notified by new events. Each listener can only be added once.

Same as calling `listeners` as a function. Therefore this...

```ts
myComponent.onSelectionChanged.addListener(myListener)
```
...does the same as...
```ts
myComponent.onSelectionChanged(myListener)
```
...and on a widget also the same as...
```ts
myComponent.on('selectionChanged', myListener);
```
...or this...
```tsx
<MyComponent onSelectionChanged={myListener} />;
```

(For the JSX syntax you need to set [jsxProperties](https://tabrisjs.com/documentation/latest/lang.html#jsx) accordingly.)

The listener will _always_ receive an instance of `EventObject` with `target`, `type` and `timeStamp`, as well as additional fields depending on the generic parameter of `Listeners`. _That is true even when `trigger` is not called with an `EventObject` instance._

### listeners.removeListener(listener: Function)

De-registers a listener, no matter how it was registered.

On widgets this is the same as calling `widget.off('eventType', listener)`

### listeners.once(listener: Function)

Notifies the given listener the next time an event is issued, but not afterwards.

On widgets this is the same as calling `widget.once('eventType', listener)`

### listeners.trigger(eventData: object)

Issues an event to all listeners. The type of `eventData` is `T` of `Listeners<T>` and `{}` for `Listeners`. In the latter case the parameter can be omitted: `listener.trigger()` is the same as `listener.trigger({})`.

If `eventData` is an uninitialized (newly constructed) instance of `EventObject`, that object will be initialized and passed directly to the listeners. On widgets this is the same as calling `widget.trigger('eventType', eventObject)`

If `eventData` is an initialized (i.e. previously dispatched) instance of `EventObject` (or a class extending it), an new instance of `EventObject` will be created and the _enumerable own properties_ of `eventData` copied to that instance. <b>The listeners will therefore not receive the _same_ object but a _shallow copy_.</b>

### listeners.resolve()

Returns a promise that resolves the next time an event is issued, with the event object as the resolved value. Example:

```ts
let selection = await myComponent.onSelection.resolve();
await new MyCustomDialog().onContinue.resolve();
```

### listeners.resolve(value: any)

Returns a promise that resolves the next time an event is issued, with the given value passed through. Example:

```ts
let foo = await myComponent.onSelection.resolve('foo');
console.log(foo); // "foo"
```

This can be useful to use with `Promise.race`:

```ts
public async confirm() {
  return Promise.race<boolean>([
    this.view.onCancel.resolve(false),
    this.view.onContinue.resolve(true)
  ]);
}
```

### listeners.reject(value?: any)

Returns a promise that rejects ("throws" when using `async`) the next time an event is issued. The "thrown" value will always be an instance of `Error`, depending on the type of `value`.

| type of `value`                   | type of error                             |
|-----------------------------------|-------------------------------------------|
| undefined (no value given)        | `Error` & `EventObject` (with event data) |
| `Error` or `Error` subclass       | `Error` or `Error` subclass               |
| Constructor extending `Error`     | instance of given constructor*            |
| any other                         | `Error` with `message` set to `value`**   |

\* The constructor gets the event object passed as the first parameter

\*\* The value will be stringified since `message` has to be a string

This is also useful with `Promise.race`:

```ts
private async enterPassword() {
  let ev = await Promise.race([
    this.view.onAcceptPassword.resolve(),
    this.view.onCancel.reject(UserAbortError)
  ]);
  return ev.text;
}
```

## Interfaces

In addition to `Listeners<T extends object = {}>` there are a few additional interfaces exported that may come in handy:

* `type ChangeListeners<Value, Target = {}> = Listeners<ChangeEvent<Value, Target>>;`
* * To be used as an alternative to `Listeners` for change events. First generic type describes the value that changes, the second - if given - the type of the target field. Can be used like `ChangeListeners<boolean, this>`.
* `type ChangeEvent<Value, Target = {}> = PropertyChangeEvent<Target, Value>;`
* * Shorthand for the change event interface exported by the tabris module. It allows to omit the target type.
* `CustomEvent<CustomData, Target = {}> = EventObject<Target> & CustomData;`
* * Shorthand for extending `EventObject`.
* `type Listener<T = {}> = (ev: CustomEvent<T>) => any;`
* * Can be used to define a listener method, e.g. `private handleFoo: Listener<CustomData> = ev => {...};`
* `type ChangeListener<Value, Target = {}> = Listener<ChangeEvent<Value, Target>>;`
* * Same, just for change events.