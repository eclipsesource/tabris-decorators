---
---
# Global state and action interfaces

> :point_right: Make sure to first read the [introduction to redux in Tabris](./index.md).

This article explains how to best use redux in Tabris in a type-safe way. It uses a TypeScript technique known as ["declaration merging"](https://www.typescriptlang.org/docs/handbook/declaration-merging.html). If you are using a TypeScript/JavaScript mixed project setup (Tabris JavaScript/JSX template), or your IDE (e.g. Visual Studio Code) "understands" `d.ts` files in plain JavaScript projects it works there as well.

In any existing or new `.ts` or `d.ts` file of your project (for JavaScript `d.ts` only), add the following code:

```ts
declare module 'tabris-decorators' {

  export interface DefaultRootState {
    // add state properties here
  }

  export interface DefaultActions {
    // add action interfaces here
  }

}
```

Ensure this is included in your `tsconfig.json` or `jsconfig.json` as part of the projects sources. Now you can edit the interfaces to provide global type information for the `connect` function. You should also use these interfaces when creating your redux store to ensure it matches what the `connect` function expects. Note that `DefaultActions` is not directly referenced, the `AnyAction` type needs to be used instead (see explanation below).

TypeScript:
```ts
const store = createStore<DefaultRootState, AnyAction, {}, {}>(
  combineReducers<DefaultRootState, AnyAction>({
    // your reducers
  })
);
```

Plain JavaScript:
```js
/**
 * @typedef {import('tabris-decorators').DefaultRootState} DefaultRootState
 * @typedef {import('tabris-decorators').AnyAction} AnyAction
 * @typedef {import('redux').ReducersMapObject<DefaultRootState, AnyAction>} Reducers
 * @type {Reducers}
 */
const reducers = {
  // your reducers
};
const store = createStore(combineReducers(reducers));
```

If all these "typedef" annotations are too much noise for you, can handle them in a `d.ts` file that adds `Reducers` to the global scope as is demonstrated in [this example app](https://github.com/eclipsesource/tabris-decorators/blob/master/examples/connect-js/src/types.d.ts).

## DefaultRootState

This is the interface that describes the `state` value given to the `mapStateToProps` parameter. The [`StateToProps`](./@connect.md#mapstatetoprops) type is derived from this type.

By default `DefaultRootState` is just an empty object, but it can be augmented to contain whatever properties we want. Example:

```ts
declare module 'tabris-decorators' {
  export interface DefaultRootState {
    myString: string;
    myNumber: number;
  }
}
```

Now `mapStateToProps` (when declared as [`StateToProps`](#statetoprops) or inline in `connect`) will allow using accessing these properties on `state`:

```js
connect(
  state => ({
    text: state.myString
  })
)
```

## AnyAction

> :point_right: To extend `AnyAction` you must augment [`DefaultActions`](#defaultactions) as described the section below.

This is a [union](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types) of all known actions. You can use this type to create the store (as seen above) or when defining a reducer.

Each action belonging to the union must have a property `type` (as is declared in the common base type `Action`). The type of this property should be a unique string, which allows to implicitly cast form `AnyAction` to the specific subtype.

For example, one of the actions in `AnyAction` could have the interface `{type: 'TOGGLE_STRING', checked: boolean}`. The following shows how a reducer can then determine that an action is of this exact type:

TypeScript

```ts
function myReducer(state: string, action: AnyAction): string {
  if (action.type === 'TOGGLE_STRING') { // An implicitly cast
    return action.checked ? '...' : '...'; // "checked" is now available
  }
  return state;
}
```

JavaScript:

```js
/**
 * @typedef {import('tabris-decorators').AnyAction} AnyAction
 * @param {string} state
 * @param {AnyAction} action
 * @returns {string}
 */
function myReducer(state, action) {
  if (action.type === 'TOGGLE_STRING') {
    return action.checked ? '...' : '...';
  }
  return state;
}
```

## DefaultActions

This is a helper type from which the [`AnyAction`](#anyaction) and [`DispatchToProps`](./@connect.md#mapdispatchtoprops) types are derived. New actions can be defined by adding them as properties to this interface. All entries must implicitly or explicitly extend the `Action` interface provided by `tabris-decorators`, which is:

```ts
interface Action<T> {
  type: T;
}
```

This add actions `'TOGGLE_STRING'`, `'SET_RANDOM_NUMBER'` to `AnyAction`:

```ts
export interface DefaultActions {

  setRandomNumber: {
    type: 'SET_RANDOM_NUMBER'
  };

  toggleString: {
    type: 'TOGGLE_STRING',
    checked: boolean
  };

}
```

The names of these properties (`setRandomNumber`, `toggleString`) are technically arbitrary, but for readability should corelate to the `type` string (`'SET_RANDOM_NUMBER'`, `'TOGGLE_STRING'`) in some manner. The different action interfaces can be referenced via the [index type](https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types) of `DefaultActions`:

```ts
function handleToggleString(state: string, action: DefaultActions['toggleString']): string {
  // return ...
}
```

If you find this to cumbersome you can declare the actions separately. This example also shows how to extend `Action` explicitly instead of implicitly.

```ts
import {Action} from 'tabris-decorators';

export interface ToggleStringAction extends Action<'TOGGLE_STRING'> {
  checked: boolean;
}

// If the action has no additional properties a type alias is sufficient:
export type SetRandomNumberAction = Action<'SET_RANDOM_NUMBER'>;

declare module 'tabris-decorators' {

  export interface DefaultActions {
    setRandomNumber: SetRandomNumberAction;
    toggleString: ToggleStringAction;
  }

}
```

