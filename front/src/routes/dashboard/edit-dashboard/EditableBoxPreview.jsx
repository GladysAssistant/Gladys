import { useRef } from 'preact/hooks';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import Box from '../Box';
import { startPointerDrag } from '../../../utils/pointerDrag';
import { resolveWidgetDropHover, resolveWidgetDropDestination } from './widgetDropPlacement';
import style from './style.css';

// A widget on the edit canvas: the real rendered Box behind a transparent
// overlay (a tap opens its settings), with a slim toolbar carrying the
// affordances — drag handle on desktop, up/down on mobile, settings, remove.
// Dragging runs on the pointer-events engine (see utils/pointerDrag.js):
// no native HTML5 drag, no react-dnd — one reliable path for every input.
const EditableBoxPreview = ({ children, ...props }) => {
  const { x, y, box } = props;
  const ref = useRef(null);

  const onHandlePointerDown = event => {
    const wrapper = ref.current;
    if (!wrapper) {
      return;
    }
    const titleNode = wrapper.querySelector('[data-preview-title]');
    startPointerDrag(event, {
      source: wrapper,
      draggingClass: style.previewWrapperDragging,
      // droppable surfaces: the columns and, as a catch-all, the section
      // rows (widgetDropPlacement resolves the nearest column from there)
      dropSelector: '[data-widget-drop], [data-widget-drop-section]',
      ghostClass: style.dragLayerPill,
      ghostIconClass: 'fe fe-move',
      ghostLabel: titleNode ? titleNode.textContent : '',
      bodyClass: 'gladys-widget-dragging',
      indicatorClass: style.dropIndicator,
      resolveHover: (target, point) => resolveWidgetDropHover(target, point, x, y),
      onDrop: (target, point) => {
        const destination = resolveWidgetDropDestination(target, point, x, y);
        if (destination) {
          props.moveCard(x, y, destination.x, destination.y);
        }
      }
    });
  };

  const isEditing = props.editingBoxPosition && props.editingBoxPosition.x === x && props.editingBoxPosition.y === y;
  return (
    <div
      ref={ref}
      data-widget-wrapper
      class={cx(style.previewWrapper, {
        [style.previewWrapperEditing]: isEditing
      })}
    >
      <div class={style.previewToolbar}>
        <span class={style.previewTitle} data-preview-title>
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
          <span
            class={cx(style.previewButton, style.previewHandle, 'd-none d-lg-inline-flex')}
            data-cy={`drag-box-${x}-${y}`}
            onPointerDown={onHandlePointerDown}
          >
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
