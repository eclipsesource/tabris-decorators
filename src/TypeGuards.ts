import {Constructor} from './utils';

type Gurad<T> = (value: any) => value is T;

export default class TypeGuards {

  private map: Map<Constructor<any>, Gurad<any>> = new Map();

  public set<T>(type: Constructor<T>, guard: Gurad<T>) {
    this.map.set(type, guard);
  }

  public get<T>(type: Constructor<T>): Gurad<T> | undefined {
    return this.map.get(type);
  }

}

export const instance = new TypeGuards();
