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

### config.type

A [type](./@property.md#configtype) may be given to enforce type checks in JavaScript.

### config.typeGuard

A [type guard](./@property.md#configtypeguard) may be given to perform value checks.

### config.default

The [default](./@property.md#configdefault) value of the property.

### config.nullable

Whether or not the value is  [nullable](./@property.md#confignullable). Is `true` by default.

### config.equals

How the property determines whether a new value [equals](./@property.md#configequals) the current one.

### config.convert

Lets the property [convert](./@property.md#configconvert) the incoming value to the expected type.

### Properties eligible for bindings

Any *component property* can be used for two-way bindings, unless it's explicitly implemented with a setter and getter, or with `Object.defineProperty`. These are not supported. The target property needs to generate change events for the two-way binding to work. This is already the case for all built-in properties of Tabris.js widgets.

> See example apps ["bind-two-way-change-events"](../../examples/bind-two-way-change-events) (TypeScript) and ["bind-two-way-change-events-jsx"](../../examples/bind-two-way-change-events-jsx) (JavaScript/JSX).

If the target widget itself is a custom component the recommended way to implement change events is using [`@property`](./@property.md). Note that there is no need to [explicitly create an event API](./@event.md#event), `@bind` can 'talk' directly to `@property`. However, an explicit implementation is also possible.

## Edge Cases

As with one-way bindings, setting the *component property* to `undefined` resets the *target property* to its initial value from when the binding was first established. The component property will also adopt that value, so both stay in syc.

If the *component property* converts or ignores the incoming value of the *target property*, the target property will follow and also bet set to the new component property value.

If a *target property* converts or ignores the incoming value of the *component property*, the component property will ignore that and keep its own value. The two properties are out-of-sync in this case.

If either property throws when set, the error will be propagated to the caller that originally caused the value change. In this case the two properties *may* end up out-of-sync.
