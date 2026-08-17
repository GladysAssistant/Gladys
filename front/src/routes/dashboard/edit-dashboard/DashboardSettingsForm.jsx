import { Text, Localizer } from 'preact-i18n';

import IconSelector from '../../../components/scene/IconSelector';
import { DASHBOARD_VISIBILITY_LIST, DASHBOARD_WIDTH_LIST } from '../../../../../server/utils/constants';

// Dashboard-level settings (name, visibility, background, width, icon),
// hosted in the edit panel so the canvas stays free of forms
const DashboardSettingsForm = ({ children, ...props }) => (
  <div>
    <div class="form-group">
      <label class="form-label">
        <Text id="dashboard.editDashboardNameLabel" />
      </label>
      <Localizer>
        <input
          type="text"
          class="form-control"
          placeholder={<Text id="dashboard.editDashboardNameLabel" />}
          value={props.homeDashboard.name}
          onInput={props.updateCurrentDashboardName}
        />
      </Localizer>
    </div>
    <div class="form-group">
      <label class="form-label">
        <Text id="dashboard.editDashboardVisibility" />
      </label>
      <small class="d-block mb-2">
        <Text id="dashboard.editDashboardVisibilityDescription" />
      </small>
      {props.user.id !== props.homeDashboard.user_id && (
        <div>
          <small>
            <Text id="dashboard.editDashboardVisibilityNotEditableNotCreator" />
          </small>
        </div>
      )}
      <select
        value={props.homeDashboard.visibility}
        onChange={props.updateCurrentDashboardVisibility}
        disabled={props.user.id !== props.homeDashboard.user_id}
        class="form-control"
      >
        {DASHBOARD_VISIBILITY_LIST.map(dashboardVisibility => (
          <option value={dashboardVisibility}>
            <Text id={`dashboard.visibilities.${dashboardVisibility}`} />
          </option>
        ))}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">
        <Text id="dashboard.editDashboardBackgroundImageLabel" />
      </label>
      <Localizer>
        <input
          type="text"
          class="form-control"
          placeholder={<Text id="dashboard.editDashboardBackgroundImagePlaceholder" />}
          value={props.homeDashboard.background_image}
          onInput={e => props.updateCurrentDashboardProperty('background_image', e.target.value || null)}
        />
      </Localizer>
    </div>
    <div class="form-group">
      <label class="form-label">
        <Text id="dashboard.editDashboardWidthLabel" />
      </label>
      <select
        class="form-control"
        value={props.homeDashboard.width || 'standard'}
        onChange={e =>
          props.updateCurrentDashboardProperty('width', e.target.value === 'standard' ? null : e.target.value)
        }
      >
        {DASHBOARD_WIDTH_LIST.map(dashboardWidth => (
          <option value={dashboardWidth}>
            <Text id={`dashboard.widths.${dashboardWidth}`} />
          </option>
        ))}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">
        <Text id="dashboard.editDashboardIconLabel" />
      </label>
      <small class="d-block mb-2">
        <Text id="dashboard.editDashboardIconDescription" />
      </small>
      <IconSelector
        value={props.homeDashboard.icon}
        onChange={e => props.updateCurrentDashboardProperty('icon', e.target.value)}
      />
    </div>
  </div>
);

export default DashboardSettingsForm;
