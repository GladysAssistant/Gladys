import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import NetatmoDeviceBox from '../NetatmoDeviceBox';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { RequestStatus } from '../../../../../utils/consts';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

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

  async getRefreshDiscovered() {
    this.setState({
      loading: true
    });
    try {
      const discoveredDevices = await this.props.httpClient.get('/api/v1/service/netatmo/device');
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
  }

  async getDiscoveredDevices() {
    this.setState({
      loading: true
    });
    try {
      const discoveredDevices = await this.props.httpClient.get('/api/v1/service/netatmo/discover');
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
  }

  render(props, { loading, errorLoading, discoveredDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.netatmo.discover.title" />
          </h1>
          <div class="page-options d-flex">
            <button
              onClick={this.getRefreshDiscovered.bind(this)}
              class="btn btn-outline-primary ml-2"
              disabled={loading}
            >
              {!discoveredDevices && <Text id="integration.netatmo.discover.scan" />}
              {discoveredDevices && <Text id="integration.netatmo.discover.refresh" />}
              <i class="fe fe-radio" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-secondary">
            <p>
              <Text id="integration.netatmo.discover.description" />
            </p>
            <p>
              <MarkupText id="integration.netatmo.discover.descriptionCompatibility" />
            </p>
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.netatmoListBody)}>
              {console.log(props)}
              {!props.accessDenied &&
                ((props.connectNetatmoStatus === STATUS.CONNECTING && (
                  <p class="text-center alert alert-info">
                    <Text id="integration.netatmo.setup.connecting" />
                  </p>
                )) ||
                  (props.connectNetatmoStatus === STATUS.NOT_INITIALIZED && (
                    <p class="text-center alert alert-warning">
                      <Text id="integration.netatmo.setup.notConfigured" />
                    </p>
                  )) ||
                  (props.connectNetatmoStatus === STATUS.PROCESSING_TOKEN && (
                    <p class="text-center alert alert-warning">
                      <Text id="integration.netatmo.setup.processingToken" />
                    </p>
                  )) ||
                  (props.connectNetatmoStatus === STATUS.CONNECTED && (
                    <p class="text-center alert alert-success">
                      <Text id="integration.netatmo.setup.connect" />
                    </p>
                  )) ||
                  (props.connectNetatmoStatus === STATUS.DISCONNECTED && (
                    <p class="text-center alert alert-danger">
                      <Text id="integration.netatmo.setup.disconnect" />
                    </p>
                  ))
                )
              }
              {errorLoading && (
                <p class="alert alert-warning">
                  <Text id="integration.netatmo.status.notConnected" />
                  <Link href="/dashboard/integration/device/netatmo/setup">
                    <Text id="integration.netatmo.status.setupPageLink" />
                  </Link>
                </p>
              )}

              <div class="row">
                {discoveredDevices &&
                  discoveredDevices.map((device, index) => (
                    <NetatmoDeviceBox
                      editable={!device.created_at || device.updatable}
                      alreadyCreatedButton={!device.created_at && !device.updatable}
                      updateButton={device.updatable}
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

export default connect('httpClient', {})(DiscoverTab);
