/* Collapsing the sidebar is a per-device choice, not a per-account one: the
   same user wants the rail expanded on a wide desktop screen and out of the
   way on a wall tablet. It therefore lives in localStorage, like the
   dark-mode preference, and never travels to the server. */
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

/* Until the device has a stored choice, a touch screen narrower than 1200px
   starts with the rail collapsed: that is a tablet in landscape (1024px for
   most wall tablets, up to 1194px for an iPad Pro 11"), where the rail would
   take a quarter of the width and leave a three-column dashboard ~260px
   columns (community topic 11639). A desktop window of the same width keeps
   the rail (a fine pointer), and so does a phone or a tablet in portrait,
   where the rail is an on-demand drawer whatever this says. */
const COLLAPSED_BY_DEFAULT_QUERY = '(max-width: 1199.98px) and (pointer: coarse)';

function isCollapsedByDefault() {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(COLLAPSED_BY_DEFAULT_QUERY).matches;
  } catch (e) {
    return false;
  }
}

function isSidebarCollapsed() {
  try {
    const storedPreference = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (storedPreference === 'true' || storedPreference === 'false') {
      return storedPreference === 'true';
    }
  } catch (e) {}
  return isCollapsedByDefault();
}

function setSidebarCollapsedPreference(collapsed) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
  } catch (e) {}
}

export { SIDEBAR_COLLAPSED_KEY, COLLAPSED_BY_DEFAULT_QUERY, isSidebarCollapsed, setSidebarCollapsedPreference };
