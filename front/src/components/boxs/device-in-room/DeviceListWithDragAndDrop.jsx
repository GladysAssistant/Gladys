import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRef } from 'preact/hooks';

const DEVICE_TYPE = 'DEVICE_TYPE';

const DeviceRow = ({ selectedDeviceFeature, moveDevice, index, removeDevice, updateDeviceFeatureName }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DEVICE_TYPE,
    item: () => {
      return { index };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: DEVICE_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      moveDevice(item.index, index);
    }
  });
  preview(drop(ref));
  const removeThisDevice = () => {
    removeDevice(index);
  };

  const updateThisDeviceFeatureName = e => {
    updateDeviceFeatureName(index, e.target.value);
  };

  return (
    <div class="mb-1">
      <label class="form-label">{selectedDeviceFeature.label}</label>
      <div
        class="input-group"
        ref={ref}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'pointer',
          backgroundColor: isActive ? '#ecf0f1' : undefined,
          userSelect: 'none'
        }}
      >
        <div class="input-group-prepend" ref={drag}>
          <span class="input-group-text fe fe-list" />
        </div>
        <input
          type="text"
          class="form-control"
          value={
            selectedDeviceFeature.new_label !== undefined
              ? selectedDeviceFeature.new_label
              : selectedDeviceFeature.label
          }
          onChange={updateThisDeviceFeatureName}
        />
        <div class="input-group-append">
          <button class="btn btn-outline-danger" type="button" onClick={removeThisDevice}>
            <span class=" fe fe-x" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DeviceListWithDragAndDrop = ({
  selectedDeviceFeaturesOptions,
  isTouchDevice,
  moveDevice,
  removeDevice,
  updateDeviceFeatureName
}) => (
  <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
    {selectedDeviceFeaturesOptions.map((selectedDeviceFeature, index) => (
      <DeviceRow
        selectedDeviceFeature={selectedDeviceFeature}
        updateDeviceFeatureName={updateDeviceFeatureName}
        index={index}
        moveDevice={moveDevice}
        removeDevice={removeDevice}
      />
    ))}
  </DndProvider>
);

export { DeviceListWithDragAndDrop };
