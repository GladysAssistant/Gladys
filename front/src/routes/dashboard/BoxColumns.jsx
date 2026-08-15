import Box from './Box';
import cx from 'classnames';
import style from './style.css';
import { canBoxStretch } from '../../utils/dashboardSections';

const BoxColumns = ({ children, ...props }) => {
  let columnOffset = 0;
  return (
    <div>
      {props.homeDashboard &&
        props.homeDashboard.boxes.map(section => {
          const sectionOffset = columnOffset;
          columnOffset += section.columns.length;
          const columnClass = `col-lg-${12 / section.columns.length}`;
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
                      canBoxStretch(box) ? (
                        <div key={`${props.homeDashboard.id}-${x}-${y}`} class={style.stretchableBox}>
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
