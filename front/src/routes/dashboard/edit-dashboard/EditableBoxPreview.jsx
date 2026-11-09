import { useRef } from 'preact/hooks';
import { Text, Localizer } from 'preact-i18n';
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

  // ↑/↓ move the widget one step: the page is scrolled by the distance it
  // travelled, so it stays under the finger (and its button keeps the
  // focus), instead of the user hunting for it after every tap
  const moveKeepingInView = async direction => {
    const before = ref.current ? ref.current.getBoundingClientRect().top : null;
    await (direction < 0 ? props.moveBoxUp(x, y) : props.moveBoxDown(x, y));
    const newY = y + direction;
    requestAnimationFrame(() => {
      const moved = document.querySelector(`[data-widget-wrapper][data-x="${x}"][data-y="${newY}"]`);
      if (!moved) {
        return;
      }
      if (before !== null) {
        window.scrollBy(0, moved.getBoundingClientRect().top - before);
      }
      const button = moved.querySelector(`[data-move="${direction < 0 ? 'up' : 'down'}"]`);
      if (button && !button.disabled) {
        button.focus();
      }
      moved.classList.add('gladys-widget-flash');
      setTimeout(() => moved.classList.remove('gladys-widget-flash'), 1000);
    });
  };

  // data-editing marks the edited widget for the panel and the forms
  // (revealAbovePanel, the devices widget's row highlight); data-x / data-y
  // let the editor find a widget again after it moved
  const isEditing = props.editingBoxPosition && props.editingBoxPosition.x === x && props.editingBoxPosition.y === y;
  const titleId = `widget-title-${x}-${y}`;
  return (
    <div
      ref={ref}
      data-widget-wrapper
      data-x={x}
      data-y={y}
      data-editing={isEditing ? 'true' : undefined}
      class={cx(style.previewWrapper, {
        [style.previewWrapperEditing]: isEditing
      })}
    >
      {/* the toolbar is a group named after the widget: VoiceOver reads
          "Weather, group — Move up, button…" instead of four nameless buttons */}
      <div class={style.previewToolbar} role="group" aria-labelledby={titleId}>
        <span class={style.previewTitle} data-preview-title id={titleId}>
          {box.type ? <Text id={`dashboard.boxTitle.${box.type}`} /> : <Text id="dashboard.editorNewWidget" />}
          {box.name && <span class={style.previewSubtitle}> · {box.name}</span>}
        </span>
        <div class={style.previewActions}>
          <Localizer>
            <button
              type="button"
              class={cx(style.previewButton, 'd-lg-none')}
              onClick={() => moveKeepingInView(-1)}
              disabled={y === 0}
              data-move="up"
              data-cy={`move-box-up-${x}-${y}`}
              aria-label={<Text id="dashboard.editorMoveWidgetUp" />}
            >
              <i class="fe fe-arrow-up" aria-hidden="true" />
            </button>
          </Localizer>
          <Localizer>
            <button
              type="button"
              class={cx(style.previewButton, 'd-lg-none')}
              onClick={() => moveKeepingInView(1)}
              disabled={y === props.columnLength - 1}
              data-move="down"
              data-cy={`move-box-down-${x}-${y}`}
              aria-label={<Text id="dashboard.editorMoveWidgetDown" />}
            >
              <i class="fe fe-arrow-down" aria-hidden="true" />
            </button>
          </Localizer>
          {/* "Move to…": another column or section, the touch (and
              keyboard) alternative to dragging */}
          <Localizer>
            <button
              type="button"
              class={style.previewButton}
              onClick={() => props.openMoveBox(x, y)}
              data-cy={`move-to-box-${x}-${y}`}
              aria-label={<Text id="dashboard.editorMoveWidgetTo" />}
              title={<Text id="dashboard.editorMoveWidgetTo" />}
            >
              <i class="fe fe-corner-down-right" aria-hidden="true" />
            </button>
          </Localizer>
          <span
            class={cx(style.previewButton, style.previewHandle, 'd-none d-lg-inline-flex')}
            data-cy={`drag-box-${x}-${y}`}
            onPointerDown={onHandlePointerDown}
            aria-hidden="true"
          >
            <i class="fe fe-move" />
          </span>
          <Localizer>
            <button
              type="button"
              class={style.previewButton}
              data-cy={`edit-box-${x}-${y}`}
              onClick={() => props.openBoxSettings(x, y)}
              aria-label={<Text id="dashboard.editorWidgetSettings" />}
              title={<Text id="dashboard.editorWidgetSettings" />}
            >
              <i class="fe fe-settings" aria-hidden="true" />
            </button>
          </Localizer>
          <Localizer>
            <button
              type="button"
              class={style.previewButton}
              onClick={() => props.removeBox(x, y)}
              data-cy={`remove-box-${x}-${y}`}
              aria-label={<Text id="dashboard.editorRemoveWidget" />}
              title={<Text id="dashboard.editorRemoveWidget" />}
            >
              <i class="fe fe-x" aria-hidden="true" />
            </button>
          </Localizer>
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
        {/* the overlay blocks the widget's own interactions; a tap opens its
            settings — a pointer convenience, the ⚙ button is the accessible way */}
        <div class={style.previewOverlay} onClick={() => props.openBoxSettings(x, y)} aria-hidden="true" />
      </div>
    </div>
  );
};

export default EditableBoxPreview;
