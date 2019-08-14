/**
 * TouchableItem renders a touchable that looks native on both iOS and Android.
 *
 * It provides an abstraction on top of TouchableNativeFeedback and
 * TouchableOpacity.
 *
 * On iOS you can pass the props of TouchableOpacity, on Android pass the props
 * of TouchableNativeFeedback.
 */
import * as React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
declare type Props = React.ComponentProps<typeof TouchableWithoutFeedback> & {
    pressColor: string;
    borderless: boolean;
};
export default class TouchableItem extends React.Component<Props> {
    static defaultProps: {
        borderless: boolean;
        pressColor: string;
    };
    render(): JSX.Element;
}
export {};
