---
---
# @inject

> :point_right: Make sure to first read the [introduction to dependency injection](./index.md).

`@inject` together with `@injectable` allow for simple [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) ("DI").

## @inject (no parameter)

Decorate a constructor parameter to inject a value based on the type of the parameter, e.g.:

```ts
import {inject, create} from 'tabris-decorators';
import {ClassB} from './ClassB';

export class ClassA {

  constructor(@inject b: ClassB) {
    ...
  }

}
```

`ClassB` has to to have a registered _injection handler_, which can be achieved using [`@injectable`](./@injectable), [`@shared`](./@shared), [`@injectionHandler`](./@injectionHandler), or by using the [`Injector class`](./Injector.md) method "`addHandler`". To create instances of `ClassA` you must use the `create` method which handles the injections:

```ts
import {create} from 'tabris-decorators';
import {classA} from './ClassA';

const a = create(ClassA);
```

If `ClassA` itself is injected somewhere the injections are taken care of by `@inject`. The decorator can also be used on a property, **but in this case the class *must* also be decorated with `@injectable` or `@shared`**:

```ts
import {inject, injectable} from 'tabris-decorators';
import {ClassB} from './ClassB';

@injectable
export class ClassA {

  @inject b: ClassB;

}
```

The type of the injection - i.e. the type of the parameter decorated with `@inject` - has to be a class. Interfaces and [advanced types](http://www.typescriptlang.org/docs/handbook/advanced-types.html) are not supported. However, abstract classes and [classes merged with interfaces](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) work. Since classes [can be used like interfaces](https://www.typescriptlang.org/docs/handbook/classes.html#using-a-class-as-an-interface) most traditional dependency injection patterns can still be used.

### JSX

Widgets (custom components) may also use `@inject`. If they are used as a JSX element all injections are automatically resolved using the global [injector](./Injector.md). However, **the first constructor parameter can then not be used for injection** since this is where the properties object is passed to by the JSX processor.

## @inject(param)

Where `param` can be any object, string, number or boolean.

Like `@inject`, but allows to pass on a value to the injection handler. For further information see [`@injectable`](./@injectable) and [`@injectionHandler`](./@injectionHandler).

```ts
class Foo {

  constructor(@inject('some value') a: ClassA) {
    ...
  }

}
```
