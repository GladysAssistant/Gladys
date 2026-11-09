import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EditBox from './EditBox';
import DashboardSettingsForm from './DashboardSettingsForm';
import NewDashboardForm from './NewDashboardForm';
import { revealAbovePanel } from '../../../utils/revealAbovePanel';
import style from './style.css';

// Below this travel, a press outside the panel is a tap (it closes the
// panel); beyond it, the finger was scrolling the canvas
const TAP_MAX_TRAVEL_PX = 10;
// Grab-handle travel that switches the sheet height (or closes it)
const GRAB_SWITCH_PX = 40;
// How long the click that may follow a grab-handle drag is swallowed
const CLICK_SUPPRESS_MS = 400;

// A drag on the grab handle must not end with a click: with a mouse (or a
// late synthetic click on iOS) the release's click would toggle the height
// back, or — when the drag closed the sheet — land on the canvas under the
// finger and reopen a widget. Same guard as the pointer-drag engine.
const suppressNextClick = () => {
  const suppress = clickEvent => {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();
    removeSuppress();
  };
  const removeSuppress = () => {
    window.removeEventListener('click', suppress, true);
  };
  window.addEventListener('click', suppress, true);
  window.setTimeout(removeSuppress, CLICK_SUPPRESS_MS);
};

// What the panel shows, resolved against the dashboard: a position that no
// longer points at a box (a column inserted before it…) is no target. The
// action bar and the canvas spacing read the same resolution, so they never
// stay in "panel open" mode while no panel is shown.
const getPanelTarget = props => {
  const position = props.editingBoxPosition;
  const box = position && props.homeDashboard.boxes[position.x] && props.homeDashboard.boxes[position.x][position.y];
  if (box) {
    return { box, key: `box-${position.x}-${position.y}` };
  }
  if (props.newDashboardOpen) {
    return { key: 'new-dashboard' };
  }
  if (props.dashboardSettingsOpen) {
    return { key: 'dashboard-settings' };
  }
  return null;
};

// Side panel on desktop, bottom sheet on mobile. Hosts the dashboard
// settings, the dashboard creation form, or the existing EditBox switch —
// which itself shows the widget picker for a typeless box and the widget's
// own form otherwise.
// The `settings-page` class puts the whole panel under the Horizon form
// grammar (routes/settings/style.css): every widget edit form gets the
// themed inputs, selects and pill buttons without touching each form.
//
// On mobile the sheet has two heights: compact (the edited widget stays
// visible above it, brought there by revealAbovePanel) and expanded. The
// grab handle switches them (tap or drag) and closes the sheet when dragged
// down from the compact height. A form with several views can drive the
// panel through two props: setPanelHeader({ title, backLabel, onBack })
// replaces the header title and adds a back button, setPanelExpanded(bool)
// asks for the expanded height (a full-height picker).
class EditPanel extends Component {
  state = {
    targetKey: null,
    expanded: false,
    header: null
  };

  setPanelRef = element => {
    this.panelElement = element;
  };

  setPanelHeader = header => {
    this.setState({ header });
  };

  setPanelExpanded = expanded => {
    this.setState({ expanded: Boolean(expanded) });
  };

  isOutside = event => {
    if (!this.panelElement || this.panelElement.contains(event.target)) {
      return false;
    }
    // react-select menus are portaled to <body> so the panel's scroll
    // container can't clip them: they live outside the panel DOM but are
    // very much inside the interaction
    if (event.target.closest && event.target.closest('.react-select__menu-portal')) {
      return false;
    }
    return true;
  };

  // Dismiss on an outside TAP, not on any outside press: a finger put on the
  // canvas to scroll it (to look at the widget being edited) must not close
  // the panel. The tap is decided on pointerup, which runs before the click:
  // tapping another widget closes this panel first, then that widget's click
  // opens its own. A touch that turns into a scroll ends with pointercancel.
  handleOutsidePointerDown = event => {
    this.outsidePress = this.isOutside(event)
      ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
      : null;
  };

