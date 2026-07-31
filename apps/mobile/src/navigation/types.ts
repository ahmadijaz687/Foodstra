import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  Restaurant: { restaurantId: string; name: string };
  OrderDetail: { orderId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
