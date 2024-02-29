import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import MELCloudDeviceBox from '../MELCloudDeviceBox';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getDevices();
    this.getHouses();
  }

  getDevices = async () => {
    this.setState({
      getMelCloudStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const melcloudDevices = await this.props.httpClient.get('/api/v1/service/melcloud/device', options);
      this.setState({
        melcloudDevices,
        getMelCloudStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getMelCloudStatus: e.message
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
    this.getDevices();
  }

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getDevices();
  };

  render({}, { orderDir, search, getMELCloudStatus, melcloudDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.melcloud.device.title" />
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
          <div
            class={cx('dimmer', {
              active: getMELCloudStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.melcloudListBody)}>
              <div class="row">
                {melcloudDevices &&
                  melcloudDevices.length > 0 &&
                  melcloudDevices.map((device, index) => (
                    <MELCloudDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      getDevices={this.getDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!melcloudDevices || (melcloudDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
