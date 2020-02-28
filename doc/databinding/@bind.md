---
---
# @bind

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

This decorator creates two-way bindings within a custom component. Changes to the decorated *component property* value are reflected on the *target property* of a *target element* (child) and the other way around.

`@bind` can be applied only to properties of a class decorated with [`@component`](./@component.md). It behaves like [`@property`](./@property.md) in most regards and also supports its [`typeGuard`](./@property.md#configtypeguard) and [`type`](./@property.md#configtype) options. Only one of the two decorators can be applied to the same property.

## bind(path)

Where `path` is a string in the format `'#<targetElementId>.<targetProperty>'`.

> This a shorthand for [`@bind({path: string})`](#config.path). It can be used for simple two-way bindings if no `typeGuard` or `type` option is needed.

> See example apps ["bind-two-way"](../../examples/bind-two-way) (TypeScript) and ["bind-two-way-jsx"](../../examples/bind-two-way-jsx) (JavaScript/JSX).

Binds the decorated *component property* to the property `<targetProperty>` of the *target element* (a direct or indirect child element of the component) with an `id` of `<targetElementId>`.

The example below establishes a two-way binding from the `myNumber` property to the property `selection` of the child with the id `'source'`. The binding is established after `append` is called the first time on the component. At that time there needs to be exactly one descendant widget with the given id, and it has to have a property of the same type.

TypeScript example:

```ts
@component
class MyComponent extends Composite {

  @bind('#source.selection')
  myNumber: number = 50;


  constructor(properties: Properties<MyComponent>) {
    super();
    this.set(properties);
    this.append(
      <Slider id='source'/>
    );
  }

}
```

In JavaScript the only difference is how - if at all - the decorated property is typed. In JavaScript JSDoc comments may be used, but this is optional. This is true for all examples below, so only the TypeScript variant will be given.

```js
/** @type {number} */
@bind('#source.selection')
myNumber;
```

Change events are fired for the decorated *component property* when the *target element* fires change events.

> See example apps ["bind-two-way-change-events"](../../examples/bind-two-way-change-events) (TypeScript) and ["bind-two-way-change-events-jsx"](../../examples/bind-two-way-change-events-jsx) (JavaScript/JSX).

As with one-way bindings, setting the *component property* to `undefined` resets the *target property* to its initial value for when the binding was first established.

## @bind(config)

Like [`@bind(path)`](#bindpath) or [`@bindAll(bindings)`](./@bindAll.md), but allows to give additional options as supported by [`@property`](./@property.md).

The `config` object has the following options:

### config.path

Where `path` is a string in the format `'#<targetElementId>.<targetProperty>'`.

Example:

```ts
@bind({path: '#source.selection'})
myNumber: number = 50;
```

For details see [`@bind(path)`](#bindpath) above.

### config.all

Where `all` is a plain object in the format of:

```
{
  <sourceProperty>: '#<targetElementId>.<targetProperty>'
}
```

Example:

```ts
@bind({all:{
  myText: '#input1.text',
  myNumber: '#input2.selection'
}})
model: Model;
```

For details see [`@bindAll`](./@bindAll.md).

### config.typeGuard

A [`typeGuard`](./@property.md#configtypeguard) may be given to perform value checks.

### config.type

A [`type`](./@property.md#configtype) may be given to enforce type checks in JavaScript.

