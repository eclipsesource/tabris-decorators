---
---
# Decorators

## Basics

Decorators are a [future EcmaScript feature](https://github.com/tc39/proposal-decorators) that is already [available in TypeScript](http://www.typescriptlang.org/docs/handbook/decorators.html).

Decorators are technically functions that modify an existing class or it's members. They are called by prefixing them with `@`:

```ts
import {myDecorators, anotherDecorators} from 'example';

@myDecorators
class Foo {
  @anotherDecorator public bar: string;
}
```

## tabris-decorators

Tabris-specific decorators are provided in the optional `'tabris-decorators'` extension, which is a separate module from `'tabris'`.

> :point_right: **This extension is TypeScript-only. It will not work in JavaScript/JSX files.**

It includes the following decorators:

* Related to data binding and custom component development:
  * [@component](./@component.md)
  * [@property](./@property.md)
  * [@event](./@event.md)
  * [@bind](./@bind.md)
  * [@getById](./@getbyId.md)
* Related to [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection):
  * [@inject](./@inject.md)
  * [@injectable](./@injectable.md)
  * [@shared](./@shared.md)
  * [@injectionHandler](./@injectionHandler.md)

### Setup

When generating a Tabris.js TypeScript project using the [Tabris CLI](https://www.npmjs.com/package/tabris-cli) `init` command an example app may be chosen that already has `'tabris-decorators'` installed. The steps below are for manual installation only.

Install the `tabris-decorators` module itself:

`npm install tabris-decorators`.

Edit your `tsconfig.json` to enable the compiler options `experimentalDecorators` and `emitDecoratorMetadata`. Also ensure the `jsx` and `jsxFactory` options are correctly set:

```json
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

After this you're good to go.