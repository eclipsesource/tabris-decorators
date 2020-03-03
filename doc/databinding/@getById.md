---
---
# @getById

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

## @getById (no parameter)

Makes the decorated property return a component-internal child (direct or indirect) element whose id is identical to the property name. This is useful if direct access to an internal widget is needed, e.g. to trigger an animation.

> For simplicities sake the examples below append only a single child element, in which case there would be various simpler ways to obtain the reference. `@getById` is more useful when a larger widget tree is appended.

 TypeScript:

```tsx
@component
class MyComponent extends Composite {

  @getById readonly button1: Button;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties)._append(<Button id='button1'/>);
  }

  async fadeOut() {
    await this.button1.animate({opacity: 0}, {duration: 100});
  }

}
```

The equivalent code using the `_find` method would be:

```tsx
@component
class MyComponent extends Composite {

  readonly button1: Button;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties)._append(<Button id='button1'/>);
    this.button1 = this._find('#button1').only(Button);
  }

  async fadeOut() {
    await this.button1.animate({opacity: 0}, {duration: 100});
  }

}
```

> Note that the `find` method (no underscore) would not work since `@component` does not allow selecting children via public selector API.

`@getById` also works in JavaScript, though the widget type is not checked in this case:

```jsx
@component
class MyComponent extends Composite {

  /** @type {Button} */
  @getById readonly button1;

  // ...
}
```

### Behavior Details

For `@getById` the following rules apply:

 * It only works on classes decorated with `@component`.
 * It is read-only at runtime. Attempts to set the property fill fail silently.
 * It will search for a matching descendant widget exactly once, after `append` is called the first time on the widget instance.
 * If accessed before children have been appended it will throw an error.
 * It will always return the same descendant, even if it is disposed or removed.
 * It will throw if there is no match, more than one, or if the type is not correct.

## @getById(typeGuard)

Where `typeGuard` is of the type `value: any => boolean`.

Like `@getById`, but uses the given type guard function to check the found widget.

In TypeScript this allows widgets with a compatible API to be resolved as another type.

In JavaScript, this can be used to ensure the selected widget has the intended type.
