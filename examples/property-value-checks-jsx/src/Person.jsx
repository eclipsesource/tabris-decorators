import { property } from 'tabris-decorators';

export class Person {

  /** @type {number} */
  @property(isPositiveNumber)
  age = 50;

  /** @type {string} */
  @property(hasMinLength(2))
  name;

}

/**
 * @param {any} value
 * @returns value is number
 */
function isPositiveNumber(value) {
  return value > 0 && isFinite(value) && !isNaN(value);
}

/**
 * @param {number} length
 * @returns (value: any) => value is string
 */
function hasMinLength(length) {
  return value => {
    if (!value || value.length < length) {
      throw new Error(`Expected string with at least ${length} character`);
    }
    return true;
  };
}
