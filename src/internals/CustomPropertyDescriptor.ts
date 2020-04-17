import {Constructor, getPropertyType, isPrimitiveType} from './utils';
import {getPropertyStore, trigger, TypeGuard, UserType} from './utils-databinding';
import {checkType, isType} from '../api/checkType';
import {convert} from '../api/convert';
import {CompareFn, CompareMode, equals} from '../api/equals';
import {Converter, PropertySuperConfig} from '../decorators/property';

export class CustomPropertyDescriptor<Proto extends object, TargetType> {

  private static readonly metaDataKey = Symbol();

  static get<Proto extends object, TargetType>(
    proto: Proto,
    propertyName: keyof Proto & string
  ): CustomPropertyDescriptor<Proto, TargetType> {
    let descriptor = Reflect.getMetadata(this.metaDataKey, proto, propertyName);
    if (!descriptor) {
      descriptor = new CustomPropertyDescriptor(proto, propertyName);
      Reflect.defineMetadata(this.metaDataKey, descriptor, proto, propertyName);
    }
    else if (!(descriptor instanceof CustomPropertyDescriptor)) {
      throw new Error(`Property "${descriptor}" can not be re-defined`);
    }
    return descriptor as CustomPropertyDescriptor<Proto, TargetType>;
  }

  static isUnchecked<PropertyName extends string>(
    target: object,
    propertyName: PropertyName
  ): boolean {
    const desc = Reflect.getMetadata(this.metaDataKey, target, propertyName);
    if (desc instanceof CustomPropertyDescriptor) {
      return desc.isUnchecked();
    }
    return false;
  }

  static has<PropertyName extends string>(target: any, propertyName: PropertyName): target is {
    [name in PropertyName]: any;
  } {
    return !!Reflect.getMetadata(this.metaDataKey, target, propertyName);
  }

  readonly enumerable = true;
  readonly configurable = true;
  readonly get: () => TargetType;
  readonly set: (value: TargetType) => void;
  private userType: UserType<TargetType>;
  private typeGuard: TypeGuard;
  private readonly changeEvent: string;
  private readonly targetType = getPropertyType(this.proto, this.propertyName);
  private equals: CompareFn;
  private convert: (value: unknown, instance: object) => TargetType;
  private youHaveBeenWarned: boolean = false;
  private defaultValue: TargetType | undefined;
  private nullable: boolean;

  constructor(private readonly proto: Proto, private readonly propertyName: keyof Proto & string) {
    const self = this;
    this.changeEvent = propertyName + 'Changed';
    this.set = function(this: Proto, value) { self.setValue(this, value); };
    this.get = function(this: Proto) { return self.getValue(this); };
    Object.defineProperty(proto, propertyName, this);
    this.setCompareMode('strict');
    this.setConverter('off');
    this.setNullable(true);
    this.setDefaultValue(undefined);
  }

  addConfig(config: PropertySuperConfig<TargetType>) {
    if (config.type) {
      this.setUserType(config.type);
    }
    if (config.typeGuard) {
      this.addTypeGuard(config.typeGuard);
    }
    if (config.convert) {
      this.setConverter(config.convert);
    }
    if (config.equals) {
      this.setCompareMode(config.equals);
    }
    if (config.nullable != null) {
      this.setNullable(config.nullable);
    }
    if ('default' in config) {
      this.setDefaultValue(config.default);
    }
  }

  private setValue(instance: Proto, value: any) {
    let newValue = this.convert(value, instance);
    if (newValue == null && !this.nullable) {
      if (this.defaultValue == null) {
        throw new Error('Property is not nullable');
      }
      newValue = this.convert(this.defaultValue, instance);
    }
    if (!this.equals(this.getValue(instance), newValue)) {
      if (!this.isUnchecked()) {
        this.checkType(newValue);
      }
      getPropertyStore(instance).set(this.propertyName, newValue);
      trigger(instance, this.changeEvent, {value: newValue});
    }
  }

  private getValue(instance: Proto) {
    const store = getPropertyStore(instance);
    if (!store.has(this.propertyName)) {
      if (this.defaultValue !== undefined) {
        try {
          const initValue = this.convert(this.defaultValue, instance);
          if (!this.isUnchecked()) {
            this.checkType(initValue);
          }
          store.set(this.propertyName, initValue);
        } catch (ex) {
          console.warn(`Failed to initialize property "${this.propertyName}" with default value: ${ex.message}`);
          store.set(this.propertyName, undefined);
        }
      } else {
        store.set(this.propertyName, undefined);
      }
    }
    return store.get(this.propertyName);
  }

  private isUnchecked() {
    return this.targetType as Constructor<any> === Object
      && !this.userType
      && !this.typeGuard;
  }

  private checkType(value: any) {
    try {
      if (this.userType) { // unlike meta-data type, userType is checked first and regardless of typeGuard
        checkType(value, this.userType);
      }
      if (this.typeGuard) {
        if (!this.typeGuard(value)) {
          throw new Error('Type guard check failed');
        }
      }
      else if (!this.userType) {
        checkType(value, this.targetType);
      }
    }
    catch (ex) {
      throw new Error(`Failed to set property "${this.propertyName}": ${ex.message}`);
    }
  }

  private setUserType(type: Constructor<TargetType>) {
    if (this.userType) {
      throw new Error('Can not re-define type of property');
    }
    this.userType = type;
  }

  private addTypeGuard(typeGuard: TypeGuard<TargetType>) {
    if (!this.typeGuard) {
      this.typeGuard = typeGuard;
    } else {
      const prevTypeGuard = this.typeGuard;
      this.typeGuard = value => typeGuard(value) && prevTypeGuard(value);
    }
  }

  private setCompareMode(mode: CompareMode) {
    this.equals = (a, b) => equals([a, b], mode);
  }

  private setConverter(modeOrFn: Converter<any>) {
    if (modeOrFn === 'off') {
      this.convert = value => value as any;
    } else if (modeOrFn === 'auto') {
      this.convert = (value, instance) => {
        if (!this.isConvertible(value, instance)) {
          return value;
        }
        return convert(value, this.getType());
      };
    } else if (modeOrFn instanceof Function) {
      this.convert = (value, instance) => {
        if (!this.isConvertible(value, instance)) {
          return value;
        }
        return modeOrFn(value);
      };
    }
  }

  private setNullable(nullable: boolean) {
    this.nullable = nullable !== false;
  }

  private setDefaultValue(value: TargetType | undefined) {
    if (this.defaultValue !== undefined) {
      throw new Error('property default value can not be re-defined');
    }
    this.defaultValue = value;
  }

  private getType(): Constructor<any> {
    return this.userType || (this.targetType !== Object ? this.targetType : null);
  }

  private isConvertible(value: unknown, instance: object) {
    const type = this.getType();
    if (!type) {
      this.noTypeWarning(instance);
      return false;
    }
    if (value == null) {
      return !this.nullable && isPrimitiveType(type) && this.defaultValue === undefined;
    }
    return !isType(value, type, true);
  }

  private noTypeWarning(instance: object) {
    if (!this.youHaveBeenWarned) {
      const className = instance.constructor.name || '[anonymous]';
      console.warn(
        `Property "${this.propertyName}" of class "${className}" requires an explicit type to function correctly`
      );
      this.youHaveBeenWarned = true;
    }
  }

}
