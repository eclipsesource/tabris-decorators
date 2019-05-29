---
---
# @bind

> :point_right: Make sure to first read the introduction to [decorators](./index.md).

This decorator creates two-way bindings within a custom component. Changes to the decorated *component property* are reflected on the *target property* of a *target element* (child) and the other way around. Change events are fired for the decorated *component property* if (and only if) the *target element* fires change events.

`@bind` can by applied to any property of a class decorated with [`@component`](./@component.md). It also implies [`@property`](./@property.md) and includes its [typeGuard](./@property.md) feature. Only one of the two can be applied to the same property.

`@bind` requires exactly one parameter:

## @bind(options)

Where `options` is of the type
```ts
{
  path: "#<targetElementId>.<targetProperty>",
  typeGuard?: Function
}
```

Binds the decorated *component property* to the property `<targetProperty>` of the *target element* (descendant widget) with an `id` of `<targetElementId>`. The binding is established after `append` is called the first time on the component, there needs to be exactly one descendant widget with the given id, and it has to have a property of the same type.

A [`typeGuard`](./@property.md). may be given to perform value checks.

As with one-way bindings, setting the *component property* to `undefined` resets the *target property* to its initial value.

## @bind(path)

Shorthand for `@bind({path: path})`
