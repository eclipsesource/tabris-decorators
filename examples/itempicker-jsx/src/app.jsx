import {contentView, Stack, TextView} from 'tabris';
import {ItemPicker, List, property} from 'tabris-decorators';

class Item {

  /** @type {string} */
  @property name;

  /** @type {string} */
  @property id;

  /**
   * @param {string} name
   * @param {string} id
   */
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }

  toString() {
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

/** @param {import('tabris-decorators').ItemPickerSelectEvent<Item | string>} ev */
function handleSelection({item, itemIndex}) {
  $('#output').only(TextView).text = typeof item === 'string' ? `person#${itemIndex}` : item.id;
}

/**
 * @returns {List<Item>}
 */
function generateItemInstances() {
  return List.from([
    new Item('David', 'person#6'),
    new Item('Alexander', 'person#7'),
    new Item('Mary', 'person#8')
  ]);
}
