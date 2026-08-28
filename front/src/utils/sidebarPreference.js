/* Drawer mode is a per-device choice, not a per-account one: the same user
   wants the rail docked on a wide desktop screen and out of the way on a
   wall tablet. It therefore lives in localStorage, like the dark-mode
   preference, and never travels to the server. */
const SIDEBAR_DRAWER_MODE_KEY = 'sidebar-drawer-mode';

function isSidebarDrawerModeEnabled() {
  try {
    return localStorage.getItem(SIDEBAR_DRAWER_MODE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function setSidebarDrawerModePreference(enabled) {
  try {
    localStorage.setItem(SIDEBAR_DRAWER_MODE_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}

export { SIDEBAR_DRAWER_MODE_KEY, isSidebarDrawerModeEnabled, setSidebarDrawerModePreference };
