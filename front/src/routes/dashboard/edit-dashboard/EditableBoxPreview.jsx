import { useRef, useEffect } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import Box from '../Box';
import style from './style.css';

export const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

// A widget on the edit canvas: the real rendered Box behind a transparent
// overlay (a tap opens its settings), with a slim toolbar carrying the
// affordances — drag handle on desktop, up/down on mobile, settings, remove.
const EditableBoxPreview = ({ children, ...props }) => {
  const { x, y, box } = props;
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: DASHBOARD_EDIT_BOX_TYPE,
      // the widget type rides along so the drag layer can label its ghost
      item: () => ({ x, y, type: box.type }),
      collect: monitor => ({
        isDragging: !!monitor.isDragging()
      })
    }),
    [x, y, box.type]
  );
  // The native drag preview is suppressed: Safari draws a blank image for
  // backdrop-filter cards and the touch backend has none — EditorDragLayer
  // renders the same visible ghost on every browser and backend instead
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);
  const [{ isActive }, drop] = useDrop(
    {
      accept: DASHBOARD_EDIT_BOX_TYPE,
      collect: monitor => ({
        isActive: monitor.canDrop() && monitor.isOver()
      }),
      drop(item) {
        props.moveCard(item.x, item.y, x, y);
      }
    },
    [x, y]
  );
  drop(ref);
  const isEditing = props.editingBoxPosition && props.editingBoxPosition.x === x && props.editingBoxPosition.y === y;
  return (
    <div
      ref={ref}
      class={cx(style.previewWrapper, {
        [style.previewWrapperDragging]: isDragging,
        [style.previewWrapperDropTarget]: isActive,
        [style.previewWrapperEditing]: isEditing
      })}
    >
      <div class={style.previewToolbar}>
        <span class={style.previewTitle}>
          {box.type ? <Text id={`dashboard.boxTitle.${box.type}`} /> : <Text id="dashboard.editorNewWidget" />}
        </span>
        <div class={style.previewActions}>
          <button
            type="button"
            class={cx(style.previewButton, 'd-lg-none')}
            onClick={() => props.moveBoxUp(x, y)}
            disabled={y === 0}
          >
            <i class="fe fe-arrow-up" />
          </button>
          <button
            type="button"
            class={cx(style.previewButton, 'd-lg-none')}
            onClick={() => props.moveBoxDown(x, y)}
            disabled={y === props.columnLength - 1}
          >
            <i class="fe fe-arrow-down" />
          </button>
          <span ref={drag} class={cx(style.previewButton, style.previewHandle, 'd-none d-lg-inline-flex')}>
            <i class="fe fe-move" />
          </span>
          <button
            type="button"
            class={style.previewButton}
            data-cy={`edit-box-${x}-${y}`}
            onClick={() => props.openBoxSettings(x, y)}
          >
            <i class="fe fe-settings" />
          </button>
          <button type="button" class={style.previewButton} onClick={() => props.removeBox(x, y)}>
            <i class="fe fe-x" />
          </button>
        </div>
      </div>
      <div class={style.previewContent}>
        {box.type ? (
          <Box box={box} x={x} y={y} />
        ) : (
          <div class={style.previewPlaceholder}>
            <i class="fe fe-plus-circle" />
            <Text id="dashboard.editorNewWidgetPlaceholder" />
          </div>
        )}
        {/* the overlay blocks the widget's own interactions; a tap opens its settings */}
        <div class={style.previewOverlay} onClick={() => props.openBoxSettings(x, y)} />
      </div>
    </div>
  );
};

export default EditableBoxPreview;
