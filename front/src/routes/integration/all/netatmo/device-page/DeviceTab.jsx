import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import NetatmoDeviceBox from '../NetatmoDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getNetatmoDevices();
    this.getHouses();
  }

  async getNetatmoDevices() {
    this.setState({
      getNetatmoStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const netatmoDevices = await this.props.httpClient.get('/api/v1/service/netatmo/device', options);
      this.setState({
        netatmoDevices,
        getNetatmoStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getNetatmoStatus: e.message
      });
    }
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

  async search(e) {
    await this.setState({
      search: e.target.value
    });
    this.getNetatmoDevices();
  }
  changeOrderDir(e) {
    this.setState({
      orderDir: e.target.value
    });
    this.getNetatmoDevices();
  }

  render(props, { orderDir, search, getNetatmoStatus, netatmoDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.netatmo.device.title" />
          </h1>
          <div class="page-options d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={this.changeOrderDir.bind(this)}
                orderValue={orderDir}
                search={this.debouncedSearch}
                searchValue={search}
                searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: getNetatmoStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.netatmoListBody)}>
              {!props.accessDenied &&
                ((props.connectNetatmoStatus === STATUS.CONNECTING && (
                  <p class="text-center alert alert-info">
                    <Text id="integration.netatmo.setup.connecting" />
                  </p>
                )) ||
                  (props.connectNetatmoStatus === STATUS.GET_DEVICES_VALUES && (
                    <p class="text-center alert alert-info">
                      <Text id="integration.netatmo.device.getDevicesValues" />
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
                  )))}
              <div class="row">
                {netatmoDevices &&
                  netatmoDevices.length > 0 &&
                  netatmoDevices.map((device, index) => (
                    <NetatmoDeviceBox
                      editable
                      editButton
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      showMostRecentValueAt={device.created_at && !device.updatable}
                      getNetatmoDevices={this.getNetatmoDevices.bind(this)}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!netatmoDevices || (netatmoDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
