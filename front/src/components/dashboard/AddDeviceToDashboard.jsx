import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { route } from 'preact-router';
import get from 'get-value';

import AddToDashboardSheet from './AddToDashboardSheet';
import { MobileGroup, MobileRow } from '../mobile/MobileList';
import MobileToast from '../mobile/MobileToast';
import { getMainFeatures } from '../../utils/deviceWidgetSuggestions';

/**
 * @description "Add to a dashboard" on the page of a device (docs/specs/dashboard-flexible-layout-
 * and-widgets.md, A.3.2): the device goes to a dashboard without searching for it in a picker —
 * its main features (all but battery, signal...: getMainFeatures; a light lands as one row), in a
 * "devices" widget of the chosen dashboard or a new one ("Where to add it?", AddToDashboardSheet).
 * A toast confirms, with a link to that dashboard. Only for a device already saved: a device being
 * created has no feature on the server yet. variant: 'row' (phone page) or 'button' (desktop card).
 */
class AddDeviceToDashboard extends Component {
  state = {
    open: false,
    toast: null
  };

  open = () => this.setState({ open: true });

  close = () => this.setState({ open: false });

  // "Added to “Home”" (a new widget), "Added to “Lights”" (an existing one)
  onAdded = ({ after, newWidget, widgetName }) => {
    this.setState({
      open: false,
      toast: {
        selector: after.selector,
        message: <Text id="addToDashboard.addedTo" fields={{ name: newWidget ? after.name : widgetName }} />
      }
    });
  };

  see = () => {
    const { toast } = this.state;
    if (toast) {
      route(`/dashboard/${toast.selector}`);
    }
  };

  closeToast = () => this.setState({ toast: null });

  render({ device, variant }, { open, toast }) {
    const selectors = getMainFeatures(device)
      .map(feature => feature.selector)
      .filter(Boolean);
    if (!device || !device.created_at || selectors.length === 0) {
      return null;
    }
    return (
      <div>
        {variant === 'button' ? (
          <button
            type="button"
            class="btn btn-outline-primary mr-2"
            onClick={this.open}
            data-cy="device-add-to-dashboard"
          >
            <i class="fe fe-layout mr-1" aria-hidden="true" />
            <Text id="addToDashboard.button" />
          </button>
        ) : (
          <MobileGroup>
            <MobileRow
              icon="layout"
              title={<Text id="addToDashboard.button" />}
              subtitle={get(device, 'name')}
              onClick={this.open}
              dataCy="device-add-to-dashboard"
            />
          </MobileGroup>
        )}
        <AddToDashboardSheet
          open={open}
          selectors={selectors}
          allowDashboardChoice
          onClose={this.close}
          onAdded={this.onAdded}
        />
        <MobileToast
          message={toast && toast.message}
          actionLabel={<Text id="addToDashboard.see" />}
          onAction={this.see}
          onClose={this.closeToast}
          duration={6000}
          aboveBar={variant !== 'button'}
          dataCy="device-add-to-dashboard-toast"
        />
      </div>
    );
  }
}

export default AddDeviceToDashboard;
