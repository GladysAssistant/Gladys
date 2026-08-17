import Box from './Box';
import cx from 'classnames';
import style from './style.css';
import { canBoxStretchAt, isTileStretchBox, isValueTileBox } from '../../utils/dashboardSections';

const BoxColumns = ({ children, ...props }) => {
  let columnOffset = 0;
  return (
    <div>
      {props.homeDashboard &&
        props.homeDashboard.boxes.map(section => {
          const sectionOffset = columnOffset;
          columnOffset += section.columns.length;
          // 5 doesn't divide the 12-column grid: those columns get a 20% class instead
          const columnClass = section.columns.length === 5 ? style.colFifth : `col-lg-${12 / section.columns.length}`;
          return (
            <div class="d-flex flex-row flex-wrap justify-content-center align-items-stretch">
              {section.columns.map((column, columnIndex) => {
                const x = sectionOffset + columnIndex;
                return (
                  <div
                    class={cx('d-flex flex-column', columnClass, style.removePadding, {
                      [style.removePaddingFirstCol]: columnIndex === 0,
                      [style.removePaddingLastCol]: columnIndex === section.columns.length - 1
                    })}
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
