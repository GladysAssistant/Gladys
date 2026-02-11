import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import TuyaDeviceBox from '../TuyaDeviceBox';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { RequestStatus } from '../../../../../utils/consts';

class DiscoverTab extends Component {
  async componentWillMount() {
    this.getDiscoveredDevices();
    this.getHouses();
  }

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

  getDiscoveredDevices = async () => {
    this.setState({
      loading: true,
      selectedDeviceIds: []
    });
    try {
      const discoveredDevices = await this.props.httpClient.get('/api/v1/service/tuya/discover');
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

  toggleSelectedDevice = externalId => {
    const selectedDeviceIds = new Set(this.state.selectedDeviceIds || []);
    if (selectedDeviceIds.has(externalId)) {
      selectedDeviceIds.delete(externalId);
    } else {
      selectedDeviceIds.add(externalId);
    }
    this.setState({
      selectedDeviceIds: Array.from(selectedDeviceIds)
    });
  };

  addSelectedDevices = async () => {
    const selectedDeviceIds = this.state.selectedDeviceIds || [];
    const discoveredDevices = this.state.discoveredDevices || [];
    const devicesToAdd = discoveredDevices.filter(device => selectedDeviceIds.includes(device.external_id));

    if (devicesToAdd.length === 0) {
      return;
    }

    this.setState({
      addingSelected: true,
      errorAddingSelected: false
    });

    try {
      await Promise.all(devicesToAdd.map(device => this.props.httpClient.post('/api/v1/device', device)));
      await this.getDiscoveredDevices();
      this.setState({
        addingSelected: false,
        selectedDeviceIds: []
      });
    } catch (e) {
      this.setState({
        addingSelected: false,
        errorAddingSelected: true
      });
    }
  };

  render(props, { loading, errorLoading, discoveredDevices, housesWithRooms, selectedDeviceIds, addingSelected, errorAddingSelected }) {
    const selectedCount = (selectedDeviceIds || []).length;
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tuya.discover.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.getDiscoveredDevices} class="btn btn-outline-primary ml-2" disabled={loading}>
              <Text id="integration.tuya.discover.scan" /> <i class="fe fe-radio" />
            </button>
            <button
              onClick={this.addSelectedDevices}
              class="btn btn-outline-success ml-2"
              disabled={loading || addingSelected || selectedCount === 0}
            >
              <Text id="integration.tuya.discover.addSelected" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-secondary">
            <Text id="integration.tuya.discover.description" />
          </div>
          {errorAddingSelected && (
            <div class="alert alert-danger">
              <Text id="integration.tuya.discover.addSelectedError" />
            </div>
          )}
          <div
            class={cx('dimmer', {
              active: loading || addingSelected
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.tuyaListBody)}>
              {errorLoading && (
                <p class="alert alert-warning">
                  <Text id="integration.tuya.status.notConnected" />
                  <Link href="/dashboard/integration/device/tuya/setup">
                    <Text id="integration.tuya.status.setupPageLink" />
                  </Link>
                </p>
              )}
              <div class="row">
                {discoveredDevices &&
                  discoveredDevices.map((device, index) => (
                    <TuyaDeviceBox
                      editable={!device.created_at || device.updatable}
                      alreadyCreatedButton={device.created_at && !device.updatable}
                      updateButton={device.updatable}
                      saveButton={!device.created_at}
                      selectable={!device.created_at || device.updatable}
                      selected={selectedDeviceIds && selectedDeviceIds.includes(device.external_id)}
                      onToggleSelected={this.toggleSelectedDevice}
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

export default connect('httpClient', {})(DiscoverTab);
