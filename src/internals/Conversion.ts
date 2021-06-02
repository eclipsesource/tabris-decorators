import {BindingConverter, Constructor} from '../api/interfaces';

export type ConversionOptions<Target, Property extends string> = {
  value: any,
  proto: Target,
  name: string,
  convert?: BindingConverter<any, Target, Property>,
  fallback?: any
};

export class Conversion<Target, Property extends string> {

  static convert<T>(options: ConversionOptions<T, string>) {
    if (options.value === undefined) {
      return options.fallback;
    }
    if (!options.convert) {
      return options.value;
    }
    const conversion = new Conversion(options.proto, options.name);
    const result = options.convert(options.value, conversion);
    if (conversion.resolved) {
      if (result !== undefined) {
        throw new Error('Converter may not return a value after resolve was called');
      }
      return conversion.result;
    }
    return result;
  }

  private result: any = undefined;
  private resolved: boolean = false;
  private targetMatched: boolean = false;

  private constructor(
    readonly proto: Target,
    readonly property: Property
  ) {
    this.targets = this.targets.bind(this);
    this.resolve = this.resolve.bind(this);
  }

  targets<CandidateTarget, CandidateProperty extends string & keyof CandidateTarget>(
    type: Constructor<CandidateTarget>,
    name?: CandidateProperty
  ): this is Conversion<CandidateTarget, CandidateProperty> {
    if (this.targetMatched) {
      throw new Error('targets() may not be called again');
    }
    return this.targetMatched = type.prototype === this.proto && (!name || name as string === this.property);
  }

  resolve(value: Property extends keyof Target ? Target[Property] : never) {
    if (this.resolved) {
      throw new Error('resolve was already called');
    }
    this.resolved = true;
    this.result = value;
  }

}
