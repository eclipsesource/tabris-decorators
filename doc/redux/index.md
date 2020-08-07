---
---
# Redux for Tabris

Redux is a small JavaScript library that provides ["a predictable state container for JavaScript apps."](https://Redux.js.org/introduction/getting-started). Its [central data store](https://redux.js.org/glossary#store) is easily persisted, inspected or rolled back. If used consistently a complete Tabris UI can be deterministically derived from the [state](https://redux.js.org/glossary#state) of this store. That makes it easy to implement undo-redo and restore your complete app state after a restart, which is user-friendly and very helpful during development.

In addition the Redux store is also a central event bus on which views (Tabris widgets/custom components) can dispatch ["actions"](https://redux.js.org/glossary#action) that are then handled by ["reducers"](https://redux.js.org/glossary#reducer) that modify the store state, building a [predictable closed data loop](https://redux.js.org/basics/data-flow). Since the UI part of this loop can easily be emulated by dispatching actions manually and inspecting the resulting state, Redux-based Tabris apps are very suitable for unit tests.

While Redux is framework-agnostic, `tabris-decorators` provides API that is specifically designed for Redux-Tabris integration. However, there is no hard dependency to the Redux library, and technically this API [can be used without Redux](./StateProvider.md#standalone-usage).

**From this point on this articles assumes you are familiar with the basics of Redux application development and concentrates on the integration with Tabris only. If this is your first contact with Redux we strongly recommend you read their ["Essentials"](https://Redux.js.org/tutorials/essentials/part-1-overview-concepts) articles and the ["Basic Tutorial"](https://redux.js.org/basics/basic-tutorial).**

## Examples

The following example projects demonstrating the technical aspects of Tabris-Redux integration:

* [Example "connect"](https://github.com/eclipsesource/tabris-decorators/blob/master/examples/connect) (TypeScript/JSX based)
* [Example "connect-jsx"](https://github.com/eclipsesource/tabris-decorators/blob/master/examples/connect-jsx) (JavaScript/JSX based)
* [Example "connect-js"](https://github.com/eclipsesource/tabris-decorators/blob/master/examples/connect-js) (plain JavaScript, no compiler)

You may use these as a template for your project, or just to experiment with the API. Many snippets in this documentation are taken from these projects with little-to-no modification.

## Application Setup

Create a new Tabris app with whatever setup you are comfortable with. You can use Redux with Tabris apps based on TypeScript/JSX, JavaScript apps using JSX syntax (via the TypeScript compiler), and plain JavaScript apps using no compiler whatsoever (and therefore `require` instead of ES6 module syntax). This documentation will provide code snippets for all three wherever they differ significantly. TypeScript examples are usually provided first, and JavaScript examples may use TypeScript types within JsDoc annotations. These are supported by Visual Studio Code, but you may omit them if you are using another IDE or don't care about strong type safety.

If your template did not install `tabris-decorators` for you, you'll have to do it with `npm install tabris-decorators`. Tabris-Redux integration centers around the [`connect`](./@connect.md) function, which [is a decorator](./@connect.md#as-a-decorator). But it can also be used as [a conventional function](./@connect.md#as-a-function) in plain JavaScript.

Now to install the redux module type "`npm install redux`". The Redux module contains TypeScript declarations, so no further "@types" module needs to be installed for TypeScript support.

You may also install whatever [Redux middleware](https://redux.js.org/advanced/next-steps#configure-a-store) you prefer, though none is strictly needed.

Note: The Redux DevTools are not supported by Tabris as of version 3.6. We aim to support them as soon as possible.

## Create the Redux store

Since your application needs to create and register the Redux store before you can build up any UI using it, this should happen as early as possible in your main "app" `.tsx`/`.ts`/`.jsx`/`.js` module.

In this example the root state will consist of a string and a number:

```ts
{
  myString: string;
  myNumber: number;
}
```

And two actions to modify them.

A very simple action without payload.
```ts
{
  type: 'SET_RANDOM_NUMBER'
}
```

And one with payload:
```ts
{
  type: 'TOGGLE_STRING',
  checked: boolean
}
```

In TypeScript or for a type-safe JavaScript app you should first [declare your global state and actions](./types.md) via module augmentation.

Now you can create the store with Redux's [`createStore`](https://redux.js.org/api/createstore) and [`combineReducers`]https://redux.js.org/api/combinereducers functions. The only part specific to Tabris.js is the usage of the `DefaultRootState` and `AnyAction` types provided by `tabris-decorators` module.

**TypeScript**:
```ts
const store = createStore<DefaultRootState, AnyAction, {}, {}>(
  combineReducers<DefaultRootState, AnyAction>({
    myNumber(state, action) {
      if (action.type === 'SET_RANDOM_NUMBER') {
        return Math.round(Math.random() * 100);
      }
      return state || 0;
    },
    myString(state, action) {
      if (action.type === 'TOGGLE_STRING') {
        return action.checked ? 'Another Hello World' : 'Hello World';
      }
      return state || 'Hello World';
    }
  })
);
```

**JavaScript**:
```js
const store = createStore(
  combineReducers({
    myNumber(state, action) {
      if (action.type === 'SET_RANDOM_NUMBER') {
        return Math.round(Math.random() * 100);
      }
      return state || 0;
    },
    myString(state, action) {
      if (action.type === 'TOGGLE_STRING') {
        return action.checked ? 'Another Hello World' : 'Hello World';
      }
      return state || 'Hello World';
    }
  })
);
```

Now you only need to [register the store](./StateProvider.md#registration):

```js
register(StateProvider, store);
```

## Connect a component to the store

You can integrate *any* Tabris component with Redux so that it is updated whenever the store state changes in any way, and dispatches actions whenever the component triggers an event. This is done by passing an existing component class/factory to the [`connect`](./@connect.md) function/decorator, resulting in a *new* component that is *automatically* connected to the store on creation. The code that creates the component instance (by constructor call, direct call, or JSX) does *not* have to do anything to facilitate this, the component is inherently hardwired to the store.

> :point_right: This is just a summary. For details read the [main article on @connect](./@connect.md) and [the API reference of @component](../databinding/@component.md).

To connect a component to the store you need to define [`mapStateToProps`](./@connect.md#mapstatetoprops) and [`mapDispatchToProps`](./@connect.md#mapdispatchtoprops) functions. These  are mapping the state of the store to properties of the component, and event (or callbacks) for the component to actions. You can declare them first as local variables and pass them to `connect`, or directly inline when connect is invoked.

Here is what they look like in general, type-safe examples can be found [here](./@connect.md#mapstatetoprops).
```js
const stateToProps = state => ({
  prop: state.prop
});

const dispatchToProps = dispatch => ({
  onSomeEvent: ev => dispatch({type: 'SOME_ACTION'})
});
```

Now there are two ways to invoke `connect`:

As a decorators directly [on the component class](./@connect.md#as-a-decorator):

**TypeScript**:
```ts
@component
@connect<ExampleComponent>(mapStateToProps, mapDispatchToProps)
export class ExampleComponent extends Composite {
  // ...
}
```

**JavaScript**, if your setup supports decorators:
```ts
@component
@connect(mapStateToProps, mapDispatchToProps)
export class ExampleComponent extends Composite {
  // ...
}
```

Or as a function to pass the component through. Unlike the decorator syntax this also works in plain JavaScript and with functional components.

**TypeScript** and **JavaScript/JSX**, [custom component](./@connect.md#as-a-function):
```ts
@component
class BaseComponent extends Composite {
  // ...
}

export const ExampleComponent = connect(stateToProps, dispatchToProps)(BaseComponent);
export type ExampleComponent = BaseComponent; // TypeScript only
```

Plain **JavaScript**, custom component:
```js
class ExampleComponent extends Composite {
  // ...
}

exports.ExampleComponent = connect(mapStateToProps, mapDispatchToProps)(ExampleComponent));
```

**TypeScript**, [functional component](./@connect.md#usage-with-functional-components):
```ts
export const FunctionalComponent = connect(stateToProps, dispatchToProps)(
  (attributes: Attributes<Composite>) =>
    <Composite {...attributes}>
      // content...
    </Composite>
);
```

**JavaScript/JSX**, [functional component](./@connect.md#usage-with-functional-components):
```jsx
export const FunctionalComponent = connect(stateToProps, dispatchToProps)(
  /** @param {tabris.Attributes<Composite>} attributes */
  attributes =>
    <Composite padding={12} {...attributes}>
      // content...
    </Composite>
);
```

Plain **JavaScript**, [functional component](./@connect.md#usage-with-functional-components):
```js
exports.FunctionalComponent = connect(stateToProps, dispatchToProps)(
  /** @param {tabris.Attributes<tabris.Composite>} attr */
  attr => Composite({padding: 12, ...attr, children: [
    // content...
  ]})
);
```
