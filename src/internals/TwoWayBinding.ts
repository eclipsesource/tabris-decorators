import {CustomPropertyDescriptor} from './CustomPropertyDescriptor';
import {getJsxInfo} from './ExtendedJSX';
import {subscribe} from './subscribe';
import {checkPropertyExists, getTarget, TargetPath, WidgetInterface, Direction, BindingConverter} from './utils-databinding';
import {injector} from '../api/Injector';
import {BindSuperConfig} from '../decorators/bind';
import {Conversion, ConversionOptions} from './Conversion';

type LocalPath = [string, string?];

const noop = () => undefined;

export class TwoWayBinding {

  static create(component: WidgetInterface, config: BindSuperConfig<unknown>) {
    if (config.all) {
      for (const sourceProperty in config.all) {
        const localPath: LocalPath = [config.componentProperty, sourceProperty];
        const targetPath = config.all[sourceProperty];
        try {
          new TwoWayBinding(component, localPath, targetPath.path, targetPath.converter);
        } catch (ex) {
          throw new Error(
            `Binding ${bindingToString(localPath, targetPath.path)} failed to initialize: ` + ex.message
          );
        }
      }
    } else {
      const localPath: LocalPath = [config.componentProperty];
      try {
        new TwoWayBinding(component, localPath, config.targetPath, config.convert?.binding);
      } catch (ex) {
        throw new Error(
          `Binding ${bindingToString(localPath, config.targetPath)} failed to initialize: ` + ex.message
        );
      }
    }
  }

  private initialized: boolean = false;
  private target: WidgetInterface;
  private targetProperty: string;
  private direction: Direction;
  private suspended: boolean = false;
  private fallback: any;
  private cancelLocal: () => void;
  private cancelTarget: () => void;

  constructor(
    private readonly component: WidgetInterface,
    private readonly localPath: LocalPath,
    private readonly targetPath: TargetPath,
    private readonly convert: BindingConverter<any> | null
  ) {
    if (this.localPath.length > 2) {
      throw new Error('Invalid number of path segments');
    }
    this.target = getTarget(this.component, this.targetPath[1]);
    this.direction = this.targetPath[0];
    this.targetProperty = this.targetPath[2];
    this.fallback = this.getTargetValue();
    if (!this.direction || this.direction === '>>') {
      this.checkPropertySafety(this.target, this.targetProperty, 'Right');
    }
    if (!this.direction || this.direction === '<<') {
      this.checkPropertySafety(this.component, this.localPath[0], 'Left');
    }
    this.init();
  }

  toString() {
    return bindingToString(this.localPath, this.targetPath);
  }

  private init() {
    this.cancelLocal = this.subscribeToLocalValue();
    this.cancelTarget = this.subscribeToTargetValue();
    this.component.on({dispose: () => this.dispose()});
    this.initialized = true;
  }

  private dispose() {
    this.cancelLocal();
    this.cancelTarget();
  }

  private subscribeToLocalValue() {
    if (!this.direction || this.direction === '>>') {
      return this.subscribe(this.component, this.localPath, incoming => {
        const finalValue = this.computeFinalValue(incoming, '>>');
        this.tryTo('update right hand property', () => this.setTargetProperty(finalValue));
        this.tryTo('sync back value of right hand property', () => this.syncBackToSource(incoming));
      });
    }
    if (this.direction === '<<' && this.bindsToModel()) {
      return this.subscribe(this.component, [this.localPath[0]], () => {
        if (this.hasValidSource()) {
          const finalValue = this.computeFinalValue(this.getTargetValue(), '<<');
          this.setSourceProperty(finalValue);
        }
      });
    }
    return noop;
  }

  private subscribeToTargetValue() {
    if (!this.direction || this.direction === '<<') {
      return this.subscribe(this.target, [this.targetProperty], incoming => {
        if (!this.hasValidSource()) {
          return;
        }
        if (this.initialized || this.targetHasPriority()) {
          const finalValue = this.computeFinalValue(incoming, '<<');
          this.tryTo('update left hand property', () => this.setSourceProperty(finalValue));
          this.tryTo('sync back value of left hand property', () => this.syncBackToTarget(finalValue));
        }
      });
    }
    return noop;
  }

  private syncBackToSource(value: unknown) {
    const fallBackToOriginalValue = !this.direction
      && value === undefined
      && this.fallback !== undefined
      && this.hasValidSource();
    if (fallBackToOriginalValue) {
      const finalFallback = this.computeFinalValue(this.fallback, '<<');
      if (finalFallback !== undefined) {
        this.setSourceProperty(finalFallback);
      }
    }
  }

  private syncBackToTarget(value: any) {
    if (this.direction !== '<<') {
      if (this.hasValidSource() && this.getSourceValue() !== value) {
        const finalValue = this.computeFinalValue(this.getSourceValue(), '>>');
        if (finalValue !== undefined) {
          this.setTargetProperty(finalValue);
        }
      }
    }
  }

  private targetHasPriority() {
    return this.direction === '<<' || this.getSourceValue() === undefined;
  }

  private computeFinalValue(incoming: unknown, direction: Direction) {
    let finalValue: any;
    const toTarget = direction === '>>';
    const options: ConversionOptions<any, any> = {
      value: incoming,
      convert: this.convert,
      fallback: this.fallback,
      proto: Object.getPrototypeOf(toTarget ? this.target : this.getSourceObject()),
      name: toTarget ? this.targetProperty : this.getSourcePropertyName()
    };
    this.tryTo(
      `convert value of ${toTarget ? 'left' : 'right'} hand property`,
      () => finalValue = Conversion.convert(options)
    );
    return finalValue;
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
    if (this.hasValidSource()) {
      this.getSourceObject()[this.getSourcePropertyName()] = finalValue;
    }
  }

  private getSourceValue() {
    return this.getSourceObject()[this.getSourcePropertyName()];
  }

  private getSourceObject() {
    if (!this.hasValidSource()) {
      console.trace();
      throw new Error('No valid source');

    }
    if (this.bindsToModel()) {
      return this.component[this.localPath[0]];
    }
    return this.component;
  }

  private getSourcePropertyName() {
    return this.bindsToModel() ? this.localPath[1] : this.localPath[0];
  }

  private hasValidSource() {
    return !this.bindsToModel() || this.component[this.localPath[0]] instanceof Object;
  }

  private setTargetProperty(value: any) {
    this.target[this.targetProperty] = value;
  }

  private getTargetValue() {
    return this.target[this.targetProperty];
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

  private bindsToModel() {
    return this.localPath.length === 2;
  }

}

function isInStrictMode(widget: WidgetInterface) {
  const jsxInfo = getJsxInfo(widget);
  const processor = 'processor' in jsxInfo ? jsxInfo.processor : injector.jsxProcessor;
  return processor.unsafeBindings === 'error';
}

function bindingToString(localPath: LocalPath, targetPath: TargetPath): string {
  try {
    const arrow = targetPath[0] || '<->';
    return `"${localPath.join('.')}" ${arrow} "${targetPath[1]}.${targetPath[2]}"`;
  } catch (ex) {
    return '[' + ex.message + ']';
  }
}
