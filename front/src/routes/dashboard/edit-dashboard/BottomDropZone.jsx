import cx from 'classnames';
import style from './style.css';

// Drop target below the last widget of a column, for the pointer-drag
// engine. Only visible while a widget drag is live (body carries
// .gladys-widget-dragging — see style.css); the drop meaning is carried by
// the data attributes, the engine highlights it via data-drop-active-class.
const BottomDropZone = ({ x, y }) => (
  <div
    class={cx('text-center', style.bottomDropZone)}
    data-widget-drop
    data-drop-x={x}
    data-drop-y={y}
    data-drop-active-class={style.bottomDropZoneActive}
  />
);

export default BottomDropZone;
