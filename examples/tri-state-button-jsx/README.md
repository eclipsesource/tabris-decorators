# Example "tri-state-button-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=tri-state-button-jsx/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/tri-state-button-jsx)

## Description

Note: This is a JavaScript/JSX variant of the [tri-state-button](../tri-state-button) TypeScript/JSX example.

Demonstrates how to create type-safe one-way and two-way bindings with between two custom components, `TriStateButton` and `Survey`. The former component consists of a (emoji) icon and label. When tapped it cycles through three different states as indicated by the icon.

This component is then used in the `Survey` component to give the user three yes/no questions with a third option to remain neutral. The answers are available on public properties of `Survey` via two-way bindings. In `app.jsx` they are read when the "print results" button is pressed.

The state value can be either a `boolean` or the string `'neutral'`, while the `font` and `textColor` properties can be of various types that represent colors/fonts. Such "mixed" types can only be checked by the `@property` and `@bind` decorators by using type guards. For one-way bindings these type guards are required only on the target property, but two-way bindings need both ends to use them.

When using the `@property` decorator the type guard can be given as the sole parameter, as can be seen in the `TriStateButton` where the `isState` type guard function is implemented and applied in this line:

```js
@property(isState) state = false;
```

The `textColor` and `font` properties can use the type guards for their respective types provided by the `'tabris'` module:

```ts
@property(Color.isColorValue) textColor = 'black';
```

A property with `@bind` needs to provide a parameter object with a `typeGuard` entry, as seen in the `Survey` component:

```ts
@bind({path: '#pizza.state', typeGuard: isState})
pizza;
```

If a property is implemented with explicit setter and getter the type guard must be called explicitly in the setter. However, this is not enforced. Here is how an explicit setter for the `TriStateButton` property `textColor` would look like:

```js
  set textColor(value) {
    if (!Color.isColorValue(value)) {
      throw new Error('Invalid value ' + value);
    }
    this._find(TextView).last(TextView).textColor = value;
  }
```

One-way and two-way bindings require the `@component` decorator on the custom component class.
