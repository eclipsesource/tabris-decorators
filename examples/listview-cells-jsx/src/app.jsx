import {Button, CheckBox, Color, Composite, contentView, StackLayout, Tab, TabFolder, TextView} from 'tabris';
import {Cell, injector, ItemAction, ListView, property, to} from 'tabris-decorators';

injector.jsxProcessor.unsafeBindings = 'error';

class Item {

  /** @type {string} */
  @property text;

  /** @type {Color} */
  @property color;

}

contentView.append(
  <TabFolder stretch>
    <Tab title='Simple'>
      <ListView stretch items={generate(20)}>
        <Cell padding={8} height={52}>
          <TextView centerY template-text='The color of ${item.text}:' font='24px'/>
          <Composite stretchY left='prev() 24' width={80} bind-background='item.color'/>
        </Cell>
      </ListView>
    </Tab>
    <Tab title='Mixed'>
      <ListView stretch items={generate(20, {mixed: true})}>
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
    <Tab title='Selection' layout={StackLayout.default}>
      <ListView stretch items={generate(20)} onSelect={handleSelection}>
        <Cell selectable padding={8} height={52}>
          <TextView centerY template-text='Tap here to select ${item.text}:' font='24px'/>
        </Cell>
      </ListView>
      <TextView id='output1' padding={12} font='18px'>...</TextView>
    </Tab>
    <Tab title='Actions' layout={StackLayout.default}>
      <ListView stretch items={generate(20)} onSelect={handleAction}>
        <Cell padding={8} height={80}>
          <Button left={0} font='18px' onSelect={ListView.selectPrimary}>Primary</Button>
          <TextView left='prev() 12' right='next() 12' font='18px'
              bind-text='item.text'
              onLongPress={ev => ev.state === 'start' ? ListView.selectSecondary(ev) : null}/>
          <CheckBox right={0} font='18px' onSelect={ListView.selectToggle}>Toggle Action</CheckBox>
        </Cell>
      </ListView>
      <TextView id='output2' padding={12} font='18px'>Hold down on text for secondary action</TextView>
    </Tab>
    <Tab title='Zebra'>
      <ListView stretch items={generate(20)}>
        <Cell padding={8} height={52} onItemIndexChanged={alternateBackground}>
          <TextView centerY bind-text='item.text' font='24px' bind-textColor={toForeground('itemIndex')}/>
        </Cell>
      </ListView>
    </Tab>
  </TabFolder>
);

/** @param {import('tabris-decorators').ListViewSelectEvent<Item>} ev */
function handleSelection(ev) {
  $('#output1').only(TextView).text = 'Selected ' + ev.item.text;
}

/** @param {import('tabris-decorators').ListViewSelectEvent<Item>} ev */
function handleAction(ev) {
  const textView = $('#output2').only(TextView);
  textView.text = ItemAction[ev.action] + ' Action on  ' + ev.item.text;
  const source = ev.originalEvent.target;
  if (source instanceof CheckBox) {
    $('#output2').only(TextView).text += ` (${source.checked})`;
  }
}

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

/** @param {tabris.PropertyChangedEvent<Cell, number>} ev */
function alternateBackground({target, value}) {
  target.background = value % 2 === 0 ? '#fff' : '#ddd';
}

/**
 * @param {string} path
 * @returns {import('tabris-decorators').Binding}
 */
function toForeground(path) {
  return to(path, (index) => index % 2 === 0 ? '#999' : '#000');
}
