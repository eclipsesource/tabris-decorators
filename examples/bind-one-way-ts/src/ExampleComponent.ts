import {asFactory, Composite, ObservableData, ProgressBar, Properties, Setter, Stack, TextView} from 'tabris';
import {bind, component, prop, property} from 'tabris-decorators';

export class OtherModel extends ObservableData {
  someString: string = 'Hello World';
}

export class Model {
  @property({observe: true}) otherModel: OtherModel = new OtherModel();
  @prop someNumber: number = 10;
}

namespace internal {

  @component
  export class ExampleComponent extends Composite {

    @bind('>> #text1.text')
    myText: string;

    @bind('>> ProgressBar.selection', (obj: Model) => obj?.someNumber)
    @bind('>> #text2.text', (obj: Model) => obj?.otherModel?.someString)
    myObject: Model;

    constructor(properties: Properties<ExampleComponent>) {
      super();
      this.set(properties);
      this.append(
        Stack({
          spacing: 12,
          padding: 12,
          apply: Setter(TextView, {font: {size: 21}}),
          children: [
            TextView({text: 'Binding to a component property'}),
            TextView({id: 'text1', text: 'Placeholder', background: 'yellow'}),
            TextView({text: 'Binding to an object property:'}),
            ProgressBar({width: 200}),
            TextView({text: 'Binding to a nested object property:'}),
            TextView({id: 'text2', text: 'Placeholder', background: 'yellow'})
          ]
        })
      );
    }

  }

}

export const ExampleComponent = asFactory(internal.ExampleComponent);
