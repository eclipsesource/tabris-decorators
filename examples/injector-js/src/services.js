const {injector} = require('tabris-decorators');

// One @injectable class, multiple instances

class Service {

  static instanceCounter = 0;

  constructor() {
    this.id = Service.instanceCounter++;
  }

  message() {
    return 'Hello Service ' + this.id;
  }

}

injector.addHandler(Service, () => new Service());
exports.Service = Service;

// One @shared class, one instance

class SharedService {

  static instanceCounter = 0;

  constructor() {
    this.id = SharedService.instanceCounter++;
  }

  sharedMessage() {
    return 'Hello SharedService ' + this.id;
  }

}

injector.register(SharedService, new SharedService());
exports.SharedService = SharedService;

// An @injectable class with a implicitly injectable super-class

class SuperService {

  baseMessage() {
    return 'Hello SuperService';
  }

}

class SpecificService extends SuperService {

  specificMessage() {
    return 'Hello SpecificService';
  }

}

injector.addHandler(SpecificService, () => new SpecificService());
exports.SuperService = SuperService;
exports.SpecificService = SpecificService;

// An @injectable class implementing an abstract class, extending another

class AbstractService {

  abstractMessage() {
    throw new Error('Not implemented');
  }

}

class OtherService {

  baseMessage() {
    return 'Hello OtherService';
  }

}

class CustomService extends OtherService {

  abstractMessage() {
    return this.baseMessage();
  }

}

injector.addHandler(AbstractService, () => new CustomService());
exports.AbstractService = AbstractService;
exports.OtherService = OtherService;
exports.CustomService = CustomService;

// An @injectable class with higher priority than another of the same super-class

class GeneralService {

  message() {
    throw new Error('Not implemented');
  }

}

class HighPriority extends GeneralService {

  message() {
    return 'Hello HighPriority';
  }

}

class LowPriority extends GeneralService {

  message() {
    return 'Hello LowPriority';
  }

}

injector.addHandler({
  targetType: HighPriority,
  handler: () => new HighPriority(),
  priority: 2
});

injector.addHandler({
  targetType: LowPriority,
  handler: () => new LowPriority(),
  priority: 1
});

exports.GeneralService = GeneralService;
exports.HighPriority = HighPriority;
exports.LowPriority = LowPriority;

// An @injectable class for a specific injection parameter

class InternationalService {

  localMessage() {
    throw new Error('Not implemented');
  }

}

class EnglishService extends InternationalService {

  localMessage() {
    return 'Hello EnglishService';
  }

}

class GermanService extends InternationalService {

  localMessage() {
    return 'Hallo GermanService';
  }

}

injector.addHandler(InternationalService, injection => {
  if (injection.param === 'german') {
    return new GermanService();
  } else if (injection.param === 'english') {
    return new EnglishService();
  }
});

exports.InternationalService = InternationalService;
exports.EnglishService = EnglishService;
exports.GeneralService = GeneralService;
