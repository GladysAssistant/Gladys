import cx from 'classnames';
import style from './style.css';

// Drop target filling an empty column, for the pointer-drag engine: the
// data attributes say where a dropped widget lands (top of column x), the
// engine highlights it via data-drop-active-class.
const EmptyColumnDropZone = ({ x }) => (
  <div
    class={cx('text-center', style.dropZone)}
    data-widget-drop
    data-drop-x={x}
    data-drop-y="0"
    data-drop-active-class={style.dropZoneActive}
  />
);

export default EmptyColumnDropZone;
