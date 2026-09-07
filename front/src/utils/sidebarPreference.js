/* Collapsing the sidebar is a per-device choice, not a per-account one: the
   same user wants the rail expanded on a wide desktop screen and out of the
   way on a wall tablet. It therefore lives in localStorage, like the
   dark-mode preference, and never travels to the server. */
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

function isSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function setSidebarCollapsedPreference(collapsed) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
  } catch (e) {}
}

export { SIDEBAR_COLLAPSED_KEY, isSidebarCollapsed, setSidebarCollapsedPreference };
