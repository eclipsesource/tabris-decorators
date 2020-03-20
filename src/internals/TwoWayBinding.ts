import {CustomPropertyDescriptor} from './CustomPropertyDescriptor';
import {getJsxInfo} from './ExtendedJSX';
import {subscribe} from './subscribe';
import {checkPropertyExists, getChild, TargetPath, WidgetInterface} from './utils-databinding';
import {injector} from '../api/Injector';
import {BindSuperConfig} from '../decorators/bind';

type LocalPath = [string, string?];

export class TwoWayBinding {

  static create(component: WidgetInterface, config: BindSuperConfig) {
    if (config.all) {
      for (const sourceProperty in config.all) {
        const localPath: LocalPath = [config.componentProperty, sourceProperty];
        const targetPath = config.all[sourceProperty];
        try {
          new TwoWayBinding(component, localPath, targetPath);
        } catch (ex) {
          throw new Error(
            `Binding ${bindingToString(localPath, targetPath)} failed to initialize: ` + ex.message
          );
        }
      }
    } else {
      const localPath: LocalPath = [config.componentProperty];
      try {
        new TwoWayBinding(component, localPath, config.targetPath);
      } catch (ex) {
        throw new Error(
          `Binding ${bindingToString(localPath, config.targetPath)} failed to initialize: ` + ex.message
        );
      }

    }
  }

  private target: WidgetInterface;
  private targetProperty: string;
  private suspended: boolean = false;
  private fallback: any;
  private cancelLocal: () => void;
  private cancelTarget: () => void;

  constructor(
    private readonly component: WidgetInterface,
    private readonly localPath: LocalPath,
    private readonly targetPath: TargetPath
  ) {
    if (this.localPath.length > 2) {
      throw new Error('Invalid number of path segments');
    }
    this.target = getChild(this.component, this.targetPath[0]);
    this.targetProperty = this.targetPath[1];
    this.fallback = this.target[this.targetProperty];
    this.checkPropertySafety(this.component, this.localPath[0], 'Left');
    this.checkPropertySafety(this.target, this.targetProperty, 'Right');
    this.cancelLocal = this.subscribeToLocalValue();
    this.cancelTarget = this.subscribeToTargetValue();
    this.component.on({dispose: () => this.dispose()});
  }

  toString() {
    return bindingToString(this.localPath, this.targetPath);
  }

  private dispose() {
    this.cancelLocal();
    this.cancelTarget();
  }

  private subscribeToLocalValue() {
    return this.subscribe(this.component, this.localPath, rawValue => {
      const finalValue = rawValue !== undefined ? rawValue : this.fallback;
      this.tryTo('update right hand property', () => this.setTargetProperty(finalValue));
      this.tryTo('sync back value of right hand property', () => this.setSourceProperty(finalValue));
    });
  }

  private subscribeToTargetValue() {
    return this.subscribe(this.target, [this.targetProperty], rawValue => {
      if (this.hasValidSource()) {
        const finalValue = rawValue !== undefined ? rawValue : this.fallback;
        this.tryTo('update left hand property', () => this.setSourceProperty(finalValue));
        this.tryTo('sync back value of left hand property', () => {
          if (this.hasValidSource() && this.getSourceValue() !== finalValue) {
            this.setTargetProperty(this.getSourceValue());
          }
        });
      }
    });
  }

  private subscribe(root: any, path: string[], cb: (value: unknown) => void) {
    return subscribe(root, path, value => {
      if (this.suspended) {
        return;
      }
      this.suspended = true;
      cb(value);
      this.suspended = false;
    });
  }

  private setSourceProperty(finalValue: any) {
    if (this.localPath.length === 2 && this.component[this.localPath[0]]) {
      this.component[this.localPath[0]][this.localPath[1]] = finalValue;
    } else if (this.localPath.length === 1) {
      this.component[this.localPath[0]] = finalValue;
    }
  }

  private getSourceValue() {
    if (this.localPath.length === 2 && this.component[this.localPath[0]]) {
      return this.component[this.localPath[0]][this.localPath[1]];
    } else if (this.localPath.length === 1) {
      return this.component[this.localPath[0]];
    }
    throw new Error('No valid source');
  }

  private hasValidSource() {
    return this.localPath.length === 1 || this.component[this.localPath[0]] instanceof Object;
  }

  private setTargetProperty(value: any) {
    this.target[this.targetProperty] = value;
  }

  private checkPropertySafety(target: WidgetInterface, property: string, dir: 'Left' | 'Right') {
    checkPropertyExists(target, property);
    if (CustomPropertyDescriptor.isUnchecked(target, property)) {
      if (isInStrictMode(target)) {
        throw new Error(`${dir} hand property "${property}" requires an explicit type check.`);
      }
      console.warn(
        `Unsafe two-way binding ${this}: ${dir} hand property "${property}" has no type check.`
      );
    }
  }

  private tryTo(taskDesc: string, cb: () => void) {
    try {
      cb();
    } catch (ex) {
      throw new Error(
        `Binding ${this} failed to ${taskDesc}: ${ex.message}`
      );
    }
  }

}

function isInStrictMode(widget: WidgetInterface) {
  const jsxInfo = getJsxInfo(widget);
  const processor = 'processor' in jsxInfo ? jsxInfo.processor : injector.jsxProcessor;
  return processor.unsafeBindings === 'error';
}

function bindingToString(localPath: LocalPath, targetPath: TargetPath): string {
  try {
    return `"${localPath.join('.')}" <-> "${targetPath.join('.')}"`;
  } catch (ex) {
    return '[' + ex.message + ']';
  }
}
