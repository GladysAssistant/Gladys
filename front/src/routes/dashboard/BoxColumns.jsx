import Box from './Box';
import cx from 'classnames';
import style from './style.css';
import {
  DEFAULT_COLUMN_WIDTH,
  canBoxStretchAt,
  getSectionWidths,
  isTileStretchBox,
  isValueTileBox
} from '../../utils/dashboardSections';

const BoxColumns = ({ children, ...props }) => {
  let columnOffset = 0;
  return (
    <div>
      {props.homeDashboard &&
        props.homeDashboard.boxes.map((section, sectionIndex) => {
          const sectionOffset = columnOffset;
          columnOffset += section.columns.length;
          // the API accepts an empty columns array: never divide by zero
          // (col-lg-Infinity) — an empty section just renders nothing
          const columnCount = Math.max(section.columns.length, 1);
          // 5 doesn't divide the 12-column grid: those columns get a 20% class instead
          const columnClass = columnCount === 5 ? style.colFifth : `col-lg-${12 / columnCount}`;
          // per-column weights (e.g. 2|1): widths become percentage shares
          // instead of grid classes, mobile stacking stays identical
          const widths = getSectionWidths(section);
          const isWeighted = widths.some(width => width !== DEFAULT_COLUMN_WIDTH);
          const totalWeight = widths.reduce((sum, width) => sum + width, 0);
          return (
            <div
              key={`section-${sectionIndex}`}
              class="d-flex flex-row flex-wrap justify-content-center align-items-stretch"
            >
              {section.columns.map((column, columnIndex) => {
                const x = sectionOffset + columnIndex;
                return (
                  <div
                    key={`column-${x}`}
                    class={cx(
                      'd-flex flex-column',
                      isWeighted ? style.weightedColumn : columnClass,
                      style.removePadding,
                      {
                        [style.removePaddingFirstCol]: columnIndex === 0,
                        [style.removePaddingLastCol]: columnIndex === section.columns.length - 1
                      }
                    )}
                    style={
                      isWeighted
                        ? `--column-width: ${((widths[columnIndex] / totalWeight) * 100).toFixed(4)}%`
                        : undefined
                    }
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
