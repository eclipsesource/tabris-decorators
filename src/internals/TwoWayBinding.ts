import {CustomPropertyDescriptor} from './CustomPropertyDescriptor';
import {getJsxInfo} from './ExtendedJSX';
import {subscribe} from './subscribe';
import {checkPropertyExists, TargetPath, WidgetInterface, Direction, BindingConverter} from './utils-databinding';
import {injector} from '../api/Injector';
import {BindSuperConfig} from '../decorators/bind';
import {Widget, WidgetCollection} from 'tabris';
import {Conversion} from './Conversion';

type LocalPath = [string, string?];

const noop = () => undefined;

export class TwoWayBinding {

  static create(component: WidgetInterface, config: BindSuperConfig<unknown>) {
    if (config.all) {
      for (const sourceProperty in config.all) {
        const localPath: LocalPath = [config.componentProperty, sourceProperty];
        const target = config.all[sourceProperty];
        if (target instanceof Array) {
          target.forEach(({path, converter}) =>
            new TwoWayBinding(component, localPath, path, converter)
          );
        }
      }
    } else {
      const localPath: LocalPath = [config.componentProperty];
      new TwoWayBinding(component, localPath, config.targetPath, config.convert?.binding);
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
      throw new Error(`Error in ${this}: Invalid number of path segments`);
    }
    this.target = this.getTarget(this.component, this.targetPath[1]);
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
      return this.subscribe(this.component, this.localPath, localValue => {
        if (localValue === undefined) {
          this.setTargetValue(this.fallback);
          this.applyFallbackToLocal();
        } else {
          this.setTargetValue(this.toTargetValue(localValue));
        }
      });
    }
    if (this.direction === '<<' && this.bindsToModel()) {
      return this.subscribe(this.component, [this.localPath[0]], () => {
        if (this.hasValidSource()) {
          this.setLocalValue(this.toLocalValue(this.getTargetValue()));
        }
      });
    }
    return noop;
  }

  private subscribeToTargetValue() {
    if (!this.direction || this.direction === '<<') {
      return this.subscribe(this.target, [this.targetProperty], targetValue => {
        if (!this.hasValidSource()) {
          return;
        }
        if (this.initialized || this.targetHasPriority()) {
          this.setLocalValue(this.toLocalValue(targetValue));
          this.syncBackToTarget();
        }
      });
    }
    return noop;
  }

  private applyFallbackToLocal() {
    if (this.direction === '>>' || !this.hasValidSource() || this.fallback === undefined) {
      return;
    }
    const finalValue = Conversion.convert({
      value: this.fallback,
      convert: this.convert,
      proto: Object.getPrototypeOf(this.getSourceObject()),
      name: this.getSourcePropertyName()
    });
    if (finalValue !== undefined) {
      this.setLocalValue(finalValue);
    }
  }

  private syncBackToTarget() {
    if (this.direction !== '<<' && this.hasValidSource()) {
      const finalValue = this.toTargetValue(this.getLocalValue());
      if (finalValue !== undefined) {
        this.setTargetValue(finalValue);
      }
    }
  }

  private targetHasPriority() {
    return this.direction === '<<' || this.getLocalValue() === undefined;
  }

  private toLocalValue(targetValue: unknown) {
    return Conversion.convert({
      value: targetValue,
      convert: this.convert,
      fallback: this.fallback,
      proto: Object.getPrototypeOf(this.getSourceObject()),
      name: this.getSourcePropertyName()
    });
  }

  private toTargetValue(localValue: unknown) {
    return Conversion.convert({
      value: localValue,
      convert: this.convert,
      fallback: this.fallback,
      proto: Object.getPrototypeOf(this.target),
      name: this.targetProperty
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

  private setLocalValue(value: any) {
    if (this.hasValidSource()) {
      this.getSourceObject()[this.getSourcePropertyName()] = value;
    }
  }

  private getLocalValue() {
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

  private setTargetValue(value: any) {
    this.target[this.targetProperty] = value;
  }

  private getTargetValue() {
    return this.target[this.targetProperty];
  }

  private checkPropertySafety(target: WidgetInterface, property: string, dir: 'Left' | 'Right') {
    checkPropertyExists(target, property, `Binding ${this} failed: `);
    if (CustomPropertyDescriptor.isUnchecked(target, property)) {
      if (isInStrictMode(target)) {
        throw new Error(
          `Error in binding ${this}: ${dir} hand property "${property}" requires an explicit type check.`
        );
      }
      console.warn(
        `Unsafe binding ${this}: ${dir} hand property "${property}" has no type check.`
      );
    }
  }

  private getTarget(base: WidgetInterface, selector: string) {
    if (selector === ':host') {
      return base;
    }
    const results = (base as any)._find(selector) as WidgetCollection<Widget>;
    if (results.length === 0) {
      throw new Error(`Error in binding ${this}: No widget matching "${selector}" was appended.`);
    } else if (results.length > 1) {
      throw new Error(`Error in binding ${this}: Multiple widgets matching "${selector}" were appended.`);
    }
    return results.first() as WidgetInterface;
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
