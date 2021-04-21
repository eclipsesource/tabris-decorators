import {injectable, shared} from 'tabris-decorators';

// One @injectable class, multiple instances

@injectable
export class Service {

  private static instanceCounter = 0;

  private id: number;

  constructor() {
    this.id = Service.instanceCounter++;
  }

  message() {
    return 'Hello Service ' + this.id;
  }

}

// One @shared class, one instance
// same as @injectable({shared: true})

@shared
export class SharedService {

  private static instanceCounter = 0;

  private id: number;

  constructor() {
    this.id = SharedService.instanceCounter++;
  }

  sharedMessage() {
    return 'Hello SharedService ' + this.id;
  }

}

// An @injectable class with a implicitly injectable super-class

export class SuperService {

  baseMessage() {
    return 'Hello SuperService';
  }

}

@injectable
export class SpecificService extends SuperService {

  specificMessage() {
    return 'Hello SpecificService';
  }

}

// An @injectable class implementing an abstract class, extending another

export abstract class AbstractService {

  abstract abstractMessage(): string;

}

export class OtherService {

  baseMessage() {
    return 'Hello OtherService';
  }

}

@injectable({implements: AbstractService})
export class CustomService extends OtherService implements AbstractService {

  abstractMessage() {
    return this.baseMessage();
  }

}

// An @injectable class with higher priority than another of the same super-class

export abstract class GeneralService {

  abstract message(): string;

}

@injectable({priority: 2})
export class HighPriority extends GeneralService {

  message() {
    return 'Hello HighPriority';
  }

}

@injectable({priority: 1})
export class LowPriority extends GeneralService {

  message() {
    return 'Hello LowPriority';
  }

}

// An @injectable class for a specific injection parameter

export abstract class InternationalService {

  abstract localMessage(): string;

}

@injectable({param: 'english'})
export class EnglishService extends InternationalService {

  localMessage() {
    return 'Hello EnglishService';
  }

}

@injectable({param: 'german'})
export class GermanService extends InternationalService {

  localMessage() {
    return 'Hallo GermanService';
  }

}
