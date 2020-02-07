import {property} from 'tabris-decorators';

export class Person {

  @property(isPositiveNumber)
  age: number = 50;

  @property(hasMinLength(2))
  name: string;

}

function isPositiveNumber(value: number): value is number {
  return value > 0 && isFinite(value) && !isNaN(value);
}

function hasMinLength(length: number) {
  return (value: string): value is string => {
    if (!value || value.length < length) {
      throw new Error(`Expected string with at least ${length} character`);
    }
    return true;
  };
}
