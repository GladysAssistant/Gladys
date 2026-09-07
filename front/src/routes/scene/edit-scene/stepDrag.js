import { startPointerDrag } from '../../../utils/pointerDrag';
import { computeInsertionIndex, insertionLineRect } from '../../dashboard/edit-dashboard/widgetDropPlacement';
import style from './style.css';

// Drag & drop of the scene editor, on the shared pointer-events engine
// (utils/pointerDrag.js) — the same stack as the dashboard editor, for the
// same reasons: one code path for mouse, touch and pen, no native HTML5
// drag pipeline, nothing re-renders until the drop. react-dnd is gone.
//
// Three gestures, all started from a dedicated drag handle:
//  - a STEP (an action group: plain step, "at the same time" block, if/while
//    block) reorders along the step flows of its nesting level;
//  - a CARD of an "at the same time" block reorders inside its block, moves
//    to another block, merges onto a plain step (making it parallel), or
//    lands on an "add a step" button to become its own step;
//  - a CONDITION of an if/while block reorders along its condition list.
//
// The droppable surfaces are the flows themselves, marked with data
// attributes; the insertion point is computed from the pointer position and
// shown as an overlay indicator line, so a drag never shifts the layout.

// The path of the group an action belongs to ("1.0" -> "1", "0.0.then.2.1" -> "0.0.then.2")
export const getGroupPath = actionPath =>
  actionPath
    .split('.')
    .slice(0, -1)
    .join('.');

const splitPath = path => {
  const segments = path.split('.');
  return {
    prefix: segments.slice(0, -1).join('.'),
    index: parseInt(segments[segments.length - 1], 10)
  };
};

const joinPath = (prefix, index) => (prefix ? `${prefix}.${index}` : `${index}`);

// The slots of a droppable surface, excluding those of any surface of the
// same kind nested inside it (an if/while step embeds whole flows of its own)
const directSlots = (surface, surfaceSelector, slotSelector) =>
  Array.from(surface.querySelectorAll(slotSelector)).filter(slot => slot.closest(surfaceSelector) === surface);

// Insertion slot k mapped back to an index in the data array: slots carry
// their own data index because not every group is a slot (an empty group
// renders as a plain "add a step" button), so the array can be longer than
// the slot list. Inserting after the last slot means "right after it".
const dataIndexAt = (slots, k, indexAttribute) => {
  if (slots.length === 0) {
    return 0;
  }
  if (k < slots.length) {
    return Number(slots[k].getAttribute(indexAttribute));
  }
  return Number(slots[slots.length - 1].getAttribute(indexAttribute)) + 1;
};

// The ghost pill shows the label of the dragged card, read from the DOM like
// the dashboard editor does (the components only hold <Text> nodes)
const ghostLabelOf = sourceElement => {
  const labelNode = sourceElement ? sourceElement.querySelector('[data-step-label]') : null;
  return labelNode ? labelNode.textContent : '';
};

const sharedEngineOptions = {
  draggingClass: style.dragSourceDimmed,
  ghostClass: style.dragGhostPill,
  ghostIconClass: 'fe fe-move',
  indicatorClass: style.dropIndicatorLine
};

// ---------------------------------------------------------------------------
// Step drag: reorder whole groups along the step flows of the same level
// ---------------------------------------------------------------------------

const resolveFlowPlacement = (flow, point, level) => {
  // a step only travels between flows of its own nesting depth: the level
  // guard also keeps a block out of its own branches (they are deeper)
  if (Number(flow.getAttribute('data-flow-level')) !== level) {
    return null;
  }
  const slots = directSlots(flow, '[data-step-flow]', '[data-step-slot]');
  const k = computeInsertionIndex(slots, point.y);
  return {
    flow,
    slots,
    k,
    index: dataIndexAt(slots, k, 'data-group-index'),
    prefix: flow.getAttribute('data-flow-path') || ''
  };
};

