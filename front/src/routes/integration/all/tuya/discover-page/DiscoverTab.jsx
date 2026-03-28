import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import TuyaDeviceBox from '../TuyaDeviceBox';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { RequestStatus } from '../../../../../utils/consts';

const getDeviceRank = device => {
  if (!device || typeof device !== 'object') {
    return 4;
  }
  const isCreated = !!device.created_at;
  const hasFeatures = device.features && device.features.length > 0;
  const isUpdatable = !!device.updatable;
  if (!isCreated && hasFeatures) {
    return 0;
  }
  if (isCreated && isUpdatable) {
    return 1;
  }
  if (!isCreated && !hasFeatures) {
    return 2;
  }
  if (isCreated && !isUpdatable) {
    return 3;
  }
  return 4;
};

const sortDevices = devices =>
  [...devices].sort((a, b) => {
    const rankDiff = getDeviceRank(a) - getDeviceRank(b);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    const nameA = ((a && a.name) || '').toLowerCase();
    const nameB = ((b && b.name) || '').toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });

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
      loading: true
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

  runLocalScan = async () => {
    this.setState({
      udpScanLoading: true,
      udpScanError: false,
      udpScanPortErrors: null
    });
    try {
      const response = await this.props.httpClient.post('/api/v1/service/tuya/local-scan', {
        timeoutSeconds: 10
      });
      if (response && Array.isArray(response.devices) && response.devices.length > 0) {
        this.setState({
          discoveredDevices: response.devices
        });
      } else {
        await this.getDiscoveredDevices();
      }
      this.setState({
        udpScanLoading: false,
        udpScanPortErrors: response && response.port_errors ? response.port_errors : null
      });
    } catch (e) {
      this.setState({
        udpScanLoading: false,
        udpScanError: true
      });
    }
  };

  handleDeviceSaved = savedDevice => {
    if (!savedDevice || !savedDevice.external_id) {
      this.getDiscoveredDevices();
      return;
    }
    this.setState(prevState => {
      const { discoveredDevices } = prevState;
      if (!Array.isArray(discoveredDevices)) {
        return null;
      }
      return {
        discoveredDevices: discoveredDevices.map(device => {
          if (device.external_id !== savedDevice.external_id) {
            return device;
          }
          return {
            ...device,
            ...savedDevice,
            updatable: false
          };
        })
      };
    });
  };

  render(
    props,
    { loading, errorLoading, discoveredDevices, housesWithRooms, udpScanLoading, udpScanError, udpScanPortErrors }
  ) {
    const isLoading = loading || udpScanLoading;
    const canScanCloud = !isLoading;
    const localScanTextId = errorLoading
      ? 'integration.tuya.discover.scanLocalInProgressDisconnected'
      : 'integration.tuya.discover.scanLocalInProgressConnected';
    const scanTextId = udpScanLoading
      ? localScanTextId
      : loading
      ? 'integration.tuya.discover.scanCloudInProgress'
      : null;
    const portErrorPorts = udpScanPortErrors ? Object.keys(udpScanPortErrors) : [];
    const orderedDevices = Array.isArray(discoveredDevices) ? sortDevices(discoveredDevices) : [];

    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tuya.discover.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.getDiscoveredDevices} class="btn btn-outline-primary ml-2" disabled={!canScanCloud}>
              <Text id="integration.tuya.discover.scanCloud" /> <i class="fe fe-radio" />
            </button>
            <button onClick={this.runLocalScan} class="btn btn-outline-success ml-2" disabled={isLoading}>
              <Text id="integration.tuya.discover.localScanAuto" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <MarkupText id="integration.tuya.discover.localDiscoveryInfo" />
          </div>
          <div class="alert alert-secondary">
            <Text id="integration.tuya.discover.description" />
          </div>
          {udpScanError && (
            <div class="alert alert-danger">
              <Text id="integration.tuya.discover.udpScanError" />
            </div>
          )}
          {isLoading && scanTextId && (
            <div class={cx('alert alert-info', style.scanLoader)}>
              <div class="loader" />
              <Text id={scanTextId} />
            </div>
          )}
          {portErrorPorts.length > 0 && (
            <div class="alert alert-warning">
              <Localizer>
                <span>
                  <Text
                    id="integration.tuya.discover.udpScanPortInUse"
                    fields={{
                      ports: portErrorPorts.join(', ')
                    }}
                  />
                </span>
              </Localizer>
            </div>
          )}
          <div
            class={cx('dimmer', {
              active: isLoading
            })}
          >
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
                {orderedDevices.map((device, index) => (
                  <TuyaDeviceBox
                    key={device.external_id || device.id || index}
                    editable={!device.created_at || device.updatable}
                    alreadyCreatedButton={device.created_at && !device.updatable}
                    updateButton={device.updatable}
                    saveButton={!device.created_at}
                    device={device}
                    deviceIndex={index}
                    housesWithRooms={housesWithRooms}
                    onDeviceSaved={this.handleDeviceSaved}
                  />
                ))}
                {orderedDevices.length === 0 && <EmptyState />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DiscoverTab);
