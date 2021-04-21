const {contentView, TextView} = require('tabris');
const {injector} = require('tabris-decorators');
const services = require('./services');

class App {

  /** @param {import('tabris-decorators').Injector} injector*/
  constructor({resolve}) {
    this.service1 = resolve(services.Service);
    this.service2 = resolve(services.Service);
    this.sharedService1 = resolve(services.SharedService);
    this.sharedService2 = resolve(services.SharedService);
    this.superService = resolve(services.SuperService);
    this.abstractService = resolve(services.AbstractService);
    this.generalService = resolve(services.GeneralService);
    this.lowPriorityService = resolve(services.LowPriority);
    this.englishService = resolve(services.InternationalService, 'english');
    this.germanService = resolve(services.InternationalService, 'german');
  }

  start() {
    contentView.append(
      TextView({padding: 12, lineSpacing: 2, markupEnabled: true, text: `
        service1: ${this.service1.message()}<br/>
        service2: ${this.service2.message()}<br/>
        sharedService1: ${this.sharedService1.sharedMessage()}<br/>
        sharedService2: ${this.sharedService2.sharedMessage()}<br/>
        superService: ${this.superService.baseMessage()}<br/>
        abstractService: ${this.abstractService.abstractMessage()}<br/>
        generalService: ${this.generalService.message()}<br/>
        lowPriorityService: ${this.lowPriorityService.message()}<br/>
        englishService: ${this.englishService.localMessage()}<br/>
        germanService: ${this.germanService.localMessage()}<br/>`
      })
    );
  }

}

injector.addHandler(App, injection => new App(injection.injector));

injector.resolve(App).start();
