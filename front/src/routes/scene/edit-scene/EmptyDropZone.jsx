import { useRef } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import style from './style.css';

const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';

const EmptyColumnDropZone = ({ children, ...props }) => {
  const ref = useRef(null);
  const [{ isActive }, drop] = useDrop({
    accept: ACTION_CARD_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCard(item.x, item.y, 0, props.y);
    }
  });
  drop(ref);
  return (
    <div
      ref={ref}
      class={cx('d-flex justify-content-center text-center ', style.dropZone, {
        [style.dropZoneActive]: isActive
      })}
    >
      <div class="align-self-center">
        <Text id="editScene.noActionsYet" />
      </div>
    </div>
  );
};

export default EmptyColumnDropZone;
