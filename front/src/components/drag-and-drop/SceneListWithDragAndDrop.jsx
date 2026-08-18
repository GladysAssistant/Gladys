import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { useRef } from 'preact/hooks';
import cx from 'classnames';
import style from './style.css';
import { getDragAndDropBackend } from '../../utils/dragAndDropBackend';

const SCENE_TYPE = 'SCENE_TYPE';

// We use Preact Hooks here because the library react-dnd needs that
// We do not recommend using them in other places in Gladys front
const SceneRow = ({ selectedSceneOption, moveScene, index }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: SCENE_TYPE,
    item: () => {
      return { index };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: SCENE_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      moveScene(item.index, index);
    }
  });
  preview(drop(ref));

  return (
    <div class="mb-1">
      <div
        class={cx('input-group', style.sceneListDragAndDrop, {
          [style.sceneListDragAndDropDragging]: isDragging
        })}
        ref={ref}
      >
        <div class="input-group-prepend" ref={drag}>
          <span class="input-group-text fe fe-list" />
        </div>
        <div
          class={cx('form-control', style.sceneListDragAndDropLabel, {
            [style.sceneListDragAndDropActive]: isActive
          })}
        >
          {selectedSceneOption.label}
        </div>
      </div>
    </div>
  );
};

const { backend: dragAndDropBackend, options: dragAndDropBackendOptions } = getDragAndDropBackend();

const SceneListWithDragAndDrop = ({ selectedSceneOptions, moveScene }) => (
  <DndProvider backend={dragAndDropBackend} options={dragAndDropBackendOptions}>
    {selectedSceneOptions.map((selectedSceneOption, index) => (
      <SceneRow selectedSceneOption={selectedSceneOption} index={index} moveScene={moveScene} />
    ))}
  </DndProvider>
);

export { SceneListWithDragAndDrop };
