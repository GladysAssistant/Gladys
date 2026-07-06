import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import TuyaDeviceBox from '../TuyaDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getTuyaDevices();
    this.getHouses();
    this.getServiceStatus();
  }

  getServiceStatus = async () => {
    try {
      const response = await this.props.httpClient.get('/api/v1/service/tuya/status');
      // `configured` reflects the presence of the cloud credentials: status alone is ambiguous,
      // `not_initialized` is also used after a manual cloud disconnect with credentials in place.
      this.setState({
        serviceNotConfigured: response && response.configured === false
      });
    } catch (e) {
      // Status is informational only: never block the device list on it.
      this.setState({ serviceNotConfigured: false });
    }
  };

  getTuyaDevices = async () => {
    this.setState({
      getTuyaStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const tuyaDevices = await this.props.httpClient.get('/api/v1/service/tuya/device', options);
      this.setState({
        tuyaDevices,
        getTuyaStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getTuyaStatus: e.message
      });
    }
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

  async search(e) {
    await this.setState({
      search: e.target.value
    });
    this.getTuyaDevices();
  }

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getTuyaDevices();
  };

  render({}, { orderDir, search, getTuyaStatus, tuyaDevices, housesWithRooms, serviceNotConfigured }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tuya.device.title" />
          </h1>
          <div class="page-options d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={this.changeOrderDir}
                orderValue={orderDir}
                search={this.debouncedSearch}
                searchValue={search}
                searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="card-body">
          {serviceNotConfigured && (
            <p class="alert alert-warning">
              <Text id="integration.tuya.device.serviceNotConfigured" />
              <Link href="/dashboard/integration/device/tuya/setup">
                <Text id="integration.tuya.status.setupPageLink" />
              </Link>
            </p>
          )}
          <div
            class={cx('dimmer', {
              active: getTuyaStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.tuyaListBody)}>
              <div class="row">
                {tuyaDevices &&
                  tuyaDevices.length > 0 &&
                  tuyaDevices.map((device, index) => (
                    <TuyaDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      getTuyaDevices={this.getTuyaDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!tuyaDevices || (tuyaDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
