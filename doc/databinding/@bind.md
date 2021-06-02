---
---
# @bind

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

This decorator creates two-way or one-way bindings within a custom component. Changes to the decorated *component property* value are reflected on the *target property* of a *target element* (child) and the other way around.

`@bind` can be applied only to properties of a class decorated with [`@component`](./@component.md). It behaves like [`@property`](./@property.md) in most regards and also supports its [`typeGuard`](./@property.md#configtypeguard) and [`type`](./@property.md#configtype) options. Only one of the two decorators can be applied to the same property.

## @bind(path)

Where `path` is a string in the format `'<direction?><SelectorString>.<targetProperty>'`.

> :point_right: This a shorthand for [`@bind({path: string})`](#configpath). It can be used for bindings if no other options need to be set.

> :point_right: See example apps ["bind-two-way"](../../examples/bind-two-way) (TypeScript) and ["bind-two-way-jsx"](../../examples/bind-two-way-jsx) (JavaScript/JSX).

Binds the decorated *component property* to the property `<targetProperty>` of the *target element* (a direct or indirect child element of the component) matching the selector String. Only id (starting with `#`) or type selectors (starting with an upper case letter) can be used, but not class selectors (starting with `.`). In addition the pseudo-selector `:host` can be used to select the component itself. The optional `direction` may be either `>>` for a one-way binding that copies the *component property* to the *target element*, or `<<` for the reverse. Of omitted, a two-way binding is created. The direction may be separated from the selector with a space, e.g. `>> #id.prop`.

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

## @bind(path, converter)

Where `path` is [a string in the format](#bindpath) `'<direction?><SelectorString>.<targetProperty>'` and `converter` is a function of the `BindingConverter` type.

> :point_right: See example app ["bind-two-way-convert"](../../examples/bind-two-way-convert).

> :point_right: This a shorthand for [`@bind({path: string, convert: {binding: converter}})`](#configconvert). It can be used for bindings if no other options needs to be set.

The binding `converter` function is used to convert values when the property is synchronized with the property given by [`path`](#configpath) in either direction. **This is distinct from the [property converter function](./@property.md#configconvert).**

See also option [config.convert](#configconvert) and class "[`Conversion`](./Conversion.md)".

## @bind(config)

Like [`@bind(path)`](#bindpath) or [`@bindAll(bindings)`](./@bindAll.md), but allows to give additional options as supported by [`@property`](./@property.md).

The `config` object has the following options:

### config.path

Where `path` is a string in the format `'<direction?><SelectorString>.<targetProperty>'`.

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

Given a function (or `'auto'`) this can [convert](./@property.md#configconvert) values received by this property to the expected type.

May also be an object with one or two entries:

```ts
{
  property?: Converter<T>,
  binding?: BindingConverter<any>
}
```

A function given to `convert` or `convert.property` is the same [convert](./@property.md#configconvert) function that `@property` accepts. These three are equivalent:

```ts
@bind({path})
@property({convert: myConverter}})
myPropertyA;

@bind({path, convert: myConverter})
myPropertyB;

@bind({path, {convert: {property: myConverter}}})
myPropertyC;
```

The `BindingConverter` given to `convert.binding` is a one or two-way converter function that is used to convert values when the property is synchronized with the property given by [`path`](#configpath) in either direction. See [@bind(path, converter)](#bindpathconverter) for details.

#### Difference between property converter and binding converter

Given the following decorated property:

```ts
@bind({
  path: '#foo.text',
  convert: {
    property: propConverter,
    binding: bindingConverter
  }
})
public bar;
```

Setting it a value `a`:

```ts
component.bar = a;
const b = component.bar;
```

Will convert `a` twice, once before it's applied to `bar` (also returned to `b`) and once before it's applied to `#foo.text`:

```
     |--component-----------------------------------------------------|
     |                                                                |
     |                                                |-Child-----|   |
a -> | propConverter -> "bar" <--bindingConverter --> | #foo.text |   |
b <- |  <----(getter)----/                            |-----------|   |
     |                                                                |
     |----------------------------------------------------------------|
```

### Properties eligible for bindings

Any *component property* can be used for two-way bindings, but the target (child widget) property needs to generate change events for the two-way binding to work. This is already the case for all built-in properties of Tabris.js widgets.

> See example apps ["bind-two-way-change-events"](../../examples/bind-two-way-change-events) (TypeScript) and ["bind-two-way-change-events-jsx"](../../examples/bind-two-way-change-events-jsx) (JavaScript/JSX).

If the target widget itself is a custom component the recommended way to implement change events is using [`@property`](./@property.md). Note that there is no need to [explicitly create an event API](./@event.md#event), `@bind` can 'talk' directly to `@property`. However, an explicit implementation is also possible.

## Edge Cases

In a two-way binding setting the *component property* to `undefined` resets the *target property* to its initial value from when the binding was first established. The component property will also adopt that value, so both stay in sync.

If the *component property* converts or ignores the incoming value of the *target property*, the target property will follow and also bet set to the new component property value.

If a *target property* converts or ignores the incoming value of the *component property*, the component property will ignore that and keep its own value. The two properties are out-of-sync in this case.

If either property throws when set, the error will be propagated to the caller that originally caused the value change. In this case the two properties *may* end up out-of-sync.
