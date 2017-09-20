import {Widget} from 'tabris';

type Target = {[prop: string]: any} & Widget;

export function findFirst(selector: string) {
  return (target: Target, key: string) => {
    Object.defineProperty(target, key, {
      get(this: Widget) {
        return this.find(selector).first() || null;
      },
      enumerable: true,
      configurable: true
    });
  };
}
