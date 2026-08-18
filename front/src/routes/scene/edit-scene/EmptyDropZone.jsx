import { useRef } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { getActionGroupType, getStepAcceptedTypes } from './dragAndDropTypes';
import style from './style.css';

// An empty group is only an insertion point: a step dropped on it takes its place, and the
// insertion point is pushed after it. As the moved group is spliced out of the container before
// being spliced back in, the destination index is shifted by one when the step came from above.
const getGroupDestinationPath = (sourcePath, targetPath) => {
  const sourceSegments = sourcePath.split('.');
  const targetSegments = targetPath.split('.');
  const sourceIndex = parseInt(sourceSegments[sourceSegments.length - 1], 10);
  const targetIndex = parseInt(targetSegments[targetSegments.length - 1], 10);
  const isMovedDownInSameContainer =
    sourceSegments.slice(0, -1).join('.') === targetSegments.slice(0, -1).join('.') && sourceIndex < targetIndex;
  if (!isMovedDownInSameContainer) {
    return targetPath;
  }
  return [...targetSegments.slice(0, -1), targetIndex - 1].join('.');
};

// An empty action group renders as a "add a step" button, which also accepts
// the action cards and the steps dropped from another place of the scene
const EmptyDropZone = ({ children, ...props }) => {
  const ref = useRef(null);
  const [{ isActive }, drop] = useDrop({
    accept: getStepAcceptedTypes(props.path),
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item, monitor) {
      if (!ref.current) {
        return;
      }
      // A whole group was dropped: it is moved to this insertion point
      if (monitor.getItemType() === getActionGroupType(props.path)) {
        props.moveCardGroup(item.path, getGroupDestinationPath(item.path, props.path));
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
