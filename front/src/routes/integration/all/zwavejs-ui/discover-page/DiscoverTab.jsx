import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import ZwaveJSUIDeviceBox from '../ZwaveJSUIDeviceBox';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class DiscoverTab extends Component {
  scan = async () => {
    try {
      await this.props.httpClient.post('/api/v1/service/zwavejs-ui/discover');
    } catch (e) {
      console.error(e);
    }
  };

  getDiscoveredDevices = async () => {
    this.setState({
      loading: true
    });
    try {
      const discoveredDevices = await this.props.httpClient.get('/api/v1/service/zwavejs-ui/node');
      const existingZwaveJSUIDevices = await this.props.httpClient.get('/api/v1/service/zwavejs-ui/device', {});
      discoveredDevices.forEach(discoveredDevice => {
        const existingDevice = existingZwaveJSUIDevices.find(d => d.external_id === discoveredDevice.external_id);
        if (existingDevice) {
          discoveredDevice.alreadyExist = true;
        }
      });
      this.setState({
        discoveredDevices,
        loading: false,
        errorLoading: false
      });
    } catch (e) {
      this.setState({
        loading: false,
        errorLoading: true
      });
    }
  };

  async componentWillMount() {
    this.getDiscoveredDevices();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.SCAN_COMPLETED,
      this.getDiscoveredDevices
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.SCAN_COMPLETED,
      this.getDiscoveredDevices
    );
  }

  render(props, { loading, errorLoading, discoveredDevices }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.zwavejs-ui.discover.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.scan} class="btn btn-outline-primary ml-2" disabled={loading}>
              <Text id="integration.zwavejs-ui.discover.scan" /> <i class="fe fe-radio" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-warning">
            <Text id="integration.zwavejs-ui.alphaWarning" />
          </div>
          <div class="alert alert-secondary">
            <Text id="integration.zwavejs-ui.discover.description" />
          </div>
          {errorLoading && (
            <div class="alert alert-danger">
              <Text id="integration.zwavejs-ui.discover.errorWhileScanning" />
            </div>
          )}
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.zwaveJSUIListBody)}>
              <div class="row">
                {discoveredDevices &&
                  discoveredDevices.map((device, index) => (
                    <ZwaveJSUIDeviceBox saveButton device={device} deviceIndex={index} />
                  ))}
                {!discoveredDevices || (discoveredDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(DiscoverTab);
