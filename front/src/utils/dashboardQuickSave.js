import { getBoxInSections } from './dashboardSections';

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
  const unchanged = expected.every(
    ({ x, y, box }) => JSON.stringify(getBoxInSections(before.boxes, x, y)) === JSON.stringify(box)
  );
  if (!unchanged) {
    throw new DashboardChangedError();
  }
  const after = await httpClient.patch(`/api/v1/dashboard/${selector}`, { boxes: change(before.boxes) });
  return { before, after };
};

/**
 * @description Puts the widgets of a dashboard back as they were (the Undo of an in-place change).
 * @param {object} httpClient - The HTTP client.
 * @param {string} selector - The dashboard selector.
 * @param {Array} boxes - The sections to restore.
 * @returns {Promise<object>} The dashboard as saved.
 * @example restoreDashboardWidgets(httpClient, 'home', before.boxes);
 */
const restoreDashboardWidgets = (httpClient, selector, boxes) =>
  httpClient.patch(`/api/v1/dashboard/${selector}`, { boxes });

export { DashboardChangedError, updateDashboardWidgets, restoreDashboardWidgets };
