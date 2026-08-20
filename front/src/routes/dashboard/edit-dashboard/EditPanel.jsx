import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import EditBox from './EditBox';
import DashboardSettingsForm from './DashboardSettingsForm';
import NewDashboardForm from './NewDashboardForm';
import style from './style.css';

// Side panel on desktop, bottom sheet on mobile. Hosts the dashboard
// settings, the dashboard creation form, or the existing EditBox switch —
// which itself shows the widget picker for a typeless box and the widget's
// own form otherwise.
// The `settings-page` class puts the whole panel under the Horizon form
// grammar (routes/settings/style.css): every widget edit form gets the
// themed inputs, selects and pill buttons without touching each form.
class EditPanel extends Component {
  setPanelRef = element => {
    this.panelElement = element;
  };

  // Dismiss on outside click/tap. pointerdown (not click) so it runs before
  // the outside element's own click: tapping another widget closes this
  // panel first, then that widget's click opens its own.
  handleOutsidePointerDown = event => {
    if (!this.panelElement || this.panelElement.contains(event.target)) {
      return;
    }
    // react-select menus are portaled to <body> so the panel's scroll
    // container can't clip them: they live outside the panel DOM but are
    // very much inside the interaction
    if (event.target.closest && event.target.closest('.react-select__menu-portal')) {
      return;
    }
    this.props.closeEditPanel();
  };

  componentDidMount() {
    document.addEventListener('pointerdown', this.handleOutsidePointerDown);
  }

  componentWillUnmount() {
    document.removeEventListener('pointerdown', this.handleOutsidePointerDown);
  }

  render(props) {
    const position = props.editingBoxPosition;
    const box = position && props.homeDashboard.boxes[position.x] && props.homeDashboard.boxes[position.x][position.y];
    const open = props.dashboardSettingsOpen || props.newDashboardOpen || Boolean(box);
    if (!open) {
      return null;
    }
    return (
      <div class={cx(style.editPanel, 'settings-page')} data-cy="edit-panel" ref={this.setPanelRef}>
        <div class={style.editPanelHeader}>
          <strong>
            {box ? (
              box.type ? (
                <Text id={`dashboard.boxTitle.${box.type}`} />
              ) : (
                <Text id="dashboard.editorNewWidget" />
              )
            ) : props.newDashboardOpen ? (
              <Text id="newDashboard.cardTitle" />
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
          {!box && props.newDashboardOpen && <NewDashboardForm closeEditPanel={props.closeEditPanel} />}
          {!box && !props.newDashboardOpen && <DashboardSettingsForm {...props} />}
        </div>
      </div>
    );
  }
}

export default EditPanel;
