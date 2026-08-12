import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import GoogleCastDeviceBox from '../GoogleCastDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getGoogleCastDevices();
    this.getHouses();
  }

  getGoogleCastDevices = async () => {
    this.setState({
      getGoogleCastStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const googleCastDevices = await this.props.httpClient.get('/api/v1/service/google-cast/device', options);
      this.setState({
        googleCastDevices,
        getGoogleCastStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getGoogleCastStatus: e.message
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
    this.getGoogleCastDevices();
  }

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getGoogleCastDevices();
  };

  render({}, { orderDir, search, getGoogleCastStatus, googleCastDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.google-cast.device.title" />
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
              active: getGoogleCastStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.googleCastListBody)}>
              <div class="row">
                {googleCastDevices &&
                  googleCastDevices.length > 0 &&
                  googleCastDevices.map((device, index) => (
                    <GoogleCastDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      getGoogleCastDevices={this.getGoogleCastDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!googleCastDevices || (googleCastDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
