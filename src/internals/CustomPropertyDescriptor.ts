import {Constructor, getPropertyType} from './utils';
import {getPropertyStore, trigger} from './utils-databinding';
import {checkType} from '../api/checkType';
import {PropertySuperConfig} from '../decorators/property';

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
      return desc.unchecked;
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
  private readonly changeEvent: string;
  private readonly targetType: Constructor<TargetType>;
  private readonly config: Array<PropertySuperConfig<TargetType>> = [];
  private unchecked: boolean;

  constructor(private readonly proto: Proto, private readonly propertyName: keyof Proto & string) {
    const self = this;
    this.changeEvent = propertyName + 'Changed';
    this.targetType = getPropertyType(this.proto, this.propertyName);
    this.unchecked = this.targetType as Constructor<any> === Object;
    this.set = function(this: Proto, value) { self.setValue(this, value); };
    this.get = function(this: Proto) { return self.getValue(this); };
    Object.defineProperty(proto, propertyName, this);
  }

  addConfig(config: PropertySuperConfig<TargetType>) {
    if (config.type || config.typeGuard) {
      this.unchecked = false;
    }
    this.config.push(config);
  }
  private getValue(instance: Proto) {
    return getPropertyStore(instance).get(this.propertyName);
  }

  private setValue(instance: Proto, value: any) {
    const currentValue = this.getValue(instance);
    if (currentValue !== value) {
      if (!this.unchecked) {
        this.checkType(value);
      }
      getPropertyStore(instance).set(this.propertyName, value);
      trigger(instance, this.changeEvent, {value});
    }
  }

  private checkType(value: any) {
    try {
      if (this.config[0].type) { // unlike meta-data type, userType is checked first and regardless of typeGuard
        checkType(value, this.config[0].type);
      }
      if (this.config[0].typeGuard) {
        if (!this.config[0].typeGuard(value)) {
          throw new Error('Type guard check failed');
        }
      }
      else if (!this.config[0].type) {
        checkType(value, this.targetType);
      }
    }
    catch (ex) {
      throw new Error(`Failed to set property "${this.propertyName}": ${ex.message}`);
    }
  }

}
