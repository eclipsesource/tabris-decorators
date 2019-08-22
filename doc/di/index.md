---
---
# Dependency Injection

## Introduction

Tabris provides a [decorators](http://www.typescriptlang.org/docs/handbook/decorators.html)-based [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection)  via the `'tabris-decorators'` extension, which is a separate module from `'tabris'`. **This extension works only with TypeScript projects**. Mixed projects work as well, but the modules using the extension need to be `.ts` or `.tsx` files. When generating a Tabris.js TypeScript project using the [Tabris CLI](https://www.npmjs.com/package/tabris-cli) `init` command an example app may be chosen that already has `'tabris-decorators'` installed. For manual installation follow the steps below.

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

The core idea behind dependency injection is that any object (the "client") that needs to interact with another object (the "service") should not be responsible for the creation or management of that other object. Instead it is "injected" by a third party. For Tabris.js this "third party" can be the  [`Injector`](./Injector.md) provided by `tabris-decorators`.

Most of the time there is no need to interact with the injector directly. Instead, decorators can be used to both [register classes](./@injectable.md) for injection and to [inject them](./@inject.md) via a constructor parameter. However, the initial object of any dependency tree (usually something that kickstarts the application) always needs to be created [explicitly](./Injector.md#createtypeparameters).


The Tabris dependency injection service is integrated with the [JSX API](../JSX.md). Any class (usually custom UI components) that is instantiated vis JSX will have its [registered dependencies](./@inject.md) resolved [automatically with no additional code](./@inject.md#JSX).

## The Decorators

The following data binding related decorators are exported by `tabris-decorators`:
  * [@inject](./@inject.md)
  * [@injectable](./@injectable.md)
  * [@shared](./@shared.md)
  * [@injectionHandler](./@injectionHandler.md)
