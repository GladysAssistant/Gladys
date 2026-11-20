import { setSidebarCollapsedPreference } from '../utils/sidebarPreference';

function createActionsSidebar() {
  const actions = {
    // Expanded rail ⇄ collapsed, at desktop widths (below them the rail is
    // an on-demand drawer whatever this says). Both are resting states:
    // expanded is the docked rail with the content beside it, never an
    // overlay.
    toggleSidebarCollapsed(state) {
      const sidebarCollapsed = !state.sidebarCollapsed;
      setSidebarCollapsedPreference(sidebarCollapsed);
      return {
        sidebarCollapsed,
        // the button sits inside the footer dropdown's own container, so the
        // click-outside handler never sees it: close the dropup here, or it
        // would ride the rail off-screen still open
        showDropDown: false
      };
    }
  };

  return actions;
}

export default createActionsSidebar;
