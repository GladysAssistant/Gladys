import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import ZwaveJSUIDeviceBox from '../ZwaveJSUIDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class DeviceTab extends Component {
  search = async e => {
    await this.setState({
      search: e.target.value
    });
    this.getZwaveJSUIDevices();
  };
  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getZwaveJSUIDevices();
  };
  getZwaveJSUIDevices = async () => {
    this.setState({
      getZwaveJSUIStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const zwaveJSUIDevices = await this.props.httpClient.get('/api/v1/service/zwavejs-ui/device', options);
      this.setState({
        zwaveJSUIDevices,
        getZwaveJSUIStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getZwaveJSUIStatus: e.message
      });
    }
  };
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getZwaveJSUIDevices();
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

  render({}, { orderDir, search, getZwaveJSUIStatus, zwaveJSUIDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.zwavejs-ui.device.title" />
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
              active: getZwaveJSUIStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.zwaveJSUIListBody)}>
              <div class="alert alert-warning">
                <Text id="integration.zwavejs-ui.alphaWarning" />
              </div>
              <div class="row">
                {zwaveJSUIDevices &&
                  zwaveJSUIDevices.length > 0 &&
                  zwaveJSUIDevices.map((device, index) => (
                    <ZwaveJSUIDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      getZwaveJSUIDevices={this.getZwaveJSUIDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!zwaveJSUIDevices || (zwaveJSUIDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
