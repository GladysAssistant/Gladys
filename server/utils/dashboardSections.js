const { DASHBOARD_SECTION_MOBILE_ORDER } = require('./constants');

// A column width is a small integer weight (1 = normal, 2 = wide), not a
// free ratio: the editor only toggles between these two values.
const DEFAULT_COLUMN_WIDTH = 1;
const MAX_COLUMN_WIDTH = 2;

/**
 * @description Normalize the optional widths array of a section.
 * Widths are per-column integer weights; the canonical form has exactly one
 * weight per column and is absent when every column has the default weight,
 * so equal-width sections all share a single representation.
 * @param {object} section - A section in the { columns, widths } shape.
 * @returns {object} The section with widths aligned to columns, or unchanged.
 * @example
 * normalizeSectionWidths({ columns: [[], []], widths: [2] });
 * // => { columns: [[], []], widths: [2, 1] }
 */
function normalizeSectionWidths(section) {
  const { columns, widths } = section;
  if (!Array.isArray(widths) || !Array.isArray(columns)) {
    return section;
  }
  const aligned = columns.map((column, i) => (typeof widths[i] === 'number' ? widths[i] : DEFAULT_COLUMN_WIDTH));
  if (aligned.every((width) => width === DEFAULT_COLUMN_WIDTH)) {
    const { widths: droppedWidths, ...rest } = section;
    return rest;
  }
  // keep the original reference only when nothing actually changed: a hole in
  // the middle ([2, null]) keeps the length but still has to be padded, so
  // comparing lengths alone would let a malformed value reach validation
  const isUnchanged = aligned.length === widths.length && aligned.every((width, i) => width === widths[i]);
  if (isUnchanged) {
    return section;
  }
  return { ...section, widths: aligned };
}

/**
 * @description Normalize the optional phone order of a section.
 * Column by column is the default order: like default widths, its canonical
 * form is the key absent, so a section has a single representation whether
 * the client sent the default explicitly or not.
 * @param {object} section - A section in the { columns, mobile_order } shape.
 * @returns {object} The section without a default mobile_order, or unchanged.
 * @example
 * normalizeSectionMobileOrder({ columns: [[]], mobile_order: 'columns' });
 * // => { columns: [[]] }
 */
function normalizeSectionMobileOrder(section) {
  if (section.mobile_order !== DASHBOARD_SECTION_MOBILE_ORDER.COLUMNS) {
    return section;
  }
  const { mobile_order: droppedMobileOrder, ...rest } = section;
  return rest;
}

/**
 * @description Normalize dashboard boxes to the section-based shape.
 * Dashboards historically stored an array of columns (each column being an
 * array of boxes). The current shape is an array of sections, each section
 * holding its own columns: [{ columns: [[box]] }]. A legacy value is wrapped
 * into a single section so existing dashboards keep working unchanged.
 * A section may carry a widths array (one weight per column); it is aligned
 * to the columns and dropped when every column has the default weight. A
 * default phone order (mobile_order: 'columns') is dropped too.
 * @param {Array} boxes - Dashboard boxes, in legacy or section shape.
 * @returns {Array} Boxes in section shape.
 * @example
 * normalizeDashboardBoxes([[{ type: 'weather' }]]);
 * // => [{ columns: [[{ type: 'weather' }]] }]
 */
function normalizeDashboardBoxes(boxes) {
  if (!Array.isArray(boxes) || boxes.length === 0) {
    return boxes;
  }
  const isLegacyShape = boxes.every((item) => Array.isArray(item));
  if (isLegacyShape) {
    return [{ columns: boxes }];
  }
  const normalized = boxes.map((section) =>
    section && typeof section === 'object' ? normalizeSectionMobileOrder(normalizeSectionWidths(section)) : section,
  );
  // keep the original reference when nothing changed, so unchanged values
  // stay strictly equal for callers (and Sequelize change detection)
  const hasChanged = normalized.some((section, i) => section !== boxes[i]);
  return hasChanged ? normalized : boxes;
}

module.exports = {
  normalizeDashboardBoxes,
  DEFAULT_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
};