  handleOutsidePointerUp = event => {
    const press = this.outsidePress;
    this.outsidePress = null;
    if (!press || press.pointerId !== event.pointerId || !this.isOutside(event)) {
      return;
    }
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_MAX_TRAVEL_PX) {
      return;
    }
    this.props.closeEditPanel();
  };

  handleOutsidePointerCancel = () => {
    this.outsidePress = null;
  };

  onGrabClick = () => {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  onGrabPointerDown = event => {
    const panel = this.panelElement;
    if (!panel || event.button > 0) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget;
    const startY = event.clientY;
    const startHeight = panel.offsetHeight;
    const maxHeight = window.innerHeight - 64;
    let travel = 0;
    try {
      handle.setPointerCapture(event.pointerId);
    } catch (e) {} // eslint-disable-line no-empty
    panel.classList.add(style.editPanelDragging);
    const onMove = moveEvent => {
      travel = moveEvent.clientY - startY;
      panel.style.maxHeight = 'none';
      panel.style.height = `${Math.max(120, Math.min(maxHeight, startHeight - travel))}px`;
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      panel.classList.remove(style.editPanelDragging);
      panel.style.height = '';
      panel.style.maxHeight = '';
      // a tap is handled by the click (onGrabClick): toggling here, on
      // pointerup, resized the sheet BEFORE the browser dispatched the tap's
      // click — which then landed on whatever had just moved under the
      // finger (a row of the form, opening it)
      if (Math.abs(travel) > TAP_MAX_TRAVEL_PX) {
        suppressNextClick();
      }
      if (travel < -GRAB_SWITCH_PX) {
        this.setState({ expanded: true });
      } else if (travel > GRAB_SWITCH_PX) {
        if (this.state.expanded) {
          this.setState({ expanded: false });
        } else {
          this.props.closeEditPanel();
        }
      }
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  };

  revealEditedWidget = () => {
    // after the sheet has its height: the reveal measures where it starts
    requestAnimationFrame(() => {
      const widget = document.querySelector('[data-widget-wrapper][data-editing]');
      revealAbovePanel(widget, this.panelElement);
    });
  };

  componentDidMount() {
    document.addEventListener('pointerdown', this.handleOutsidePointerDown);
    document.addEventListener('pointerup', this.handleOutsidePointerUp);
    document.addEventListener('pointercancel', this.handleOutsidePointerCancel);
  }

  // a new target (another widget, the settings…) starts compact, with the
  // panel's own header
  static getDerivedStateFromProps(props, state) {
    const target = getPanelTarget(props);
    const targetKey = target ? target.key : null;
    if (targetKey === state.targetKey) {
      return null;
    }
    return { targetKey, expanded: false, header: null };
  }

  componentDidUpdate(previousProps, previousState) {
    const target = getPanelTarget(this.props);
    if (target && target.box && previousState.targetKey !== this.state.targetKey) {
      this.revealEditedWidget();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('pointerdown', this.handleOutsidePointerDown);
    document.removeEventListener('pointerup', this.handleOutsidePointerUp);
    document.removeEventListener('pointercancel', this.handleOutsidePointerCancel);
  }

  render(props, { expanded, header }) {
    const target = getPanelTarget(props);
    if (!target) {
      return null;
    }
    const { box } = target;
    const position = props.editingBoxPosition;
    const defaultTitle = box ? (
      box.type ? (
        <Text id={`dashboard.boxTitle.${box.type}`} />
      ) : (
        <Text id="dashboard.editorNewWidget" />
      )
    ) : props.newDashboardOpen ? (
      <Text id="newDashboard.cardTitle" />
    ) : (
      <Text id="dashboard.editorDashboardSettings" />
    );
    const hasBack = Boolean(header && header.onBack);
    return (
      <div
        class={cx(style.editPanel, 'settings-page', { [style.editPanelExpanded]: expanded })}
        data-cy="edit-panel"
        ref={this.setPanelRef}
      >
        <Localizer>
          <button
            type="button"
            class={cx(style.editPanelGrab, 'd-lg-none')}
            onPointerDown={this.onGrabPointerDown}
            onClick={this.onGrabClick}
            aria-label={expanded ? <Text id="dashboard.editPanelCollapse" /> : <Text id="dashboard.editPanelExpand" />}
            aria-expanded={expanded ? 'true' : 'false'}
            data-cy="edit-panel-grab"
          />
        </Localizer>
        <div class={cx(style.editPanelHeader, { [style.editPanelHeaderWithBack]: hasBack })}>
          {hasBack && (
            <button type="button" class={style.editPanelBack} onClick={header.onBack} data-cy="edit-panel-back">
              <i class="fe fe-chevron-left" />
              <span>{header.backLabel}</span>
            </button>
          )}
          <strong class={style.editPanelTitle}>{(header && header.title) || defaultTitle}</strong>
          <Localizer>
            <button
              type="button"
              class={style.editPanelClose}
              onClick={props.closeEditPanel}
              aria-label={<Text id="dashboard.editPanelClose" />}
              data-cy="edit-panel-close"
            >
              <i class="fe fe-x" />
            </button>
          </Localizer>
        </div>
        <div class={style.editPanelBody}>
          {box && (
            <EditBox
              {...props}
              key={target.key}
              box={box}
              x={position.x}
              y={position.y}
              isMobileReordering={false}
              setPanelHeader={this.setPanelHeader}
              setPanelExpanded={this.setPanelExpanded}
            />
          )}
          {!box && props.newDashboardOpen && <NewDashboardForm closeEditPanel={props.closeEditPanel} />}
          {!box && !props.newDashboardOpen && <DashboardSettingsForm {...props} />}
        </div>
      </div>
    );
  }
}

const isEditPanelOpen = props => Boolean(props.homeDashboard && getPanelTarget(props));

export { isEditPanelOpen };
export default EditPanel;
