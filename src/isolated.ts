import 'reflect-metadata';
import { BaseConstructor, applyClassDecorator, ClassDecoratorFactory } from './utils';
import { WidgetCollection, Widget } from 'tabris';

export default function isolated(type: BaseConstructor<Widget>): void;
export default function isolated(...args: any[]): void | ClassDecoratorFactory<Widget> {
  return applyClassDecorator('isolated', args, (type: BaseConstructor<Widget>) => {
    if (type.prototype.children !== returnEmptyCollection) {
      type.prototype.children = returnEmptyCollection;
    }
  });
}

function returnEmptyCollection() {
  return new WidgetCollection([]);
}
