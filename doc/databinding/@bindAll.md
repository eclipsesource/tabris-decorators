---
---
# @bindAll

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

This decorator creates two-way or one-way bindings within a custom component. Changes to the decorated *component property value* (must be a mutable object) are reflected on the *target property* of a *target element* (child) and the other way around.

`@bindAll` can by applied only to properties of a class decorated with [`@component`](./@component.md). It behaves like [`@property`](./@property.md) in most regards. Only one of the two decorators can be applied to the same property.

## @bindAll(bindings)

Where `bindings` is a plain object in the format of:

```
{
  <sourceProperty>: '<direction?><SelectorString>.<targetProperty>'
}
```

> :point_right: This a shorthand for [`@bind({all: bindings})`](./@bind.md#configall). It can be used for object-to-widget bindings if no additional `@bind` options are needed.

> :point_right: See example apps ["bind-two-way-model"](../../examples/bind-two-way-model) (TypeScript) and ["bind-two-way-model-jsx"](../../examples/bind-two-way-model-jsx) (JavaScript/JSX).

Declares a binding between the property `<sourceProperty>` of the *source object* (the object assigned to the decorated property) and the property `<targetProperty>` of the *target element* (a direct or indirect child element of the component) matching the selector string. This means the properties will be kept in sync as long as the source object is assigned to the component property. The `bindings` object may define one binding per source property. Valid selector strings may be id selectors (`#myid`), type selectors (`TextInput`) or `:host`, but not class selectors.

The optional `direction` may be either `>>` for a one-way binding that copies the *source object property* to the *target element*, or `<<` for the reverse. Of omitted, a two-way binding is created. The direction may be separated from the selector with a space, e.g. `>> #id.prop`.

The example below establishes 2 two-way bindings:
* One between the `myText` property of the assigned `Model` object and the property `text` of a child (e.g. a `TextInput`) with the id `input1`.
* And one between the `myNumber` property of the assigned `Model` object and the property `selection` of a child (e.g. a `Slider`) with the id `input2`.

TypeScript:

```ts
@component
class MyComponent extends Composite {

  @bindAll({
    myText: '#input1.text',
    myNumber: '#input2.selection'
  })
  model: Model;

  // ... constructor that creates input1 and input2 ...

}
```

In JavaScript the only difference is how - if at all - the decorated property is typed. In JavaScript JSDoc comments may be used, but this is optional. This is true for all examples below, so only the TypeScript variant will be given.

```ts
/** @type {Model} */
@bindAll({
  myText: '#input1.text',
  myNumber: '#input2.selection'
})
model;
```

The bindings are established after `append` is called the first time on the component. At that time there needs to be exactly one descendant widget with the given id for each binding, and they have to have a property of the same type as the source property. It is okay for the component property to be `null` at that time. The object in the `model` property can also be replaced with another one at any time and the bindings will update accordingly.

### Properties eligible for bindings

Both source and target property need to generate change events for the two-way binding to work. The recommended way to implement this is using [`@property`](./@property.md):

```ts
class Model {
  @property myText: string;
  @property myNumber: number;
}
```

Note that there is no need to [explicitly create an event API](./@event.md#event), `@bind` can 'talk' directly to `@property`. However, an explicit implementation is also possible:

```ts
class Model {

  @event onMyTextChanged: ChangeListeners<Model, 'myText'>;
  private _myText: string;

  set myText(value: string) {
    if (this._myText !== value) {
      this._myText = value;
      this.onMyTextChanged.trigger({value});
    }
  }

  get myText() {
    return this._myText;
  }

}
```

### Value conversion

The value of the source object property may be converted before it is applied to the target element property and vice versa. To do so [the `to` helper function](./@component.md#conversion) may be used to give both a path string and a value converter function:

```ts
@bindAll({
  sourceProperty: to('<direction?><SelectorString>.<targetProperty>', converter)
})
model: Model;
```

Alternatively you may give an object literal with `path` and `converter`:

```ts
@bindAll({
  sourceProperty: {path: '<direction?><SelectorString>.<targetProperty>', converter}
})
model: Model;
```

For one-way bindings (direction being `<<` or `>>`) conversion is very straight-forward: The function is given the value to convert and returns the converted one. This example converts a string given by the model to upper case letters:

```ts
@bindAll({
  sourceProperty: to('>> #myTextView.text', (value: string) => value.toUpperCase())
})
model: Model;
```

For two-way bindings a second parameter is given to the converter function to indicate in which direction the conversion is currently applied. See [`Conversion`](./Conversion.md).

### Multiple Binding Targets

One source property can have multiple targets. This is achieved by giving an array of paths instead of a single string:

```
{
  <sourceProperty>: string[]
}
```

For example:

```ts
@bindAll({
  myNumber: ['Slider.selection', '>> #num.text']
})
model: Model;
```

Of course you can also use this with converters:

```ts
@bindAll({
  myNumber: [
    'Slider.selection',
    {path: '>> #num.text', converter: value => 'Number is ' + value}
  ]
})
model: Model;
```

One thing to keep in mind: A single source property can only receive values from one of the targets. In other words, all paths except one must use the `>>` direction prefix:


```ts
@bindAll({
  myNumber: ['Slider.selection', '#num.text'] // ERROR
})
model: Model;
```

### Edge Cases

The component property (`model` in the above example) may also be set to `null` (or `undefined`) at any time. In two-way and `model >> child` one-way bindings the target properties of the child elements will then be set back to their initial values. The initial value in this case refers to the value a target property had the moment the target element was attached to the component. The source properties on the former source object will retain their latest value.

When a new two-way or `model >> child` binding is established (when `append` is called or the component property is assigned a new source object) all the target properties will be set to the current value of the their respective source property.

There are two exceptions to this behavior: If the source property is set to `undefined` (but not `null`) at the moment the binding is established it will be assigned the current value of the target property. Likewise, if a source property is set to `undefined` after the two-way binding has been established, both properties will be set to the initial value of the target property.

In `model << child` bindings the model property receiving the data will always be set to the value of the child property sending the data, whether it previously was `undefined` or some other value.

If in a two-way binding a source (model) property converts or ignores the incoming value of the target property, the target property will follow and also bet set to the new source property value. If a target property converts or ignores the incoming value of a source property, the source property will ignore that and keep its own value. The two properties are out-of-sync in this case. If either property throws when set, the error will be propagated to the caller that originally caused the value change. In this case the two properties *may* end up out-of-sync.

Scenario | Binding Direction | Source (Model) Property | Target (Child) Property
-|-|-|-
The component property is assigned a model object. | two-way | unchanged | set to bound source property value
"| `>>` | unchanged | set to bound source property value
"| `<<` | set to bound child property | unchanged
The source (current model object) property is assigned `undefined`, or is already `undefined` when binding is established. | two-way | set to bound child property value | unchanged
"| `>>` | `undefined` | initial value
"| `<<` | set to bound child property value | unchanged
Component property is assigned `null` (or `undefined`). | two-way | unchanged | set back to its initial value
"| `>>` | unchanged | set back to its initial value
"| `<<` | unchanged | unchanged
