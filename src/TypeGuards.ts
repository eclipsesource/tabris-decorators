import { BaseConstructor } from './utils';

export type Guard<T> = (value: T) => boolean;

export class TypeGuards {

  private map: Map<BaseConstructor<any>, Array<Guard<any>>> = new Map();

  public add<T>(type: BaseConstructor<T>, guard: Guard<T>) {
    if (!this.map.has(type)) {
      this.map.set(type, []);
    }
    (this.map.get(type) as Array<Guard<any>>).push(guard);
  }

  /**
   * Checks if the given value is of the given type while respecting the registered type guards.
   * Throws if the check fails. Otherwise returns the given value.
   * Primitives are represented by their boxed type, e.g. `Number`.
   * All values are treated as compatible to "Object", even primitives.
   * If no type is given no check is performed.
   */
  public checkType<T>(value: T, type: BaseConstructor<any> | null): T {
    if (type === Object || !type) {
      return value;
    }
    if (value === null || value === undefined || value instanceof type || this.isPrimitiveOfType(value, type)) {
      return value;
    }
    let guards = this.map.get(type);
    if (guards) {
      for (let guard of guards) {
        try {
          if (guard(value)) {
            return value;
          }
        } catch (ex) {
          // tslint:disable-next-line:no-console
          console.error(`TypeGuard for "${this.getTypeName(type)}" threw exception: ${ex.message}`);
        }
      }
    }
    throw new Error(
      `Expected value to be of type "${this.getTypeName(type)}", but found "${this.getValueTypeName(value)}".`
    );
  }

  private getValueTypeName(value: any) {
    if (value && value.constructor) {
      return this.getTypeName(value.constructor);
    }
    return typeof value;
  }

  private isPrimitiveOfType(value: any, type: BaseConstructor<any>): boolean {
    if (!this.isPrimitiveType(type)) {
      return false;
    }
    return typeof value === this.getTypeName(type);
  }

  private getTypeName(type: BaseConstructor<any>) {
    let name = type.name;
    if (this.isPrimitiveType(type)) {
      return name.toLowerCase();
    }
    return name;
  }

  private isPrimitiveType(type: BaseConstructor<any>) {
    return type === Boolean || type === Number || type === String;
  }

}

export const typeGuards = new TypeGuards();
