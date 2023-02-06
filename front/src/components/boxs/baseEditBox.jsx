import { Text } from 'preact-i18n';
import { useRef } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

const BaseEditBox = ({ children, ...props }) => {
  const { x, y } = props;
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DASHBOARD_EDIT_BOX_TYPE,
    item: () => {
      return { x, y };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: DASHBOARD_EDIT_BOX_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCard(item.x, item.y, x, y);
    }
  });
  preview(drop(ref));
  const removeBox = () => {
    props.removeBox(x, y);
  };
  return (
    <div
      ref={ref}
      class="card"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
        backgroundColor: isActive ? '#ecf0f1' : undefined
      }}
    >
      <div class="card-header">
        <h3 class="card-title">
          <Text id={props.titleKey} />
        </h3>
        <div class="card-options">
          <a class="card-options-remove">
            <i ref={drag} style={{ cursor: 'move' }} class="fe fe-move mr-2" />
          </a>
          <a onClick={removeBox} class="card-options-remove">
            <i class="fe fe-x" />
          </a>
        </div>
      </div>
      <div class="card-body">{children}</div>
    </div>
  );
};

export default BaseEditBox;