export const startStepDrag = (event, { groupPath, moveCardGroup }) => {
  const source = splitPath(groupPath);
  const level = groupPath.split('.').length;
  const slot = event.currentTarget.closest('[data-step-slot]');
  const isNoop = placement =>
    placement.prefix === source.prefix && (placement.index === source.index || placement.index === source.index + 1);
  startPointerDrag(event, {
    ...sharedEngineOptions,
    source: slot,
    ghostLabel: ghostLabelOf(slot),
    dropSelector: '[data-step-flow]',
    bodyClass: 'gladys-scene-step-dragging',
    resolveHover: (target, point) => {
      const placement = resolveFlowPlacement(target, point, level);
      if (!placement) {
        return null;
      }
      return {
        area: placement.flow,
        indicator: isNoop(placement)
          ? null
          : insertionLineRect(placement.flow.getBoundingClientRect(), placement.slots, placement.k)
      };
    },
    onDrop: (target, point) => {
      const placement = resolveFlowPlacement(target, point, level);
      if (!placement || isNoop(placement)) {
        return;
      }
      // the group is spliced out before being spliced back in: moving down
      // inside the same flow shifts the indices below the source by one
      let destinationIndex = placement.index;
      if (placement.prefix === source.prefix && destinationIndex > source.index) {
        destinationIndex -= 1;
      }
      moveCardGroup(groupPath, joinPath(placement.prefix, destinationIndex));
    }
  });
};

// ---------------------------------------------------------------------------
// Parallel-card drag: reorder inside "at the same time" blocks, merge onto a
// plain step, or land on an "add a step" button to become a step of its own
// ---------------------------------------------------------------------------

const resolveParallelPlacement = (body, point) => {
  const slots = directSlots(body, '[data-parallel-drop]', '[data-card-slot]');
  const k = computeInsertionIndex(slots, point.y);
  return {
    body,
    slots,
    k,
    index: dataIndexAt(slots, k, 'data-card-index'),
    groupPath: body.getAttribute('data-group-path')
  };
};

export const startParallelCardDrag = (event, { actionPath, moveCard }) => {
  const source = splitPath(actionPath);
  const slot = event.currentTarget.closest('[data-card-slot]');
  const isNoop = placement =>
    placement.groupPath === source.prefix && (placement.index === source.index || placement.index === source.index + 1);
  startPointerDrag(event, {
    ...sharedEngineOptions,
    source: slot,
    ghostLabel: ghostLabelOf(slot),
    dropSelector: '[data-parallel-drop], [data-step-merge], [data-card-extract]',
    bodyClass: 'gladys-scene-card-dragging',
    resolveHover: (target, point) => {
      if (!target.hasAttribute('data-parallel-drop')) {
        // merging onto a step or extracting to an "add a step" button: the
        // whole element is the target, the tint alone says "lands here"
        return { area: target, indicator: null };
      }
      const placement = resolveParallelPlacement(target, point);
      return {
        area: placement.body,
        indicator: isNoop(placement)
          ? null
          : insertionLineRect(placement.body.getBoundingClientRect(), placement.slots, placement.k)
      };
    },
    onDrop: (target, point) => {
      if (target.hasAttribute('data-step-merge')) {
        // the destination step holds a single action: appending after it
        // turns the step into an "at the same time" block of two
        moveCard(actionPath, `${target.getAttribute('data-group-path')}.1`);
        return;
      }
      if (target.hasAttribute('data-card-extract')) {
        // the empty group behind the "add a step" button adopts the card,
        // which becomes a full-fledged step of the flow
        moveCard(actionPath, `${target.getAttribute('data-group-path')}.0`);
        return;
      }
      const placement = resolveParallelPlacement(target, point);
      if (isNoop(placement)) {
        return;
      }
      let destinationIndex = placement.index;
      if (placement.groupPath === source.prefix && destinationIndex > source.index) {
        destinationIndex -= 1;
      }
      moveCard(actionPath, `${placement.groupPath}.${destinationIndex}`);
    }
  });
};

// ---------------------------------------------------------------------------
// Condition drag: reorder along the condition lists of if/while blocks
// ---------------------------------------------------------------------------

const resolveConditionPlacement = (flow, point) => {
  const slots = directSlots(flow, '[data-condition-flow]', '[data-condition-slot]');
  const k = computeInsertionIndex(slots, point.y);
  return {
    flow,
    slots,
    k,
    index: dataIndexAt(slots, k, 'data-card-index'),
    prefix: flow.getAttribute('data-flow-path')
  };
};

