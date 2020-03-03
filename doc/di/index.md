---
---
# Dependency Injection

A complete example Tabris.js application that uses data dependency injection can be found [here](https://github.com/eclipsesource/tabris-js-reddit-viewer).

## Introduction

Tabris provides a [decorators](http://www.typescriptlang.org/docs/handbook/decorators.html)-based [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection)  via the `'tabris-decorators'` extension, which has to be installed in addition to the `tabris` module:

```
npm install tabris-decorators
```

 [**This extension works only with TypeScript/JSX projects**](../typescript.md#setup). Mixed projects work as well, but the modules using the extension need to be `.ts` or `.tsx` files. It's strongly recommended to familiarize yourself with the [basic decorators syntax](https://www.typescriptlang.org/docs/handbook/decorators.html#class-decorators) if you aren't already.

## Basic Principles

The core idea behind dependency injection is that any object (the "client") that needs to interact with another object (the "service") should not be responsible for the creation or management of that other object. Instead it is "injected" by a third party. For Tabris.js this "third party" can be the  [`Injector`](./Injector.md) provided by `tabris-decorators`.

Most of the time there is no need to interact with the injector directly. Instead, decorators can be used to both [register classes](./@injectable.md) for injection and to [inject them](./@inject.md) via a constructor parameter. However, the initial object of any dependency tree (usually something that kickstarts the application) always needs to be created [explicitly](./Injector.md#createtype-parameters).


The Tabris dependency injection service is integrated with the [JSX API](../JSX.md). Any class (usually custom UI components) that is instantiated vis JSX will have its [registered dependencies](./@inject.md) resolved [automatically with no additional code](./@inject.md#jsx).

## The Decorators

The following data binding related decorators are exported by `tabris-decorators`:
  * [@inject](./@inject.md)
  * [@injectable](./@injectable.md)
  * [@shared](./@shared.md)
  * [@injectionHandler](./@injectionHandler.md)
