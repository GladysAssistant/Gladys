import { useRef } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import cx from 'classnames';
import style from './style.css';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

const BottomDropZone = ({ children, ...props }) => {
  const ref = useRef(null);
  const [{ isActive, canDrop }, drop] = useDrop({
    accept: DASHBOARD_EDIT_BOX_TYPE,
    collect: monitor => ({ canDrop: monitor.canDrop(), isActive: monitor.canDrop() && monitor.isOver() }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCard(item.x, item.y, props.x, props.y);
    }
  });
  drop(ref);
  return (
    <div
      ref={ref}
      class={cx('text-center', style.bottomDropZone)}
      style={{
        display: canDrop || props.isMobileReordering ? 'block' : 'none',
        backgroundColor: isActive ? '#ecf0f1' : undefined
      }}
    />
  );
};

export default BottomDropZone;
