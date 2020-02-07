---
---
# Data Binding

## Setup

Tabris provides a [JSX](../JSX.md)/[decorators](http://www.typescriptlang.org/docs/handbook/decorators.html)-based declarative data binding via the `'tabris-decorators'` extension, which has to be installed in addition to the `tabris` module:

```
npm install tabris-decorators
```

 [**This extension works only with TypeScript/JSX projects**](../typescript.md#setup). Mixed projects work as well, but the modules using the extension need to be `.ts` or `.tsx` files. It's strongly recommended to familiarize yourself with the [basic decorators syntax](https://www.typescriptlang.org/docs/handbook/decorators.html#class-decorators) if you aren't already.

## Basic Principles

Data binding in the context of Tabris.js/`tabris-decorators` refers to a set of APIs that assists you in writing [custom UI components](./@component.md) (like forms, lists or custom input elements) that provide a type-safe API that interacts with the internal child elements of the component. This is done either with [one-way bindings](./@component.md#one-way-bindings) in which the value of a component property is applied to a child element, or [two-way bindings](./@bind.md) that synchronizes a component property with a child element property.

A very simple example app using both, one-way and two-way bindings, can be found [here](../../examples/labeled-input).

Bindings can also be established with [properties of non-widget object](./@component.md#binding-to-nested-properties) that are attached to a component. In one-way bindings the values may also be be [converted or transformed](./@component.md#conversion) before they are applied to the child element.

Both flavors of bindings rely on property change events to detect changes in the objects involved. The framework [can assist you with this as well](./@property.md). In case a specific requirement of your component can not be handled via data binding it also provides [easy and safe direct access](./@getbyid.md) to any child element.

## The Decorators

The following data binding related decorators are exported by `tabris-decorators`:
  * [@component](./@component.md) - Class decorators that enables data binding within a custom component.
  * [@property](./@property.md) - Makes any property a valid source of one-way bindings.
  * [@bind](./@bind.md) - Configures a custom component property for two-way bindings.
  * [@bindAll](./@bindAll.md) - Shorthand for `@bind({all})`
  * [@event](./@event.md) - Auto-initializes a [`Listeners`](../api/Listeners.md) properties to create a type-safe (change) event APIs.
  * [@getById](./@getById.md) - Auto-initializes a (usually private) custom component property for direct access to a child element.
