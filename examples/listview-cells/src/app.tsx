import { Color, Composite, contentView, Tab, TabFolder, TextView } from 'tabris';
import { Cell, ListView, property } from 'tabris-decorators';

class Item {
  @property public text: string;
  @property public color: Color;
}

contentView.append(
  <TabFolder stretch>
    <Tab title='Simple'>
      <ListView stretch items={Array.from(generate(20))}>
        <Cell padding={8} height={52}>
          <TextView centerY template-text='The color of ${item.text}:' font='24px'/>
          <Composite  stretchY left='prev() 24' width={80} bind-background='item.color'/>
        </Cell>
      </ListView>
    </Tab>
    <Tab title='Mixed'>
      <ListView stretch items={Array.from(generate(20, {mixed: true}))}>
        <Cell itemType='string' height={56} padding={8}>
          <TextView font={{size: 32, style: 'italic'}} bind-text='item'/>
        </Cell>
        <Cell itemType={Item} height={40} padding={8}>
          <TextView font='20px'
              bind-textColor='item.color'
              template-text='This is Item ${item.text}'/>
        </Cell>
      </ListView>
    </Tab>
  </TabFolder>
);

function generate(num: number, options: {mixed: boolean} = null): Array<Item|string> {
  let count = 0;
  const arr: Array<Item|string> = [];
  for (let i = 0; i < num; i++) {
    if (options && options.mixed && (i % 10 === 0)) {
      arr[i] = 'Section ' + ((i / 10) + 1);
    } else {
      const item = new Item();
      item.text = 'Item ' + ++count;
      item.color = Color.from([Math.random() * 255, Math.random() * 255, Math.random() * 255]);
      arr[i] = item;
    }
  }
  return arr;
}
