import React from 'react';
import { Button, ScrollView } from 'react-native';
import {
  createStackNavigator,
  NavigationStackScreenComponent,
  NavigationStackProp,
} from 'react-navigation-stack';
import { Themed, SafeAreaView } from 'react-navigation';
import {
  createDrawerNavigator,
  NavigationDrawerScreenComponent,
} from 'react-navigation-drawer';
import { MaterialIcons } from '@expo/vector-icons';

const SampleText = ({ children }: { children: React.ReactNode }) => (
  <Themed.Text>{children}</Themed.Text>
);

const MyNavScreen = ({
  navigation,
  banner,
}: {
  navigation: NavigationStackProp;
  banner: string;
}) => (
  <ScrollView>
    <SafeAreaView forceInset={{ top: 'always' }}>
      <SampleText>{banner}</SampleText>
      <Button onPress={() => navigation.openDrawer()} title="Open drawer" />
      <Button
        onPress={() => navigation.navigate('Email')}
        title="Open other screen"
      />
      <Button onPress={() => navigation.navigate('Home')} title="Go back" />
    </SafeAreaView>
    <Themed.StatusBar />
  </ScrollView>
);

const InboxScreen: NavigationStackScreenComponent = ({ navigation }) => (
  <MyNavScreen banner="Inbox Screen" navigation={navigation} />
);
InboxScreen.navigationOptions = {
  headerTitle: 'Inbox',
};

const EmailScreen: NavigationStackScreenComponent = ({ navigation }) => (
  <MyNavScreen banner="Email Screen" navigation={navigation} />
);

const DraftsScreen: NavigationStackScreenComponent = ({ navigation }) => (
  <MyNavScreen banner="Drafts Screen" navigation={navigation} />
);

DraftsScreen.navigationOptions = {
  headerTitle: 'Drafts',
};

const InboxStack: NavigationDrawerScreenComponent = createStackNavigator({
  Inbox: { screen: InboxScreen },
  Email: { screen: EmailScreen },
});

InboxStack.navigationOptions = {
  drawerLabel: 'Inbox',
  drawerIcon: ({ tintColor }) => (
    <MaterialIcons
      name="move-to-inbox"
      size={24}
      style={{ color: tintColor }}
    />
  ),
};

const DraftsStack: NavigationDrawerScreenComponent = createStackNavigator({
  Drafts: { screen: DraftsScreen },
  Email: { screen: EmailScreen },
});

DraftsStack.navigationOptions = {
  drawerLabel: 'Drafts',
  drawerIcon: ({ tintColor }) => (
    <MaterialIcons name="drafts" size={24} style={{ color: tintColor }} />
  ),
};

const DrawerExample = createDrawerNavigator(
  {
    Inbox: {
      path: '/',
      screen: InboxStack,
    },
    Drafts: {
      path: '/sent',
      screen: DraftsStack,
    },
  },
  {
    drawerBackgroundColor: {
      light: '#eee',
      dark: 'rgba(40,40,40,1)',
    },
    initialRouteName: 'Drafts',
    contentOptions: {
      activeTintColor: '#e91e63',
    },
    drawerType: 'back',
    overlayColor: '#00000000',
    hideStatusBar: true,
  }
);

DrawerExample.navigationOptions = {
  header: null,
};

export default DrawerExample;
