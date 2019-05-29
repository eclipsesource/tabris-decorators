---
---
# @getById

> :point_right: Make sure to first read the introduction to [decorators](./index.md).

## @getById (no parameter)

Makes the decorated property return the descendant with the same id as the property name. The following rules apply:

 * It only works on classes decorated with `@component`.
 * It is read-only at runtime. Attempts to set the property fill fail silently.
 * It will search for a matching descendant widget exactly once, after `append` is called the first time on the widget instance.
 * If accessed before children have been appended it will throw an error.
 * It will always return the same descendant, even if it is disposed or removed.
 * It will throw if there is no match, more than one, or if the type is not correct.

## @getById(typeGuard)

Where `typeGuard` is of the type `value: any => boolean`.

Like `@getById`, but uses the given type guard function to check the found widget, allowing widgets with compatible but not identical types to be resolved.
