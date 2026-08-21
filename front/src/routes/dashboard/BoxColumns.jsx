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
          // An empty section maps over nothing, so the 0 total weight of
          // the empty columns array is never used as a divisor.
          const widths = getSectionWidths(section);
          const totalWeight = widths.reduce((sum, width) => sum + width, 0);
          return (
            <div
              key={`section-${sectionIndex}`}
              class={cx('d-flex flex-row flex-wrap justify-content-center align-items-stretch', style.sectionRow)}
            >
              {section.columns.map((column, columnIndex) => {
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
