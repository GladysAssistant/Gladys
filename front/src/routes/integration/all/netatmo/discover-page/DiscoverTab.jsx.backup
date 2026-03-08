import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import StateConnection from './StateConnection';
import style from './style.css';
import NetatmoDeviceBox from '../NetatmoDeviceBox';
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
        discoveredDevices: [],
        loading: false,
        errorLoading: true
      });
    }
  };
  refreshDiscoveredDevices = async () => {
    this.setState({
      loading: true
    });
    try {
      const discoveredDevices = await this.props.httpClient.get('/api/v1/service/netatmo/discover', { refresh: true });
      this.setState({
        discoveredDevices,
        loading: false,
        errorLoading: false
      });
    } catch (e) {
      this.setState({
        discoveredDevices: [],
        loading: false,
        errorLoading: true
      });
    }
  };

  render(props, { loading, errorLoading, discoveredDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.netatmo.discover.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.refreshDiscoveredDevices} class="btn btn-outline-primary ml-2" disabled={loading}>
              {!discoveredDevices && <Text id="integration.netatmo.discover.scan" />}
              {discoveredDevices && <Text id="integration.netatmo.discover.refresh" />}
              <i class="fe fe-radio" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <StateConnection {...props} errorLoading={errorLoading} />
          <div class="alert alert-secondary">
            <p>
              <Text id="integration.netatmo.discover.description" />
            </p>
            <p>
              <MarkupText id="integration.netatmo.discover.descriptionCompatibility" />
            </p>
            <p>
              <MarkupText id="integration.netatmo.discover.descriptionInformation" />
            </p>
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.netatmoListBody)}>
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
