import { MenuId } from '../types';

let navigationState: any = null;

export const navigateToMenu = (menuId: MenuId, state?: any) => {
  if (state) {
    navigationState = state;
  }
  window.dispatchEvent(new CustomEvent('app:navigate', { detail: menuId }));
};

export const consumeNavigationState = () => {
  const state = navigationState;
  navigationState = null;
  return state;
};
