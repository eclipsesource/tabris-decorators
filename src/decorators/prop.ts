import {CustomPropertyDecorator, PropertyDecoratorConfig} from '..';
import {CompareMode} from '../api/equals';
import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {applyDecorator} from '../internals/utils';
import {TypeGuard, UserType} from '../internals/utils-databinding';

export function prop(targetProto: object, propertyName: string | symbol): void;
export function prop<T>(check: PropertyDecoratorConfig<T>): CustomPropertyDecorator<T>;
export function prop(...args: any[]): PropertyDecorator | void {
  return applyDecorator('prop', args, (proto: object, propertyName: string) => {
    CustomPropertyDescriptor.get(proto, propertyName as keyof typeof proto).addConfig({
      typeGuard: getTypeGuard(args[0]),
      type: getUserType(args[0]),
      convert: getConverter(args[0]),
      equals: getCompareMode(args[0]),
      default: getDefaultValue(args[0]),
      nullable: getNullable(args[0])
    });
  });
}

function getTypeGuard(arg: unknown): TypeGuard<any> | null {
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).typeGuard || null;
  }
  return null;
}

function getUserType(arg: unknown): UserType<any> | null {
  if (arg instanceof Function) {
    return arg as UserType<any>;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).type || null;
  }
  return null;
}

function getCompareMode(arg: unknown): CompareMode {
  if (arg instanceof Function) {
    return 'auto';
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).equals || 'auto';
  }
  return 'auto';
}

function getConverter(arg: unknown): ((v: any) => any) | 'auto' {
  if (arg instanceof Function) {
    return 'auto';
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).convert || 'auto';
  }
  return 'auto';
}

function getNullable(arg: unknown): boolean {
  if (arg instanceof Function) {
    return false;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return !!(arg as any).nullable;
  }
  return false;
}

function getDefaultValue(arg: unknown): any {
  if (arg instanceof Function) {
    return undefined;
  }
  if (arg instanceof Object && arg.constructor === Object && 'default' in arg) {
    return (arg as any).default;
  }
  return undefined;
}
