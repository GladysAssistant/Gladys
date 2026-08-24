import Box from './Box';
import cx from 'classnames';
import style from './style.css';
import { canBoxStretchAt, getSectionWidths, isTileStretchBox, isValueTileBox } from '../../utils/dashboardSections';

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
          return (
            <div
              key={`section-${sectionIndex}`}
              class={cx('d-flex flex-row flex-wrap justify-content-center align-items-stretch', style.sectionRow)}
            >
              {filledColumns.map(({ column, columnIndex }) => {
                const x = sectionOffset + columnIndex;
                return (
                  <div
                    key={`column-${x}`}
                    class={cx('d-flex flex-column', style.dashboardColumn, style.removePadding)}
                    style={`--column-width: ${((widths[columnIndex] / totalWeight) * 100).toFixed(4)}%`}
                  >
                    {column.map((box, y) =>
                      canBoxStretchAt(box, y === column.length - 1) ? (
                        <div
                          key={`${props.homeDashboard.id}-${x}-${y}`}
                          class={cx(style.stretchableBox, {
                            [style.stretchableTile]: isTileStretchBox(box),
                            [style.adaptiveTile]: isValueTileBox(box),
                            // global marker so media widgets can make their image
                            // fill the stretched card from their own stylesheet
                            'dashboard-stretched-media': !isTileStretchBox(box)
                          })}
                        >
                          <Box box={box} x={x} y={y} />
                        </div>
                      ) : (
                        <Box key={`${props.homeDashboard.id}-${x}-${y}`} box={box} x={x} y={y} />
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
