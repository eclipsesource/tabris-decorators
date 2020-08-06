---
---
# StateProvider

> :point_right: Make sure to first read the [introduction to redux in Tabris](./index.md).

This class defines the interface that [`connect`](./@connect.md) looks for in the global [`injector`](../di/Injector.md) instance. It provides a subset of the [redux store API](https://redux.js.org/api/store). This article describes the technical details of `StateProvider`, but to use it properly you really just need to know [how to use it to register the redux store](#registration).

## Type Parameters

The `StateProvider` class is a generic class with two type parameters, `State` and `Action`, just as the redux store. Therefore:

```js
import {Store, createStore} from 'redux';
import {StateProvider} from 'tabris-decorators';

// Declare MyState and MyAction types...

let store: Store<MyState, MyAction>; // = createStore<MyState, MyAction>(...)
let stateProvider: StateProvider<MyState, MyAction> = store; // OK
```

The `State` may be any type, but `Action` must implement an object with an `type` property: `{type: any}`.

**If no type parameters are given they default to the `DefaultRootState` and `AnyAction` interfaces, respectively. This is useful for [module augmentation](./types.md).**

## constructor

The constructor takes a single object that may implement all or part of the `StateProvider` interface. That could be a redux store, any object literal with the below methods, or - technically - another instance of `StateProvider`:

```ts
const stateProvider = new StateProvider<State, MyAction>({getState, subscribe, dispatch});
```

## Methods

### getState()

Returns the state that will be given to the `mapStateToProps` function in [`connect`](./@connect.md). The state is defined by the type parameter [`State`](#typeparameters).

### dispatch(action)

Returns the function that will be given to the `mapDispatchToProps` function in [`connect`](./@connect.md). The type of `action` is defined by the type parameter [`Action`](#typeparameters).

### subscribe(cb)

This is the function that [`connect`](./@connect.md) uses to get notified about state changes. The `cb` parameter is a callback function that needs to be invoked whenever `getState()` does provide a new return value.

## Registration

Before any connected component can be created, an `StateProvider` has to be registered for dependency injection. The shortest way to do this, is to use the [`register`](../di/Injector.md#registertargettypevalue) function. Since a redux store fulfills the `StateProvider` interface it can be used in place of a `StateProvider` instance.

```js
import {createStore} from 'redux';
import {contentView} from 'tabris';
import {register, StateProvider} from 'tabris-decorators';
import {SomeConnectedComponent} from './SomeConnectedComponent';

// create a redux store
const store = createStore(reducer);

// register it
register(StateProvider, store);

// now we can create instances of components that use connect
contentView.append(new SomeConnectedComponent());
```

An alternative TypeScript-only method to register the store would be to wrap the redux store in `StateProvider` and register it via [`@share`](../di/injector.md#share):

```ts
@shared
class MyStateProvider extends StateProvider<MyState, MyAction> {
  constructor() {
    super(createStore(reducer));
  }
}
```

## Standalone usage

On a technical level `StateProvider` is not dependent on redux. As such you may use it in any way to enable [`connect`](./@connect.md) to function. To implement a custom `StateProvider` do this (**TypeScript**):

```ts
@shared
class MyStateProvider extends StateProvider<MyState, MyAction> {
  constructor() {
    super({});
  }
  getState(): MyState {
    //return ...;
  }
  subscribe(cb: () => any) {
    // handle subscribers
  }
  dispatch = (action: MyAction) => { //
    // handle actions
    return action;
  };
}
```

Or, in **JavaScript**, this:

```js
class MyStateProvider extends StateProvider {
  constructor() {
    super({
      /** @returns {MyState} */
      getState() {
        //return ...;
      },
      subscribe(cb) {
        // handle subscribers
      },
      /** @param {MyAction} action */
      dispatch(action) {
        // handle actions
        return action;
      }
    });
  }
}

register(MyStateProvider, new MyStateProvider());
```

It's also possible to only override `dispatch` or only `getState` and `subscribe`. In that case [`connect`](./@connect.md) can only be used with `mapStateToProps` or `mapDispatchToProps`, respectively.
