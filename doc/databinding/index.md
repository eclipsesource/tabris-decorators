---
---
# Data Binding

A complete example Tabris.js application that uses data binding comprehensively can be found [here]([here](https://github.com/eclipsesource/tabris-js-reddit-viewer).

## Setup

Tabris provides [JSX](../declarative-ui.md)/[decorators](http://www.typescriptlang.org/docs/handbook/decorators.html)-based declarative data binding via the `'tabris-decorators'` extension, which has to be installed in addition to the `tabris` module:

```
npm install tabris-decorators
```

 [This extension is optimized for TypeScript/JSX projects](../typescript.md#setup), but JavaScript projects work as well as long is they use the TypeScript compiler to provide JSX and decorators support. It's strongly recommended to familiarize yourself with the [basic decorators syntax](https://www.typescriptlang.org/docs/handbook/decorators.html#class-decorators) if you haven't already.

## Basic Principles

Data binding in the context of Tabris.js/`tabris-decorators` refers to a set of APIs that assists you in writing [custom UI components](./@component.md) like forms, lists or custom input elements. They provide a declarative syntax to synchronize data between the component and its internal child widgets. This is done either with [one-way bindings](./@component.md#one-way-bindings) in which a value derived from a component property is applied to a child element, or [two-way bindings](./@bind.md) that also do the reverse.

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

## Type Safety

The data binding API can not provide compile-time type safety since it is based on ids and unchecked JSX attributes. However the framework will check at runtime whether the syntax is valid and points to existing elements and properties. If this is not the case an exception will be thrown when the bindings are established.

The framework also attempts to check if the properties in a binding are type-safe. If they are not, an "Unsafe binding" warning will be logged. This behavior can also be changed so that unsafe binding cause exceptions instead. To do so, simply add this code *before instantiating any widgets*:

```js
import {injector} from 'tabris-decorators';

injector.jsxProcessor.unsafeBindings = 'error';
```

In TypeScript (`.ts`, `.tsx`) files, unsafe bindings only occur in certain edge-cases, assuming the `emitDecoratorMetadata` compiler option is enabled. In JavaScript they will be more common, especially in two-way bindings.

To make an unsafe binding type-safe, additional type information need to be provided to the [@property](./@property.md) and [@bind](./@bind.md) decorators. This may either be a [type guard](./@property.md#configtypeguard), or - in JavaScript - a the [`type`](./@property.md#configtype) option.
