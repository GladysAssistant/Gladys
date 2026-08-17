import { Text } from 'preact-i18n';

import EditBox from './EditBox';
import DashboardSettingsForm from './DashboardSettingsForm';
import style from './style.css';

// Side panel on desktop, bottom sheet on mobile. Hosts either the dashboard
// settings or the existing EditBox switch — which itself shows the widget
// picker for a typeless box and the widget's own form otherwise.
const EditPanel = ({ children, ...props }) => {
  const position = props.editingBoxPosition;
  const box = position && props.homeDashboard.boxes[position.x] && props.homeDashboard.boxes[position.x][position.y];
  const open = props.dashboardSettingsOpen || Boolean(box);
  if (!open) {
    return null;
  }
  return (
    <div class={style.editPanel} data-cy="edit-panel">
      <div class={style.editPanelHeader}>
        <strong>
          {box ? (
            box.type ? (
              <Text id={`dashboard.boxTitle.${box.type}`} />
            ) : (
              <Text id="dashboard.editorNewWidget" />
            )
          ) : (
            <Text id="dashboard.editorDashboardSettings" />
          )}
        </strong>
        <button type="button" class={style.editPanelClose} onClick={props.closeEditPanel}>
          <i class="fe fe-x" />
        </button>
      </div>
      <div class={style.editPanelBody}>
        {box && <EditBox {...props} box={box} x={position.x} y={position.y} isMobileReordering={false} />}
        {!box && <DashboardSettingsForm {...props} />}
      </div>
    </div>
  );
};

export default EditPanel;
