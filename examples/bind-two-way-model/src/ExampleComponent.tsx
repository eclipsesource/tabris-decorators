import {Apply, Color, Composite, Listeners, Properties, Slider, Stack, TextInput, TextView} from 'tabris';
import {bindAll, component, event, property} from 'tabris-decorators';

export class Model {
  @property myText: string;
  @property myNumber: number;
  @property myColor: Color;
  @event onBlink: Listeners<{target: Model}>;
}

@component
export class ExampleComponent extends Composite {

  @bindAll<Model>({
    myText: '#inputId.text',
    myNumber: ['Slider.selection', '>> #num.text'],
    myColor: '>> :host.background',
    onBlink(this: ExampleComponent) {
      this._find(Stack).only()
        .set({opacity: 0})
        .animate({opacity: 1}, {duration: 400})
        .catch(ex => console.log(ex));
    }
  })
  model: Model;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>
        <Apply target={TextView} attr={{font: {size: 21}}}/>
        <TextView>Two-way binding to "myText":</TextView>
        <TextInput id='inputId' width={200} text='Fallback Text'/>
        <TextView>Two-way binding to "myNumber":</TextView>
        <Slider width={200}/>
        <TextView>One-way binding to "myNumber":</TextView>
        <TextView id='num'/>
      </Stack>
    );
  }

}
