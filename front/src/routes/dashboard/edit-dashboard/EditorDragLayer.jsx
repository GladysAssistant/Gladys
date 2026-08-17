import { useDragLayer } from 'react-dnd';
import { Text } from 'preact-i18n';

import { DASHBOARD_EDIT_BOX_TYPE } from './EditableBoxPreview';
import style from './style.css';

// Custom drag ghost, rendered by us instead of the browser. The native
// HTML5 preview is unreliable here — Safari rasterizes a blank image for
// cards using backdrop-filter (all our glass widgets), and the touch
// backend never had a preview at all — so dragging looked broken (no
// feedback, no error) depending on the machine. One layer, drawn the
// same everywhere, ends the lottery.
const EditorDragLayer = () => {
  const { itemType, item, isDragging, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getClientOffset()
  }));
  if (!isDragging || itemType !== DASHBOARD_EDIT_BOX_TYPE || !currentOffset) {
    return null;
  }
  return (
    <div class={style.dragLayer}>
      <div class={style.dragLayerPill} style={`transform: translate(${currentOffset.x}px, ${currentOffset.y}px)`}>
        <i class="fe fe-move" />
        {item && item.type ? <Text id={`dashboard.boxTitle.${item.type}`} /> : <Text id="dashboard.editorNewWidget" />}
      </div>
    </div>
  );
};

export default EditorDragLayer;
