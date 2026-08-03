import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import get from 'get-value';
import debounce from 'debounce';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import DiscoverTab from './DiscoverTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

// the scan runs inside the integration and ends with a re-publish of the
// discovered devices (websocket event); an integration that never
// re-publishes would leave the loader spinning forever without this cap
const SCAN_MAX_DURATION_MS = 60 * 1000;

class ExternalIntegrationDiscoverPage extends Component {
  constructor(props) {
    super(props);
    // debounced: the list can hold up to 2000 devices and each keystroke
    // re-renders every visible card
    this.debouncedSearchDevices = debounce(this.searchDevices, 200);
  }

  searchDevices = e => {
    this.setState({ deviceSearch: e.target.value });
  };

  getIntegration = async () => {
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
      // a communication integration has no device screens: direct URL
      // access lands on the configuration screen instead
      if (get(integration, 'manifest.type') === 'communication') {
        route(`/dashboard/integration/device/external/${this.props.selector}/config`, true);
        return;
      }
      this.setState({ integration });
    } catch (e) {
      console.error(e);
    }
  };

  getDiscoveredDevices = async () => {
    this.setState({ getDiscoveredDevicesStatus: RequestStatus.Getting });
    try {
      const discoveredDevices = await this.props.httpClient.get(
        `/api/v1/external_integration/${this.props.selector}/discovered_device`
      );
      this.setState({ discoveredDevices, getDiscoveredDevicesStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ getDiscoveredDevicesStatus: RequestStatus.Error });
    }
  };

  scan = async () => {
    this.setState({ scanStatus: RequestStatus.Getting, scanError: null });
    try {
      await this.props.httpClient.post(`/api/v1/external_integration/${this.props.selector}/scan`);
      // the POST only relays the scan request: the integration scans on its
      // own (up to ~30s for a Tuya-like cloud integration) and the results
      // arrive later through the DISCOVERED_DEVICES_UPDATED websocket
      // event, so the scanning state stays on until that event
      this.clearScanTimer();
      this.scanTimer = setTimeout(this.finishScan, SCAN_MAX_DURATION_MS);
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      this.setState({
        scanStatus: RequestStatus.Error,
        scanError:
          status === 400
            ? 'integration.externalIntegration.discover.scanErrorDisconnected'
            : 'integration.externalIntegration.discover.scanError'
      });
    }
  };

  finishScan = () => {
    this.clearScanTimer();
    if (this.state.scanStatus === RequestStatus.Getting) {
      this.setState({ scanStatus: RequestStatus.Success });
    }
  };

  clearScanTimer = () => {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  };

  // by external_id, not by index: the Discovery screen filters the list
  // client-side, so an index in the filtered view does not point to the
  // same device in the full list
  createDevice = async externalId => {
    const discoveredDevice = this.state.discoveredDevices.find(device => device.external_id === externalId);
    // the list can be re-published (websocket refresh) between render and
    // click: the clicked device may be gone from the fresh list, and the
    // re-render is about to remove its card anyway
    if (!discoveredDevice) {
      return;
    }
    // the same standard POST creates the device or, when it already exists
    // (same external_id), applies the re-published definition (the
    // "Update" gesture of the Discovery screen)
    const device = { ...discoveredDevice };
    delete device.created;
    delete device.structure_changed;
    await this.props.httpClient.post('/api/v1/device', device);
    await this.getDiscoveredDevices();
  };

  onDiscoveredDevicesUpdated = payload => {
    if (payload && payload.selector === this.props.selector) {
      this.finishScan();
      this.getDiscoveredDevices();
    }
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      this.onDiscoveredDevicesUpdated
    );
    this.loadIntegrationPage();
  }

  loadIntegrationPage = () => {
    // a still-running scan belongs to the previous integration: its loader
    // and its timer must not leak into the page of the new one
    this.clearScanTimer();
    this.setState({ scanStatus: null, scanError: null });
    this.getIntegration();
    this.getDiscoveredDevices();
  };

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.loadIntegrationPage();
    }
  }

  componentWillUnmount() {
    this.clearScanTimer();
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      this.onDiscoveredDevicesUpdated
    );
  }

  render(props, state) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        <DiscoverTab
          {...state}
          selector={props.selector}
          scan={this.scan}
          createDevice={this.createDevice}
          searchDevices={this.debouncedSearchDevices}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationDiscoverPage);
