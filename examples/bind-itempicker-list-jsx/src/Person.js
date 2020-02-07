import {property} from 'tabris-decorators';

const NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Thomas',
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Taylor', 'Charlotte', 'Amelia'
];

const FAMILIES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia',
  'Rodriguez','Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore'
];

export class Name {

  /** @type {string} */
  @property given;

  /** @type {string} */
  @property family;

  toString() {
    return `${this.given} ${this.family}`;
  }
}

export class Person {

  /** @type {Name} */
  @property name;

  /** @type {number} */
  @property age;

  /**
   * @param {string} firstName
   * @param {string} lastName
   * @param {number} age
   */
  constructor(firstName, lastName, age) {
    this.name = new Name();
    this.name.given = firstName;
    this.name.family = lastName;
    this.age = age;
  }

}

/**
 * @param {number} num
 * @returns {Person[]}
 */
export function generate(num) {
  const arr = [];
  for (let i = 0; i < num; i++) {
    arr[i] = new Person(
      NAMES[Math.round(Math.random() * (NAMES.length - 1))],
      FAMILIES[Math.round(Math.random() * (FAMILIES.length - 1))],
      Math.round(Math.random() * 100)
    );
  }
  return arr;
}
