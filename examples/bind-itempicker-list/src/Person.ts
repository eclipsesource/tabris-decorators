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
  @property given: string;
  @property family: string;
  toString() {
    return `${this.given} ${this.family}`;
  }
}

export class Person {

  @property name: Name;
  @property age: number;

  constructor(firstName: string, lastName: string, age: number) {
    this.name = new Name();
    this.name.given = firstName;
    this.name.family = lastName;
    this.age = age;
  }

}

export function generate(num: number): Person[] {
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
