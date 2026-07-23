import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRef } from 'preact/hooks';
import cx from 'classnames';
import style from './style.css';

const SCENE_TYPE = 'SCENE_TYPE';

const SceneRow = ({ selectedScene, moveScene, index, removeScene }) => {
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

  const removeThisScene = () => {
    removeScene(index);
  };

  return (
    <div class="mb-1">
      <div
        class={cx('input-group', style.deviceListDragAndDrop, {
          [style.deviceListDragAndDropActive]: isActive,
          [style.deviceListDragAndDropDragging]: isDragging
        })}
        ref={ref}
      >
        <div class="input-group-prepend" ref={drag}>
          <span class="input-group-text fe fe-list" />
        </div>
        <input type="text" class="form-control" value={selectedScene.label} readonly />
        <div class={cx('input-group-append', style.deviceListRemoveButton)}>
          <button class="btn btn-outline-danger" type="button" onClick={removeThisScene}>
            <span class=" fe fe-x" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SceneListWithDragAndDrop = ({ selectedSceneOptions, isTouchDevice, moveScene, removeScene }) => (
  <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
    {selectedSceneOptions.map((selectedScene, index) => (
      <SceneRow selectedScene={selectedScene} index={index} moveScene={moveScene} removeScene={removeScene} />
    ))}
  </DndProvider>
);

export { SceneListWithDragAndDrop };
