const {contentView, Stack, TextView} = require('tabris');
const {ItemPicker, List} = require('tabris-decorators');

class Item {

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
  Stack({padding: 16, width: 200, children: [
    ItemPicker({
      layoutData: 'stretchX',
      selection: 'Peter',
      onItemSelect: handleSelection,
      items: ['John', 'Peter', 'Susan']
    }),
    ItemPicker({
      layoutData: 'stretchX',
      textSource: 'name',
      onItemSelect: handleSelection,
      items: [
        {name: 'Paul', id: 'person#3'},
        {name: 'Amanda', id: 'person#4'},
        {name: 'Jessica', id: 'person#5'}
      ]
    }),
    ItemPicker({
      layoutData: 'stretchX',
      selectionIndex: 2,
      onItemSelect: handleSelection,
      items: generateItemInstances()
    }),
    TextView({
      id: 'output',
      padding: 12,
      font: '18px',
      text: '...'
    })
  ]})
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
