import { getBoxInSections } from './dashboardSections';

// Widgets compared by content, whatever the order of their keys: the dashboard as the PATCH
// returned it and as a later GET returns it are the same widgets
const sameContent = (a, b) => {
  const stable = value => {
    if (Array.isArray(value)) {
      return value.map(stable);
    }
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((sorted, key) => ({ ...sorted, [key]: stable(value[key]) }), {});
    }
    return value;
  };
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
};

/**
 * @description Thrown when a widget the change is about is no longer the one the page showed: the
 * dashboard was edited elsewhere (another phone, the editor in another tab) since it was loaded.
 */
class DashboardChangedError extends Error {
  constructor() {
    super('DASHBOARD_CHANGED');
    this.name = 'DashboardChangedError';
  }
}

/**
 * @description Applies a change to the widgets of a saved dashboard, from the dashboard itself
 * (docs/specs/dashboard-flexible-layout-and-widgets.md, A.3.2): no editor, no Save button. The
 * dashboard is read again first, so what is changed is the dashboard as saved now and not the copy
 * the page loaded a while ago; if a widget the change is about is not there as the page showed it,
 * nothing is saved (DashboardChangedError) — the user reloads rather than overwriting someone
 * else's edit. Only `boxes` is sent: the name, the icon and the other settings are not touched.
 * @param {object} httpClient - The HTTP client.
 * @param {string} selector - The dashboard selector.
 * @param {Function} change - Gets the saved sections, returns the new ones (never mutating them).
 * @param {Array} expected - The widgets the change is about, as the page showed them: { x, y, box }.
 * @returns {Promise<object>} { before, after }: the dashboard before the change (for Undo), and as saved.
 * @example updateDashboardWidgets(httpClient, 'home', sections => sections, []);
 */
const updateDashboardWidgets = async (httpClient, selector, change, expected = []) => {
  const before = await httpClient.get(`/api/v1/dashboard/${selector}`);
  const unchanged = expected.every(({ x, y, box }) => sameContent(getBoxInSections(before.boxes, x, y), box));
  if (!unchanged) {
    throw new DashboardChangedError();
  }
  const after = await httpClient.patch(`/api/v1/dashboard/${selector}`, { boxes: change(before.boxes) });
  return { before, after };
};

/**
 * @description Puts the widgets of a dashboard back as they were (the Undo of an in-place change).
 * The dashboard is read again first: if its widgets are no longer the ones the change saved — it
 * was edited since, here or elsewhere — nothing is written (DashboardChangedError), so Undo never
 * erases a later change.
 * @param {object} httpClient - The HTTP client.
 * @param {string} selector - The dashboard selector.
 * @param {Array} boxes - The sections to restore.
 * @param {Array} savedBoxes - The sections the change saved, which must still be the current ones.
 * @returns {Promise<object>} The dashboard as saved.
 * @example restoreDashboardWidgets(httpClient, 'home', before.boxes, after.boxes);
 */
const restoreDashboardWidgets = async (httpClient, selector, boxes, savedBoxes) => {
  const current = await httpClient.get(`/api/v1/dashboard/${selector}`);
  if (savedBoxes && !sameContent(current.boxes, savedBoxes)) {
    throw new DashboardChangedError();
  }
  return httpClient.patch(`/api/v1/dashboard/${selector}`, { boxes });
};

export { DashboardChangedError, updateDashboardWidgets, restoreDashboardWidgets };
