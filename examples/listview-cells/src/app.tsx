import { Color, Composite, contentView, TextView } from 'tabris';
import { Cell, ListView, property } from 'tabris-decorators';

class Item {
  @property public text: string;
  @property public color: Color;
}

contentView.append(
  <ListView stretch items={Array.from(generate(20))}>
    <Cell padding={8}>
      <TextView centerY template-text='The color of ${item.text}:' font='24px'/>
      <Composite left='prev() 24' width={64} height={64} bind-background='item.color'/>
    </Cell>
  </ListView>
);

function generate(num: number): Item[] {
  let count = 0;
  const arr: Item[] = [];
  for (let i = 0; i < num; i++) {
    arr[i] = new Item();
    arr[i].text = 'Item ' + count++;
    arr[i].color = Color.from([Math.random() * 255, Math.random() * 255, Math.random() * 255]);
  }
  return arr;
}
