import 'reflect-metadata';
import {Composite} from 'tabris';
import {
  applyDecorator,
  WidgetInterface,
  postAppendHandlers,
  getPropertyType,
  defineGetter,
  wasAppended,
  checkType,
  getPropertyStore,
  ChangeEvent
} from './utils';

export default function bind(bindingPath: string): (target: Composite, property: string) => void;
export default function bind(...args: any[]): any {
  return applyDecorator('bind', args, (targetProto: WidgetInterface, targetProperty: string) => {
    const bindingPath = args[0] as string;
    const [sourceId, sourceProperty] = parsePath(bindingPath);
    const targetPropertySource = Symbol(targetProperty + 'Source');
    const targetType = getPropertyType(targetProto, targetProperty);
    Object.defineProperty(targetProto, targetProperty, {
      get(this: WidgetInterface) {
        accessCheck(this, targetProperty, bindingPath);
        return getPropertyStore(this).get(targetPropertySource)[sourceProperty];
      },
      set(this: WidgetInterface, value: any) {
        accessCheck(this, targetProperty, bindingPath);
        getPropertyStore(this).get(targetPropertySource)[sourceProperty] = value;
      },
      enumerable: true,
      configurable: true
    });
    postAppendHandlers(targetProto).push((targetInstance) => {
      try {
        const sourceChangeEvent = sourceProperty + 'Changed';
        const targetChangeEvent = targetProperty + 'Changed';
        let sourceInstance = getSourceWidget(targetInstance, sourceId);
        checkPropertyExists(sourceInstance, sourceProperty);
        checkType(sourceInstance[sourceProperty], targetType);
        getPropertyStore(targetInstance).set(targetPropertySource, sourceInstance);
        sourceInstance.on(sourceChangeEvent, (ev) => {
          targetInstance.trigger(targetChangeEvent, new ChangeEvent(targetInstance, targetChangeEvent, ev.value));
        });
        targetInstance.trigger(
          targetChangeEvent, new ChangeEvent(targetInstance, targetChangeEvent, sourceInstance[sourceProperty])
        );
      } catch (ex) {
        throw new Error(`Could not bind property "${targetProperty}" to "${bindingPath}": ${ex.message}`);
      }
    });
  });
}

function checkPropertyExists(sourceWidget: any, sourceProperty: string) {
  if (!(sourceProperty in sourceWidget)) {
    throw new Error(`Source does not have a property "${sourceProperty}".`);
  }
}

function accessCheck(targetInstance: WidgetInterface, targetProperty: string, bindingPath: string) {
  if (!wasAppended(targetInstance)) {
    throw new Error(`Can not access property "${targetProperty}": `
    + `Binding "${bindingPath}" is not ready because no widgets have been appended yet.`);
  }
}

function getSourceWidget(targetInstance: WidgetInterface, sourceId: string) {
  let results = targetInstance.find('#' + sourceId);
  if (results.length === 0) {
    throw new Error('No widget with id "textInput1" appended.');
  } else if (results.length > 1) {
    throw new Error('Multiple widgets with id "textInput1" appended.');
  }
  return results.first() as WidgetInterface;
}

function parsePath(path: string) {
  if (/\s|\[|\]|\(|\)|\<|\>/.test(path)) {
    throw new Error('Binding path contains invalid characters.');
  }
  if (/this/.test(path)) {
    throw new Error('Binding path contains reserved word "this".');
  }
  let result = path.split('.');
  if (result.length < 2) {
    throw new Error('Binding path needs at least two segements.');
  } else if (result.length > 2) {
    throw new Error('Binding path has too many segments.');
  }
  return result;
}
