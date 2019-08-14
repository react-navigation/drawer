import { DrawerActionType } from './routers/DrawerActions';
export declare type Route = {
    key: string;
    routeName: string;
};
export declare type Scene = {
    route: Route;
    index: number;
    focused: boolean;
    tintColor?: string;
};
export declare type Navigation = {
    state: {
        key: string;
        index: number;
        routes: Route[];
        isDrawerOpen: boolean;
    };
    openDrawer: () => void;
    closeDrawer: () => void;
    dispatch: (action: {
        type: DrawerActionType;
        key: string;
        willShow?: boolean;
    }) => void;
};
