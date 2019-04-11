import * as React from 'react';
import { View } from 'react-native';
import renderer from 'react-test-renderer';
import { createAppContainer } from '@react-navigation/native';

import createDrawerNavigator from '../createDrawerNavigator';

class HomeScreen extends React.Component {
  static navigationOptions = ({ navigation }: any) => ({
    title: `Welcome ${
      navigation.state.params ? navigation.state.params.user : 'anonymous'
    }`,
    gesturesEnabled: true,
  });

  render() {
    return <View style={{ flex: 1 }} />;
  }
}

it('renders successfully', () => {
  const MyDrawerNavigator = createDrawerNavigator({ Home: HomeScreen });
  const App = createAppContainer(MyDrawerNavigator);
  const rendered = renderer.create(<App />).toJSON();

  expect(rendered).toMatchInlineSnapshot(`null`);
});
