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
    // bumped on every page (re)load and on unmount, so a response resolving
    // after the user moved to another integration is dropped instead of
    // applying its state to the wrong page
    this.pageGeneration = 0;
    // bumped on every scan start and every scan end, so a scan POST
    // settling after its scan already ended (60s cap or websocket event)
    // cannot report its error on a later scan or on an ended one
    this.scanToken = 0;
  }

  searchDevices = (e) => {
    this.setState({ deviceSearch: e.target.value });
  };

  getIntegration = async () => {
    const generation = this.pageGeneration;
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
      if (generation !== this.pageGeneration) {
        return false;
      }
      // communication and weather integrations have no device screens:
      // direct URL access lands on the configuration screen instead
      if (['communication', 'weather'].includes(get(integration, 'manifest.type'))) {
        route(`/dashboard/integration/device/external/${this.props.selector}/config`, true);
        return false;
      }
      this.setState({ integration });
    } catch (e) {
      console.error(e);
      // no confirmed metadata: do not fire the device-specific requests
      return false;
    }
    return true;
  };

  getDiscoveredDevices = async () => {
    const generation = this.pageGeneration;
    this.setState({ getDiscoveredDevicesStatus: RequestStatus.Getting });
    try {
      const discoveredDevices = await this.props.httpClient.get(
        `/api/v1/external_integration/${this.props.selector}/discovered_device`,
      );
      if (generation !== this.pageGeneration) {
        return;
      }
      this.setState({ discoveredDevices, getDiscoveredDevicesStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      if (generation !== this.pageGeneration) {
        return;
      }
      this.setState({ getDiscoveredDevicesStatus: RequestStatus.Error });
    }
  };

  scan = async () => {
    const generation = this.pageGeneration;
    this.scanToken += 1;
    const scanToken = this.scanToken;
    // the POST only relays the scan request: the integration scans on its
    // own (up to ~30s for a Tuya-like cloud integration) and the results
    // arrive later through the DISCOVERED_DEVICES_UPDATED websocket event,
    // so the scanning state stays on until that event. The cap is armed
    // before the await: the request itself has no timeout, and a hung
    // request must not leave the loader spinning forever either.
    this.clearScanTimer();
    this.scanTimer = setTimeout(() => this.finishScan(scanToken), SCAN_MAX_DURATION_MS);
    this.setState({ scanStatus: RequestStatus.Getting, scanError: null });
    try {
      await this.props.httpClient.post(`/api/v1/external_integration/${this.props.selector}/scan`);
    } catch (e) {
      console.error(e);
      if (generation !== this.pageGeneration || scanToken !== this.scanToken) {
        return;
      }
      this.scanToken += 1;
      this.clearScanTimer();
      const status = get(e, 'response.status');
      this.setState({
        scanStatus: RequestStatus.Error,
        scanError:
          status === 400
            ? 'integration.externalIntegration.discover.scanErrorDisconnected'
            : 'integration.externalIntegration.discover.scanError',
      });
    }
  };

  finishScan = (scanToken) => {
    // called without a token by the websocket event (always the freshest
    // signal), with one by the 60s cap of a specific scan invocation
    if (scanToken !== undefined && scanToken !== this.scanToken) {
      return;
    }
    this.scanToken += 1;
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
  createDevice = async (externalId) => {
    const discoveredDevice = this.state.discoveredDevices.find((device) => device.external_id === externalId);
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

  onDiscoveredDevicesUpdated = (payload) => {
    if (payload && payload.selector === this.props.selector) {
      this.finishScan();
      this.getDiscoveredDevices();
    }
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      this.onDiscoveredDevicesUpdated,
    );
    this.loadIntegrationPage();
  }

  loadIntegrationPage = async () => {
    // requests and scan still in flight belong to the previous integration:
    // drop their late responses and clear their timer and their state so
    // nothing leaks into the page of the new one
    this.pageGeneration += 1;
    this.clearScanTimer();
    this.setState({ integration: null, discoveredDevices: null, scanStatus: null, scanError: null });
    // the integration metadata comes first: a communication or weather
    // integration redirects to the configuration screen before any
    // device-specific request is fired
    const hasDeviceScreens = await this.getIntegration();
    if (!hasDeviceScreens) {
      return;
    }
    this.getDiscoveredDevices();
  };

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.loadIntegrationPage();
    }
  }

  componentWillUnmount() {
    this.pageGeneration += 1;
    this.clearScanTimer();
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      this.onDiscoveredDevicesUpdated,
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
