import { DrawerActions } from "@react-navigation/native";

export const openAppDrawer = (navigation) => {
  let parent = navigation.getParent?.();

  while (parent) {
    if (parent.openDrawer) {
      parent.openDrawer();
      return;
    }

    parent = parent.getParent?.();
  }

  navigation.dispatch(DrawerActions.openDrawer());
};