export const startConditionDrag = (event, { actionPath, moveCard }) => {
  const source = splitPath(actionPath);
  const slot = event.currentTarget.closest('[data-condition-slot]');
  const isNoop = placement =>
    placement.prefix === source.prefix && (placement.index === source.index || placement.index === source.index + 1);
  startPointerDrag(event, {
    ...sharedEngineOptions,
    source: slot,
    ghostLabel: ghostLabelOf(slot),
    dropSelector: '[data-condition-flow]',
    bodyClass: 'gladys-scene-condition-dragging',
    resolveHover: (target, point) => {
      const placement = resolveConditionPlacement(target, point);
      return {
        area: placement.flow,
        indicator: isNoop(placement)
          ? null
          : insertionLineRect(placement.flow.getBoundingClientRect(), placement.slots, placement.k)
      };
    },
    onDrop: (target, point) => {
      const placement = resolveConditionPlacement(target, point);
      if (isNoop(placement)) {
        return;
      }
      let destinationIndex = placement.index;
      if (placement.prefix === source.prefix && destinationIndex > source.index) {
        destinationIndex -= 1;
      }
      moveCard(actionPath, `${placement.prefix}.${destinationIndex}`);
    }
  });
};

// ---------------------------------------------------------------------------
// Keyboard reordering: the drag handles are real buttons, and the arrow keys
// move the element one position at a time — dragging is never the only way
// ---------------------------------------------------------------------------

// One position up or down in a slot list: the neighbors are read from the
// DOM (only real slots count, the trailing "add a step" group is not one)
const keyboardStep = (event, slotSelector) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
    return null;
  }
  const slot = event.currentTarget.closest(slotSelector);
  if (!slot) {
    return null;
  }
  return { direction: event.key === 'ArrowUp' ? -1 : 1, slot };
};

// The lists are diffed by position (keying them by object identity would
// remount every card on each edit, since immutability-helper allocates a new
// action object), so after a keyboard move the focus is left on the handle of
// whatever now sits at the old position. Hand it back to the moved element,
// found by its destination path, so repeated arrow presses keep carrying the
// same step instead of swapping it back and forth with its neighbour.
const refocusHandleAt = destinationPath => {
  window.requestAnimationFrame(() => {
    // a step holding a single action carries the handle on the card itself,
    // whose path is the group path plus the action index
    const handle =
      document.querySelector(`[data-cy="drag-step-${destinationPath}"]`) ||
      document.querySelector(`[data-cy="drag-step-${destinationPath}.0"]`);
    if (handle) {
      handle.focus();
    }
  });
};

const hasAdjacentSlot = (slot, surface, surfaceSelector, slotSelector, direction) => {
  const slots = directSlots(surface, surfaceSelector, slotSelector);
  const position = slots.indexOf(slot);
  const neighbor = position + direction;
  return position !== -1 && neighbor >= 0 && neighbor < slots.length;
};

export const moveStepWithKeyboard = (event, { groupPath, moveCardGroup }) => {
  const move = keyboardStep(event, '[data-step-slot]');
  if (!move) {
    return;
  }
  event.preventDefault();
  const flow = move.slot.closest('[data-step-flow]');
  if (!flow || !hasAdjacentSlot(move.slot, flow, '[data-step-flow]', '[data-step-slot]', move.direction)) {
    return;
  }
  const { prefix, index } = splitPath(groupPath);
  const destination = joinPath(prefix, index + move.direction);
  moveCardGroup(groupPath, destination);
  refocusHandleAt(destination);
};

export const moveParallelCardWithKeyboard = (event, { actionPath, moveCard }) => {
  const move = keyboardStep(event, '[data-card-slot]');
  if (!move) {
    return;
  }
  event.preventDefault();
  const body = move.slot.closest('[data-parallel-drop]');
  if (!body || !hasAdjacentSlot(move.slot, body, '[data-parallel-drop]', '[data-card-slot]', move.direction)) {
    return;
  }
  const { prefix, index } = splitPath(actionPath);
  const destination = `${prefix}.${index + move.direction}`;
  moveCard(actionPath, destination);
  refocusHandleAt(destination);
};

export const moveConditionWithKeyboard = (event, { actionPath, moveCard }) => {
  const move = keyboardStep(event, '[data-condition-slot]');
  if (!move) {
    return;
  }
  event.preventDefault();
  const flow = move.slot.closest('[data-condition-flow]');
  if (!flow || !hasAdjacentSlot(move.slot, flow, '[data-condition-flow]', '[data-condition-slot]', move.direction)) {
    return;
  }
  const { prefix, index } = splitPath(actionPath);
  const destination = `${prefix}.${index + move.direction}`;
  moveCard(actionPath, destination);
  refocusHandleAt(destination);
};
