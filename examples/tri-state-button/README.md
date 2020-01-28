# Example "tri-state-button"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=tri-state-button/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/tri-state-button)

## Description

Demonstrates the use of one-way and two-way bindings with [advanced types](https://www.typescriptlang.org/docs/handbook/advanced-types.html). It includes two example components, `TriStateButton` and `Survey`. The former component consists of a (emoji) icon and label. When tapped it cycles through three different states as indicated by the icon.

This component is then used in the `Survey` component to give the user three yes/no questions with a third option to remain neutral. The answers are available on public properties of `Survey` via two-way bindings. In `app.tsx` they are read when the "print results" button is pressed.

The "advanced types" used in these components are the `State` union type (consisting of `boolean` and the value string `'neutral'`, defined in the `TriStateButton` module), as well as `ColorValue` and `FontValue` (unions of various types, provided by the `'tabris'` module). The data binding mechanism in `tabris-decorators` performs type checks each time a value in a binding is updated. In case of primitive types (such as `string`) and class types (such as `Date`) this works out of the box. Mixed[1] unions, intersection and interface types do require explicit type guards provided by the application code, otherwise the binding fails with an error.

For one-way bindings these type guards are required only on the target property, but two-way bindings need both ends to use them.

When using the `@property` decorator the type guard can be given as the sole parameter, as can be seen in the `TriStateButton` where the `isState` type guard function is implemented and applied in this line:

```ts
@property(isState) public state: State = false;
```

The `textColor` and `font` properties can use the type guards for their respective types provided by the `'tabris'` module:

```ts
@property(Color.isColorValue) public textColor: ColorValue = 'black';
```

A property with `@bind` needs to provide a parameter object with a `typeGuard` entry, as seen in the `Survey` component:

```ts
@bind({path: '#pizza.state', typeGuard: isState})
public pizza: State;
```

If a property is implemented with explicit setter and getter the type guard must be called explicitly in the setter. However, this is not enforced. Here is how an explicit setter for the `TriStateButton` property `textColor` would look like:

```ts
  public set textColor(value: ColorValue) {
    if (!Color.isColorValue(value)) {
      throw new Error('Invalid value ' + value);
    }
    this._find(TextView).last(TextView).textColor = value;
  }
```

One-way and two-way bindings require the `@component` decorator on the custom component class.

[1] "Mixed" meaning that a union consists of different types, not just different values of the same type. Such non-"mixed" unions, like enums, can be used for data binding without type guards, but the automatic checks only ensure that the primitive type matches. For example, if `State` was defined as `'checked' | 'crossed' | 'neutral'` - which is arguably more sensible than mixing boolean and string - the type guard would not be enforced. It would however (incorrectly) allow binding a `string` property to a `State` property. In this specific case a type guard should be provided even though it is not enforced.
