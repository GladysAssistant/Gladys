import { useRef } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import cx from 'classnames';
import style from './style.css';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

const EmptyColumnDropZone = ({ children, ...props }) => {
  const ref = useRef(null);
  const [{ isActive }, drop] = useDrop({
    accept: DASHBOARD_EDIT_BOX_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCard(item.x, item.y, props.x, 0);
    }
  });
  drop(ref);
  return (
    <div
      ref={ref}
      class={cx('text-center', style.dropZone)}
      style={{
        padding: '2rem',
        opacity: isActive ? 1 : 1,
        backgroundColor: isActive ? '#ecf0f1' : undefined
      }}
    />
  );
};

export default EmptyColumnDropZone;
