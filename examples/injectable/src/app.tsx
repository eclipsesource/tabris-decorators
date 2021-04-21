import {contentView, TextView} from 'tabris';
import {inject, injectable, resolve} from 'tabris-decorators';
import * as services from './services';

@injectable
class App {

  @inject service1: services.Service;
  @inject service2: services.Service;
  @inject sharedService1: services.SharedService;
  @inject sharedService2: services.SharedService;
  @inject superService: services.SuperService;
  @inject abstractService: services.AbstractService;
  @inject generalService: services.GeneralService;
  @inject lowPriorityService: services.LowPriority;
  @inject('english') englishService: services.InternationalService;
  @inject('german') germanService: services.InternationalService;

  start() {
    contentView.append(
      <TextView padding={12} lineSpacing={2} markupEnabled>
        service1: {this.service1.message()}<br/>
        service2: {this.service2.message()}<br/>
        sharedService1: {this.sharedService1.sharedMessage()}<br/>
        sharedService2: {this.sharedService2.sharedMessage()}<br/>
        superService: {this.superService.baseMessage()}<br/>
        abstractService: {this.abstractService.abstractMessage()}<br/>
        generalService: {this.generalService.message()}<br/>
        lowPriorityService: {this.lowPriorityService.message()}<br/>
        englishService: {this.englishService.localMessage()}<br/>
        germanService: {this.germanService.localMessage()}<br/>
      </TextView>
    );
  }

}

resolve(App).start();
