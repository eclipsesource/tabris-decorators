---
---
# @bind

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

This decorator creates two-way bindings within a custom component. Changes to the decorated *component property* value are reflected on the *target property* of a *target element* (child) and the other way around.

`@bind` can by applied to any property of a class decorated with [`@component`](./@component.md). It also implies [`@property`](./@property.md) and includes its [typeGuard](./@property.md) feature. Only one of the two can be applied to the same property.

`@bind` has several signatures:

## @bind({path: string, typeGuard?: Function})

Where `path` has the format `'#<targetElementId>.<targetProperty>'`.

Binds the decorated *component property* to the property `<targetProperty>` of the *target element* (descendant widget) with an `id` of `<targetElementId>`. Example:

```ts
@bind({path: '#source.selection'})
myNumber: number = 50;
```

This establishes a two-way binding from the `myNumber` property to the property `selection` of the child with the id `'source'`. The binding is established after `append` is called the first time on the component, there needs to be exactly one descendant widget with the given id, and it has to have a property of the same type.

> See example app ["bind-two-way"](../../examples/bind-two-way).

Change events are fired for the decorated *component property* when the *target element* fires change events.

> See example app ["bind-two-way-change-events"](../../examples/bind-two-way-change-events).

A [`typeGuard`](./@property.md#propertytypeguard) may be given to perform value checks.

As with one-way bindings, setting the *component property* to `undefined` resets the *target property* to its initial value for when the binding was first established.

## @bind(path)

Shorthand for `@bind({path: path})`.

Example:

```ts
@bind('#source.selection')
myNumber: number = 50;
```

## @bind({all: Bindings, typeGuard?: Function})

Where `Bindings` is in the format of:
```
{
  <sourceProperty>: '#<targetElementId>.<targetProperty>'
}
```
Establish a two-way binding between the property `<sourceProperty>` of the *object assigned to the decorated property* and the property `<targetProperty>` of the *target element* (descendant widget) with an `id` of `<targetElementId>`. Multiple bindings may be established this way. Example:

```ts
@bind({all:{
  myText: '#input1.text',
  myNumber: '#input2.selection'
}})
model: Model;
```

This establishes 2 two-way bindings:
* One between the `myText` property of the assigned `Model` object and the property `text` of the child with the id `input1`.
* And one between the `myNumber` property of the assigned `Model` object and the property `selection` of the child with the id `input2`.

> See example app ["bind-two-way-model"](../../examples/bind-two-way-model).

The bindings are first established when `append` is called the first time on the component. Again, the bindings are established after `append` is called the first time on the component, there needs to be exactly one descendant widget with the given id for each binding, and they have to have a property of the same type as the source property.

The `model` property can be set at any time and the bindings will update accordingly. However, the target elements will always stay the same.

See also [`@bindAll`](./@bindAll.md).

### Properties eligible for bindings

Both source and target property need to generate change events for the two-way binding to work. The quickest way to implement this is using [`@property`](./@property.md), which can be used on non-widget classes as well:

```ts
class Model {
  @property myText: string;
  @property myNumber: number;
}
```

Note that there is no need to explicitly create an event API, `@bind` can 'talk' directly to `@property`. However, an explicit implementation is also possible:

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

### Edge Cases

The component property (`model` in the above example) may also be set to `null` (or `undefined`) at any time. In that case all the target properties will be set back to their initial values. The initial value in this case refers to the value a target property had the moment the target element was attached to the component.

When a new two-way binding is established all the target properties will be set to the current value of the their respective source property. There is one exception to this behavior: If the source property is set to `undefined` (but not `null`) at that moment it will be assigned the current value of the target property. If a source property is set to `undefined` later both properties are set to the initial value of the target property.

If a source property converts or ignores the incoming value of the target property, the target property will follow and change again to contain the new source property value.

If a target property converts or ignores the incoming value of a source property, the source property will ignore that and keep its own value. The two properties are out-of-sync in this case.

If either property throws, the error will be propagated to the caller that originally caused the value change. In this case the two properties *may* end up out-of-sync.
