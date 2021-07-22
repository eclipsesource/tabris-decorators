const {ObservableData} = require('tabris');
const {Button, CheckBox, Color, Composite, contentView, StackLayout, Tab, TabFolder, TextView, Set} = require('tabris');
const {Cell, ItemAction, ListView} = require('tabris-decorators');

class Item extends ObservableData {

  constructor() {
    super();
    /** @type {string} */
    this.text = '';
    /** @type {Color} */
    this.color = null;
    /** @type {boolean} */
    this.selected = false;
  }

}

contentView.append(
  TabFolder({
    layoutData: 'stretch', children: [

      Tab({
        title: 'Simple', children: [
          ListView({
            layoutData: 'stretch',
            cellHeight: 52,
            items: generate(20),
            createCell: () =>
              Cell({
                padding: 8,
                children: [
                  TextView({centerY: true, font: '24px'}),
                  Composite({
                    id: 'color',
                    layoutData: 'stretchY',
                    left: 'prev() 24',
                    width: 80
                  })
                ],
                apply: ({item}) => [
                  Set(TextView, {
                    text: item ? `The color of ${item.text}` : ''
                  }),
                  Set(Composite, '#color', {
                    background: item ? item.color : 'transparent'
                  })
                ]
              })
          })
        ]
      }),

      Tab({
        title: 'Selection', layout: StackLayout.default, children: [
          ListView({
            layoutData: 'stretch',
            items: generate(20),
            onSelect: ev => {
              $('#output1').only(TextView).text = 'Selected ' + ev.item.text;
              ev.item.selected = !ev.item.selected;
            },
            cellHeight: 52,
            createCell: () =>
              Cell({
                padding: 8,
                highlightOnTouch: true,
                onTap: ListView.select,
                children: [TextView({centerY: true, font: '24px'})],
                apply: ({item}) =>
                  Set(TextView, {
                    text: item instanceof Item ? `Tap here to select ${item.text}:` : '',
                    background: item instanceof Item && item.selected ? Color.aqua : null
                  })
              })
          }),
          TextView({id: 'output1', padding: 12, font: '18px', text: '...'})
        ]
      }),

      Tab({
        title: 'Actions', layout: StackLayout.default, children: [
          ListView({
            layoutData: 'stretch',
            items: generate(20),
            onSelect: ev => {
              const textView = $('#output2').only(TextView);
              textView.text = ItemAction[ev.action] + ' Action on  ' + ev.item.text;
              const source = ev.originalEvent.target;
              if (source instanceof CheckBox) {
                $('#output2').only(TextView).text += ` (${source.checked})`;
                ev.item.selected = !ev.item.selected;
              }
            },
            cellHeight: 80,
            createCell: () =>
              Cell({
                padding: 8,
                children: [
                  Button({
                    left: 0,
                    font: '18px',
                    onSelect: ListView.selectPrimary,
                    text: 'Primary'
                  }),
                  TextView({
                    id: 'label',
                    left: 'prev() 12',
                    right: 'next() 12',
                    font: '18px',
                    onLongPress: ev => ev.state === 'start' ? ListView.selectSecondary(ev) : null
                  }),
                  CheckBox({
                    right: 0,
                    font: '18px',
                    onSelect: ListView.selectToggle,
                    text: 'Toggle Action'
                  })
                ],
                apply: ({item}) => [
                  Set(TextView, {
                    text: item instanceof Item ? item?.text : ''
                  }),
                  Set(CheckBox, {
                    checked: item instanceof Item && item.selected
                  })
                ]
              })
          }),
          TextView({
            id: 'output2',
            padding: 12,
            font: '18px',
            text: 'Hold down on text for secondary action'
          })
        ]
      }),

      Tab({title: 'Zebra', children: [
        ListView({
          layoutData: 'stretch',
          items: generate(20),
          cellHeight: 52,
          createCell: () =>
            Cell({
              padding: 8,
              onItemIndexChanged: ({target, value}) => {
                target.background = value % 2 === 0 ? '#fff' : '#ddd';
              },
              children: [
                TextView({centerY: true, font: '24px'})
              ],
              apply: ({item, itemIndex}) => [
                Set(Cell, ':host', {
                  background: itemIndex % 2 === 0 ? '#fff' : '#ddd'
                }),
                Set(TextView, {
                  text: item instanceof Item ? item.text : '',
                  textColor: itemIndex % 2 === 0 ? '#999' : '#000'
                })
              ]
            })
        })
      ]})

    ]
  })

);

/**
 * @param {number} num
 * @param {{mixed: boolean}} options
 * @returns {Array<Item|string>}
 */
function generate(num, options = null) {
  let count = 0;
  /** @type {Array<Item|string>} */
  const arr = [];
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
