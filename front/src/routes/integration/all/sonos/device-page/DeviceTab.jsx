import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import SonosDeviceBox from '../SonosDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getSonosDevices();
    this.getHouses();
  }

  async getSonosDevices() {
    this.setState({
      getSonosStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const sonosDevices = await this.props.httpClient.get('/api/v1/service/sonos/device', options);
      this.setState({
        sonosDevices,
        getSonosStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getSonosStatus: e.message
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
    this.getSonosDevices();
  }
  async changeOrderDir(e) {
    await this.setState({
      orderDir: e.target.value
    });
    this.getSonosDevices();
  }

  render({}, { orderDir, search, getSonosStatus, sonosDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.sonos.device.title" />
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
              active: getSonosStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.sonosListBody)}>
              <div class="row">
                {sonosDevices &&
                  sonosDevices.length > 0 &&
                  sonosDevices.map((device, index) => (
                    <SonosDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      getSonosDevices={this.getSonosDevices.bind(this)}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!sonosDevices || (sonosDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
