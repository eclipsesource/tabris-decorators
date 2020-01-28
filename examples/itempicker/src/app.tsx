import { contentView, Stack, TextView } from 'tabris';
import { injector, ItemPicker, ItemPickerSelectEvent, List } from 'tabris-decorators';

injector.jsxProcessor.strictMode = true;

class Item {

  constructor(
    public name: string,
    public id: string
  ) { }

  public toString() {
    return this.name;
  }

}

contentView.append(
  <Stack padding={16} width={200}>
    <ItemPicker stretchX selection='Peter' onItemSelect={handleSelection}>
      John,
      Peter,
      Susan
    </ItemPicker>
    <ItemPicker stretchX textSource='name' onItemSelect={handleSelection}>
      {[
        {name: 'Paul', id: 'person#3'},
        {name: 'Amanda', id: 'person#4'},
        {name: 'Jessica', id: 'person#5'}
      ]}
    </ItemPicker>
    <ItemPicker stretchX
        items={generateItemInstances()}
        selectionIndex={2}
        onItemSelect={handleSelection}/>
    <TextView id='output' padding={12} font='18px'>...</TextView>
  </Stack>
);

function handleSelection({item, itemIndex}: ItemPickerSelectEvent<Item | string>) {
  $('#output').only(TextView).text = typeof item === 'string' ? `person#${itemIndex}` : item.id;
}

function generateItemInstances(): List<Item> {
  return List.from([
    new Item('David', 'person#6'),
    new Item('Alexander', 'person#7'),
    new Item('Mary', 'person#8')
  ]);
}
