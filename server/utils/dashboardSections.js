/**
 * @description Normalize dashboard boxes to the section-based shape.
 * Dashboards historically stored an array of columns (each column being an
 * array of boxes). The current shape is an array of sections, each section
 * holding its own columns: [{ columns: [[box]] }]. A legacy value is wrapped
 * into a single section so existing dashboards keep working unchanged.
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
  return boxes;
}

module.exports = {
  normalizeDashboardBoxes,
};
