import {Constructor, getPropertyType} from './utils';
import {getPropertyStore, trigger, TypeGuard, UserType} from './utils-databinding';
import {checkType, getValueString, isType} from '../api/checkType';
import {convert} from '../api/convert';
import {CompareFn, CompareMode, equals} from '../api/equals';
import {Converter, PropertySuperConfig, PropertyInitializer} from '../decorators/property';

export type CustomPropertyConfig<T> = PropertySuperConfig<T> & {
  initializer?: PropertyInitializer<any, T>,
  readonly?: boolean
};

export const autoDefault: unique symbol = Symbol('autoDefault');

export class CustomPropertyDescriptor<Proto extends object, TargetType> {

  private static readonly metaDataKey = Symbol();

  static get<CandidateProto extends object, ExpectedTargetType>(
    proto: CandidateProto,
    propertyName: keyof CandidateProto & string
  ): CustomPropertyDescriptor<CandidateProto, ExpectedTargetType> {
    let descriptor = Reflect.getMetadata(this.metaDataKey, proto, propertyName);
    if (!descriptor) {
      descriptor = new CustomPropertyDescriptor(proto, propertyName);
      Reflect.defineMetadata(this.metaDataKey, descriptor, proto, propertyName);
    }
    else if (!(descriptor instanceof CustomPropertyDescriptor)) {
      throw new Error(`Property "${descriptor}" can not be re-defined`);
    }
    return descriptor as CustomPropertyDescriptor<CandidateProto, ExpectedTargetType>;
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

  hasDataSource = false;
  readonly enumerable = true;
  readonly configurable = true;
  readonly get: () => TargetType;
  readonly set: (value: TargetType) => void;
  private userType: UserType<TargetType>;
  private typeGuard: TypeGuard;
  private readonly targetType = getPropertyType(this.proto, this.propertyName);
  private readonly changeEvent: string;
  private equals: CompareFn;
  private convert: (value: unknown, instance: object) => TargetType;
  private youHaveBeenWarned: boolean = false;
  private defaultValue: TargetType | undefined;
  private nullable: boolean;
  private readonly: boolean;
  private initializer: PropertyInitializer<Proto, TargetType>;

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
    this.setInitializer(undefined);
    this.setReadonly(false);
  }

  addConfig(config: CustomPropertyConfig<TargetType>) {
    if (config.readonly) {
      this.setReadonly(config.readonly);
    }
    if (config.initializer) {
      this.setInitializer(config.initializer);
    }
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

  toString() {
    return `property "${this.propertyName}" of class ${this.proto.constructor.name || '[anonymous]'}`;
  }

  get type(): Constructor<TargetType> {
    return this.userType || this.targetType;
  }

  private setValue(instance: Proto, value: any) {
    if (this.readonly) {
      throw new TypeError(`Failed to set ${this}: Property is read-only`);
    }
    let newValue = this.convert(value, instance);
    if (newValue == null && !this.nullable) {
      if (this.defaultValue == null) {
        throw new TypeError(`Failed to set ${this}: Property is not nullable`);
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
      store.set(this.propertyName, undefined);
      if (this.initializer || (this.defaultValue !== undefined)) {
        const rawValue = this.initializer ? this.initializer(instance, this) : this.defaultValue;
        try {
          const initValue = this.convert(rawValue, instance);
          if (!this.isUnchecked()) {
            this.checkType(initValue);
          }
          store.set(this.propertyName, initValue);
        } catch (ex) {
          const message = `${this} failed to initialize with default value: ${ex.message}`;
          console.warn(message);
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
          throw new Error(`Type guard check failed for ${getValueString(value)}`);
        }
      }
      else if (!this.userType) {
        checkType(value, this.targetType);
      }
    } catch (ex) {
      throw new TypeError(`Failed to set ${this}: ${ex.message}`);
    }
  }

  private setUserType(type: Constructor<TargetType>) {
    if (this.userType) {
      throw new Error(`Failed to configure ${this}: Can not re-define type of property`);
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

  private setInitializer(initializer: PropertyInitializer<Proto, TargetType>) {
    this.initializer = initializer;
  }

  private setConverter(modeOrFn: Converter<any>) {
    if (modeOrFn === 'off') {
      this.convert = value => value as any;
    } else if (modeOrFn === 'auto') {
      this.convert = value => {
        if (this.isConvertible(value)) {
          return convert(value, this.getType());
        }
        return value;
      };
    } else if (modeOrFn instanceof Function) {
      this.convert = value => {
        if (this.isConvertible(value)) {
          return modeOrFn(value);
        }
        return value;
      };
    }
  }

  private setNullable(nullable: boolean) {
    this.nullable = nullable !== false;
  }

  private setReadonly(readonly: boolean) {
    this.readonly = readonly;
  }

  private setDefaultValue(value: TargetType | undefined | typeof autoDefault) {
    if (value === undefined) {
      return;
    }
    if ((value !== this.defaultValue) && (this.defaultValue !== undefined)) {
      throw new Error(`Failed to configure ${this}: default value can not be re-defined`);
    }
    if (value === autoDefault) {
      const type = this.getType();
      if (type == null) {
        this.handleTypeMissing();
      } else {
        this.defaultValue =
          type === Number ? 0 :
            type === String ? '' :
              type === Boolean ? false :
          null as any;
      }
    } else {
      this.defaultValue = value;
    }
  }

  private getType(): Constructor<any> {
    return this.userType || (this.targetType !== Object ? this.targetType : null);
  }

  private isConvertible(value: unknown) {
    const type = this.getType();
    if (!type) {
      this.handleTypeMissing();
      return false;
    }
    if (value == null) {
      return false;
    }
    return !isType(value, type, true);
  }

  private handleTypeMissing() {
    if (!this.youHaveBeenWarned) {
      console.warn(
        `The ${this} is configured to auto-convert incoming values, but the target type could not be inferred. `
        + 'Set "convert" of the decorator configuration to another value or use @property without configuration'
      );
      this.youHaveBeenWarned = true;
    }
  }

}
