---
---
# @connect

> :point_right: Make sure to first read the [introduction to redux in tabris](./index.md).

The `tabris-decorators` module exports `connect`, which can be used both as a decorator or as a conventional function. It takes up to two parameters, `mapStateToProps` and `mapDispatchToProps`, where either can be `null`/`undefined`. The return value can then be used to connect a custom component or functional component to the globally registered [`StateProvider`](./StateProvider.md), typically the [redux store](https://redux.js.org/api/createstore):

```js
connect(mapStateToProps, mapDispatchToProps)(Original)
connect(mapStateToProps)(Original)
connect(null, mapDispatchToProps)(Original)
```

Where `Original` is a widget or widget factory, and the return value is the same widget or widget factory, except hardwired to the store. Note that the `connect` function does not change `Original`. Instead it returns a wrapper of `Original` with all the same API and features. Therefore the same widget can be connected multiple times to the store in different constellations.

In **TypeScript** the `connect` function should be given a generic type parameter that identifies the widget created by `Original`:

```js
connect<Original>(mapStateToProps, mapDispatchToProps)(Original)
```

This allows the IDE to provide type checks and autocompletion for `mapStateToProps` and `mapDispatchToProps`.

## mapStateToProps

A function that maps the state returned by the store to the properties of the component to connect:

`state => properties`

The **TypeScript** type of this function is `StateToProps<Component>`, exported by `tabris-decorators`.

Example: If the state object of your store has a `myString` property, and the widget you want to connect has a `text` property, then `mapStateToProps` may look like this:


```js
const stateToProps = state => ({
  text: state.myString
});
```

Only properties that actually exist on the connected widget may be given in the returned properties object. A special case is `apply`, which will be discussed in the section [Usage with functional components](#usage-with-functional-components).

If `mapStateToProps` is not defined "inline" (as part of the `connect` call), it is desirable to give it a type. Depending you your project settings it may be required.

This is how you do this in **TypeScript**:

```ts
import {StateToProps} from 'tabris-decorators';

const mapStateToProps: StateToProps<ExampleComponent> =
  state => ({
    text: state.myString
  });
```

Visual Studio Code supports TypeScript types within JsDoc, so you can also do this in **JavaScript**:

```js
/** @type {import('tabris-decorators').StateToProps<ExampleComponent>} */
const mapStateToProps = state => ({
  text: state.myString
});
```

## mapDispatchToProps

A function that maps the actions accepted by the store to callbacks or events of the component/widget.

`dispatch => actionMapper`

Where `dispatch` is the store method of the same name, and `actionMapper` is an object containing callbacks that invoke `dispatch`. The **TypeScript** type of this function is `DispatchToProps<Component>`, exported by `tabris-decorators`.

Example: If one of the available store actions looks like this:

```
{
  type: 'TOGGLE_STRING',
  checked: boolean
}
```

And your component has a `handleToggle` callback property that takes a single boolean parameter like this:

```
component.handleToggle = checked => doSomething(checked);
```

Then `mapDispatchToProps` may look like this:
```js
const mapDispatchToProps = dispatch => {
  handleToggle: checked => dispatch({type: 'TOGGLE_STRING', checked})
};
```

A more general solution would be to use an equivalent event instead. Your component could implement a `onToggle` event like this:

**TypeScript**:

```ts
class ExampleComponent extends Composite {
  @event onToggle: Listeners<{target: ExampleComponent, checked: boolean}>;
}
```

**JavaScript** (JsDoc optional):

```js
constructor(props) {
  /** @type {tabris.Listeners<{target: ExampleComponent, checked: boolean}>} */
  this.onToggle = new Listeners(this, 'toggle');
}
```

Then `mapDispatchToProps` may look like this:

```js
const mapDispatchToProps = dispatch => {
  onToggle: ({checked}) => dispatch({type: 'TOGGLE_STRING', checked})
};
```

Only callback properties or events that are actually declared on the connected widget (via a decorator, setter, or property set in the constructor) may be given. A special case is `apply`, which will be discussed in the section [Usage with functional components](#usage-with-functional-components).

If `mapDispatchToProps` is not defined "inline" (as part of the `connect` call), it is desirable to give it a type to get autocompletion in your IDE. Depending you your project settings it may be required.

This is how you do this in **TypeScript**:

```ts
import {DispatchToProps} from 'tabris-decorators';

const mapDispatchToProps: DispatchToProps<ExampleComponent> =
  // ...
```

In Visual Studio Code you can also do this in **JavaScript** via JsDoc:

```js
/** @type {import('tabris-decorators').DispatchToProps<ExampleComponent>} */
const mapDispatchToProps =
  // ...
```

## Usage with built-in widgets

Any core widget of Tabris.js can be connected directly if its visuals and API are sufficient for your use case:

```js
export const ConnectedButton = connect(
  state => ({text: 'Some text: ' + state.myString}),
  dispatch => ({onSelect: () => dispatch({type: 'TOGGLE_STRING'})})
)(Button);
```

It can then be used like the `Button` constructor:

```jsx
// with "new"
parent.append(
  new ConnectedButton({textColor: 'blue'})
);
// or as a factory
parent.append(
  ConnectedButton({textColor: 'blue'})
);
// or JSX
parent.append(
  <ConnectedButton textColor='blue'/>
);
```

## Usage with custom components

A custom component (user-defined subclass of `Composite`) should be used with `connect` mainly for complex UIs that need their own custom state, behavior and/or API in addition to what is handled by the redux store. It may also be appropriate for any UI that exceeds a certain level of complexity and/or extends `Page` or `Tab`. Note that any internal state that is not synced with the store will not be restored if the store is initialized with [persisted state](https://redux.js.org/recipes/structuring-reducers/initializing-state).

### As a decorator

If the TypeScript compiler is used (in any **TypeScript/TSX** or **JavaScript/JSX** project setup) then `connect` can be used as a decorator:

```ts
@component
@connect<ExampleComponent>(
  state => ({
    text: state.myString
  }),
  dispatch => ({
    onToggle: ev => dispatch({type: 'TOGGLE_STRING', checked: ev.checked})
  })
)
export class ExampleComponent extends Composite {

  @prop text: string;
  @event onToggle: Listeners<{target: ExampleComponent, checked: boolean}>;

  // Implementation...

}
```

The order of `@component` and `@connect` is not relevant. With this syntax `ExampleComponent` itself is modified and can *not* be given to `connect` again. If you want to be able to connect the same component to the store in different ways, you need to use `connect` as a function:

### As a function

This is the necessary approach for plain JavaScript, when the component is not always connected in the same way, or if you do not want to use the decorator syntax.

First define the component class (potentially in another module), then `mapDispatchToProps` and `mapDispatchToProps`, and then pass all of it to `connect` on export.

For plain **JavaScript**:

```js
exports.ExampleComponent = connect(stateToProps, dispatchToProps)(ExampleComponent);
```

When `asFactory` is applied that needs to be done before `connect`.

```js
const connector = connect(stateToProps, dispatchToProps);
exports.ExampleComponent = connector(asFactory(ExampleComponent));
```

When using the ES6 module syntax, the component needs to have a different local name than the export.

```js
export const ExampleComponent = connect(stateToProps, dispatchToProps)(ExampleComponentBase);
```

In **TypeScript** a namespace could be used:

```js
namespace internal {

  @component
  export class ExampleComponent extends Composite {
    // ...
  }

}

export const ExampleComponent = connect(stateToProps, dispatchToProps)(internal.ExampleComponent);
export type ExampleComponent = internal.ExampleComponent;
```

## Usage with functional components

A functional component (user-defined widget factory) may be less code than a fully fledged custom component and is a natural fit for the redux pattern.

### Styled Component

A simple functional component may take an "attributes" object (containing properties and listeners) and return a pre-configured widget. In this example a button is given a default `font`, gets it's `text` from the store state and dispatches actions via `onSelect`:

**TypeScript/JSX**:
```tsx
export const ConnectedButton = connect(
  state => ({text: 'Some text: ' + state.myString}),
  dispatch => ({onSelect: () => dispatch({type: 'TOGGLE_STRING'})})
)(
  (attributes: Attributes<Button>) =>
    <Button font='12px serif' {...attributes}/>
);
```

**JavaScript/JSX**:
```tsx
export const ConnectedButton = connect(
  state => ({text: 'Some text: ' + state.myString}),
  dispatch => ({onSelect: () => dispatch({type: 'TOGGLE_STRING'})})
)(
  /** @param {tabris.Attributes<tabris.Button>} attributes */
  attributes => <Button font='12px serif' {...attributes}/>
);

```

Plain **JavaScript**:
```js
export const ConnectedButton = connect(
  state => ({text: 'Some text: ' + state.myString}),
  dispatch => ({onSelect: () => dispatch({type: 'TOGGLE_STRING'})})
)(
  /** @param {tabris.Attributes<tabris.Button>} attributes */
  attributes => Button({font: '12px serif', ...attributes})
);
```

Of course `mapDispatchToProps`, `mapDispatchToProps` (targeting a `Button` instance) and the actual factory function can also be defined independently and put together in a separate line:

```js
// const mapStateToProps: StateToProps<Button> = ....
// const mapDispatchToProps: DispatchToProps<Button> = ....
const CustomButton = (attributes: Attributes<Button>) => <Button font='12px serif' {...attributes}/>;
const ConnectedButton = connect(stateToProps, dispatchToProps)(CustomButton);
```

### Composed Functional Component

A functional component may also return composite with children. For this scenario both `mapStateToProps` and `mapDispatchToProps` support a special pseudo-property `apply`. The object given to this property will be treated as a ruleset for the [`apply`](../api/Composite.md#applyrules) method. It is thereby possible to connect child elements to the store via their given id. It can also be combined by any additional properties applied to the returned widget itself.

This example behaves the same as the previous one, only that the button is wrapped in a composite. The [`Set`](../api/utils.md#settarget-attributes) helper function provided by the `tabris` module is used to improve provide type safety. However, it could also be omitted.

**TypeScript**, all in one expression:

```tsx
export const ConnectedButton = connect(
  state => ({
    apply: {
      '#mybutton': Set(Button, {text: 'Some text: ' + state.myString})
    }
  }),
  dispatch => ({
    apply: {
      '#mybutton': Set(Button, {onSelect: () => dispatch({type: 'TOGGLE_STRING'})})
    }
  })
)(
  (attributes: Attributes<Composite>) =>
    <Composite padding={12} {...attributes}>
      <Button id='mybutton' font='12px serif'/>
    </Composite>
);
```

Plain **JavaScript**, separate expressions:

```js
/** @type {import('tabris-decorators').StateToProps<tabris.Composite>} */
const stateToProps = state => ({
  apply: {
    '#mybutton': Set(Button, {text: 'Some text: ' + state.myString})
  }
});

/** @type {import('tabris-decorators').DispatchToProps<tabris.Composite>} */
const dispatchToProps = dispatch => ({
  apply: {
    '#mybutton': Set(Button, {onSelect: () => dispatch({type: 'TOGGLE_STRING'})})
  }
});

/** @param {tabris.Attributes<tabris.Composite>} attr */
const CustomButton = attr => Composite({padding: 12, ...attr, children: [
  Button({id: 'mybutton', font: '12px serif'})
]});

exports.FunctionalComponent = connect(stateToProps, dispatchToProps)(CustomButton);
```
