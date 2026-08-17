import { useRef } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import style from './style.css';

const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';

// An empty action group renders as a "add a step" button, which also accepts
// action cards dropped from other steps
const EmptyDropZone = ({ children, ...props }) => {
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
      props.moveCard(item.path, `${props.path}.0`);
    }
  });
  drop(ref);
  return (
    <button
      ref={ref}
      type="button"
      onClick={props.onAddStep}
      class={cx('btn btn-outline-primary', style.addStepButton, {
        [style.dropZoneActive]: isActive
      })}
    >
      <i class="fe fe-plus" /> <Text id="editScene.addStepButton" />
    </button>
  );
};

export default EmptyDropZone;
