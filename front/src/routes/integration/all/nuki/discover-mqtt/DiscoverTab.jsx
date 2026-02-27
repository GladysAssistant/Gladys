import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import EmptyState from '../EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from '../style.css';
import CheckMqttPanel from '../../mqtt/commons/CheckMqttPanel';
import NukiDeviceBox from '../NukiDeviceBox';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class DiscoverTab extends Component {
  async componentWillMount() {
    this.getDiscoveredDevices();
    this.getHouses();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_MQTT_DEVICE, this.addDiscoveredDevice);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_MQTT_DEVICE,
      this.addDiscoveredDevice
    );
  }

  searchDevices = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.httpClient.post(`/api/v1/service/nuki/discover/mqtt`);
      this.setState({
        discoveredDevices: [],
        errorLoading: false
      });

      setTimeout(this.setState, 5000, {
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false,
        errorLoading: true
      });
    }
  };

  getDiscoveredDevices = async () => {
    this.setState({
      loading: true
    });
    try {
      const discoveredDevices = await this.props.httpClient.get(`/api/v1/service/nuki/discover/mqtt`);
      this.setState({
        discoveredDevices,
        loading: false,
        errorLoading: false
      });
    } catch (e) {
      this.setState({
        discoveredDevices: undefined,
        loading: false,
        errorLoading: true
      });
    }
  };

  addDiscoveredDevice = newDevice => {
    const existingDevices = this.state.discoveredDevices || [];
    const newDevices = [];

    let added = false;
    existingDevices.forEach(device => {
      if (device.external_id === newDevice.external_id) {
        newDevices.push(newDevice);
        added = true;
      } else {
        newDevices.push(device);
      }
    });

    if (!added) {
      newDevices.push(newDevice);
    }

    this.setState({
      discoveredDevices: newDevices,
      loading: false
    });
  };

  async getHouses() {
    this.setState({
      housesGetStatus: RequestStatus.Getting
    });
    try {
      const params = {
        expand: 'rooms'
      };
      const housesWithRooms = await this.props.httpClient.get(`/api/v1/house`, params);
      this.setState({
        housesWithRooms,
        housesGetStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        housesGetStatus: RequestStatus.Error
      });
    }
  }

  render(props, { loading, errorLoading, discoveredDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.nuki.discover.mqtt.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.searchDevices} class="btn btn-outline-primary ml-2" disabled={loading}>
              <Text id="integration.nuki.discover.mqtt.scan" /> <i class="fe fe-radio" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <CheckMqttPanel />

          <div class="alert alert-secondary">
            <Text id="integration.nuki.discover.mqtt.description" />
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.nukiListBody)}>
              {errorLoading && (
                <p class="alert alert-danger">
                  <Text id="integration.nuki.discover.error" />
                </p>
              )}
              <div class="row">
                {discoveredDevices &&
                  discoveredDevices.map((device, index) => (
                    <NukiDeviceBox
                      {...props}
                      editable={!device.created_at || device.updatable}
                      alreadyCreatedButton={device.created_at && !device.updatable}
                      saveButton={!device.created_at}
                      device={device}
                      deviceIndex={index}
                      housesWithRooms={housesWithRooms}
                    />
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

export default connect('session,httpClient', {})(DiscoverTab);
