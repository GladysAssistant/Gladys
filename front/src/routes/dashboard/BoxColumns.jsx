import Box from './Box';
import cx from 'classnames';
import style from './style.css';

const BoxColumns = ({ children, ...props }) => {
  const boxesLength = props.homeDashboard.boxes.length;
  const columnClass = `col-lg-${12 / boxesLength}`;

  return (
    <div class="d-flex flex-row flex-wrap justify-content-center">
      {props.homeDashboard &&
        props.homeDashboard.boxes.map((column, x) => (
          <div
            class={cx('d-flex flex-column', columnClass, style.removePadding, {
              [style.removePaddingFirstCol]: x === 0,
              [style.removePaddingLastCol]: x === boxesLength - 1,
              [style.removePadding]: true // it will remove padding when in mobile view
            })}
          >
            {column.map((box, y) => (
              <Box key={`${props.homeDashboard.id}-${x}-${y}`} box={box} x={x} y={y} />
            ))}
          </div>
        ))}
    </div>
  );
};

export default BoxColumns;
