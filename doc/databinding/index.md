---
---
# Data Binding

## Introduction

Tabris provides a [JSX](../JSX.md)/[decorators](http://www.typescriptlang.org/docs/handbook/decorators.html)-based declarative data binding via the `'tabris-decorators'` extension, which is a separate module from `'tabris'`. **This extension works only with TypeScript/JSX projects**. Mixed projects work as well, but the modules using the extension need to be `.ts` or `.tsx` files. When generating a Tabris.js TypeScript project using the [Tabris CLI](https://www.npmjs.com/package/tabris-cli) `init` command an example app may be chosen that already has `'tabris-decorators'` installed. For manual installation follow the steps below.

## Setup

To install the `tabris-decorators` module itself type the following in your existing TypeScript-based (i.e. [tsc-compiled](../runtime.md#compiledjavascriptprojects)) project:

`npm install tabris-decorators`.

Check your `tsconfig.json` to ensure the compiler options `experimentalDecorators`, `emitDecoratorMetadata`, `jsx` and `jsxFactory` options are set as below:

```js
{
  "compilerOptions": {
    "module": "commonjs",
    /* your other options... */
    "jsx": "react",
    "jsxFactory": "JSX.createElement",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
  "include": [
    "./src/**/*.ts",
    "./src/**/*.tsx"
  ]
}
```

You can now start using `tabris-decorators` in your project. It's recommended to familiarize yourself with the basic [TypeScript decorators syntax](https://www.typescriptlang.org/docs/handbook/decorators.html#class-decorators) if you aren't already.

## Basic Principles

Data binding in the context of Tabris.js/`tabris-decorators` refers to a set of APIs that assists you in writing [custom UI components](./@component.md) (like forms, lists or custom input elements) that provide a type-safe public API that interacts with the internal child elements of the component. This is done either with [one-way bindings](./@component.md#onewaybindings) in which the value of a component property is applied to a child element, or [two-way bindings](./@bind.md) that synchronizes a component property with a child element property.

Bindings can also be established with [properties of non-widget object](./@component.md#bindingtonestedproperties) that are attached to a component. In one-way bindings the values may also be be [converted or transformed](./@component.md#conversion) before they are applied to the child element.

Both flavor of bindings rely on property change events to detect changes in the objects involved. The framework [can assist you with this as well](./@property.md). In case a specific requirement of your component can not be handled via data binding it also provides [easy and safe direct access](./@getbyid.md) to any child element.

## The Decorators

The following data binding related decorators are exported by `tabris-decorators`:
  * [@component](./@component.md) - Class decorators that enables data binding within a custom component.
  * [@property](./@property.md) - Makes any property a valid source of one-way bindings.
  * [@bind](./@bind.md) - Configures a custom component property for two-way bindings.
  * [@event](./@event.md) - Auto-initializes a [`Listeners`](../api/Listeners.md) properties to create a type-safe (change) event APIs.
  * [@getById](./@getById.md) - Auto-initializes a (usually private) custom component property for direct access to a child element.