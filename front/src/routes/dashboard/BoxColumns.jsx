import Box from './Box';
import cx from 'classnames';
import style from './style.css';
import {
  canBoxStretchInColumn,
  getSectionMobileOrder,
  getSectionWidths,
  isTileStretchBox,
  isValueTileBox
} from '../../utils/dashboardSections';
import { DASHBOARD_SECTION_MOBILE_ORDER } from '../../../../server/utils/constants';

// "rows" phone order: a box wrapped in an item whose CSS order interleaves
// the columns (row y of column c comes at y * columns + c). The wrapper is
// display: contents above the columns breakpoint, so it changes nothing
// there (style.css .mobileOrderItem).
const withMobileOrder = (element, enabled, order, key) =>
  enabled ? (
    <div key={key} class={style.mobileOrderItem} style={`order: ${order}`}>
      {element}
    </div>
  ) : (
    element
  );

const BoxColumns = ({ children, ...props }) => {
  let columnOffset = 0;
  return (
    <div>
      {props.homeDashboard &&
        props.homeDashboard.boxes.map((section, sectionIndex) => {
          const sectionOffset = columnOffset;
          columnOffset += section.columns.length;
          // every column gets its share of the section as a percentage
          // (--column-width): equal shares in a plain section, weight shares
          // in a weighted (e.g. 2|1) one. The stylesheet turns the share
          // into a flex basis with a minimum readable width, so columns
          // that no longer fit wrap instead of crushing their widgets.
          const widths = getSectionWidths(section);
          // Empty columns are editor scaffolding: rendered here they would
          // only reserve blank space — a hole in the middle of the row, and
          // orphan cards pushed out of place once the row wraps. The filled
          // columns share the section on their weights alone. x keeps the
          // column's global index, since box state paths are keyed on it.
          // A section with no filled column maps over nothing, so the 0
          // total weight is never used as a divisor.
          const filledColumns = section.columns
            .map((column, columnIndex) => ({ column, columnIndex }))
            .filter(({ column }) => column.length > 0);
          const totalWeight = filledColumns.reduce((sum, { columnIndex }) => sum + widths[columnIndex], 0);
          const rowsOrder =
            filledColumns.length > 1 && getSectionMobileOrder(section) === DASHBOARD_SECTION_MOBILE_ORDER.ROWS;
          return (
            <div
              key={`section-${sectionIndex}`}
              class={cx('d-flex flex-row flex-wrap justify-content-center align-items-stretch', style.sectionRow, {
                [style.mobileRowsOrder]: rowsOrder
              })}
              data-mobile-order={rowsOrder ? DASHBOARD_SECTION_MOBILE_ORDER.ROWS : undefined}
            >
              {filledColumns.map(({ column, columnIndex }, filledIndex) => {
                const x = sectionOffset + columnIndex;
                return (
                  <div
                    key={`column-${x}`}
                    class={cx('d-flex flex-column', style.dashboardColumn, style.removePadding)}
                    style={`--column-width: ${((widths[columnIndex] / totalWeight) * 100).toFixed(4)}%`}
                  >
                    {column.map((box, y) =>
                      withMobileOrder(
                        canBoxStretchInColumn(box, column, y === column.length - 1) ? (
                          <div
                            key={`${props.homeDashboard.id}-${x}-${y}`}
                            class={cx(style.stretchableBox, {
                              [style.stretchableTile]: isTileStretchBox(box),
                              [style.adaptiveTile]: isValueTileBox(box),
                              // global markers so widgets can adapt their content to
                              // the stretched card from their own stylesheet: media
                              // widgets make their image fill it, tile widgets (the
                              // house view) fit their illustration inside its cap
                              'dashboard-stretched-media': !isTileStretchBox(box),
                              'dashboard-stretched-tile': isTileStretchBox(box)
                            })}
                          >
                            <Box box={box} x={x} y={y} />
                          </div>
                        ) : (
                          <Box key={`${props.homeDashboard.id}-${x}-${y}`} box={box} x={x} y={y} />
                        ),
                        rowsOrder,
                        y * filledColumns.length + filledIndex,
                        `order-${props.homeDashboard.id}-${x}-${y}`
                      )
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
};

export default BoxColumns;
