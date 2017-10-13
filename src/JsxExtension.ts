/* tslint:disable no-namespace ban-types only-arrow-functions */
import {Constructor} from './utils';
import {create} from './injectors';

const originalJSX = JSX;

(global as any).JSX = {

  createElement(
    type: string|Constructor<any>, properties: Object, ...children: tabris.Widget[]
  ) {
    return originalJSX.createElement(convertType(type), properties, ...children);
  }

};

function convertType(type: string | Constructor<any>): string | Function {
  if (type instanceof Function) {
    return function(...args: any[]) {
      return create(type, args);
    };
  }
  return type;
}
