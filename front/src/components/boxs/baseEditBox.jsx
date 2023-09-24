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
  if (props.isMobileReordering) {
    return (
      <div
        ref={ref}
        class="card"
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'pointer',
          backgroundColor: isActive ? '#ecf0f1' : undefined,
          userSelect: 'none'
        }}
      >
        <div ref={drag} style={{ minHeight: '2.5rem', padding: '1rem 1.5rem' }}>
          <div class="d-flex bd-highlight justify-content-between">
            <div>
              <i style={{ cursor: 'move' }} class="fe fe-list mr-4" />
            </div>
            <div class="flex-fill">
              <Text id={props.titleKey} />
            </div>
            <div class="flex-fill text-right">{props.titleValue && <small>{props.titleValue}</small>}</div>
          </div>
        </div>
      </div>
    );
  }
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
          {props.isMobileReordering && <i style={{ cursor: 'move' }} class="fe fe-list mr-4" />}
          {props.titleKey && <Text id={props.titleKey} />}
        </h3>
        <div class="card-options">
          <a class="card-options-remove">
            <i ref={drag} style={{ cursor: 'move' }} class="fe fe-move mr-2 d-none d-lg-inline" />
          </a>
          {!props.isMobileReordering && (
            <a onClick={removeBox} class="card-options-remove">
              <i class="fe fe-x" />
            </a>
          )}
        </div>
      </div>
      <div class="card-body">{children}</div>
    </div>
  );
};

export default BaseEditBox;
