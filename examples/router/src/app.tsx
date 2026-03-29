import {NavigationView, contentView, Button, TextView, TextInput, Stack, Page, Properties} from 'tabris';
import {Router, Route, injectable, create, resolve, property, component } from 'tabris-decorators';

const navigationView = new NavigationView({
  layoutData: 'stretch'
}).appendTo(contentView);

class MyPage1 extends Page {
  constructor(properties?: Properties<MyPage1>) {
    super(properties);
    this.append(
      <Stack stretch alignment="stretchX" padding={[0, 4]}>
        <TextInput/>
        <Button text="Open" onSelect={() =>
          router.goTo({
            route: 'MyRoute2',
            payload: {
              text: this.find(TextInput).only().text
            }
          })}
        />
      </Stack>
    );
  }
}

@component
class MyPage2 extends Page {
  @property text: string;

  constructor(properties?: Properties<MyPage2>) {
    super(properties);
    this.append(
      <Stack stretch alignment="stretchX" padding={[0, 4]}>
        <TextView alignment="centerX" height={32} bind-text="text"/>
        <Button text="Go back" onSelect={() => router.back()}/>
        <TextInput bind-text="text" />
        <Button text="Open" onSelect={() =>
          router.goTo({
            route: 'MyRoute2',
            payload: {
              text: this._find(TextInput).only().text
            }
          })}
        />
      </Stack>
    );
  }
}

@injectable({ param: 'MyRoute1' })
class MyRoute1 extends Route {
  page = new MyPage1({title: 'foo'});
};

@injectable({ param: 'MyRoute2' })
class MyRoute2 extends Route {
  page = new MyPage2({title: 'bar'});
};

const router = new Router({
  navigationView,
  history: [{ route: 'MyRoute1' }]
});
