import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import StateConnection from './StateConnection';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import TessieDeviceBox from '../TessieDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getTessieDevices();
    this.getHouses();
  }

  getTessieDevices = async () => {
    this.setState({
      getTessieStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const tessieDevices = await this.props.httpClient.get('/api/v1/service/tessie/device', options);
      this.setState({
        tessieDevices,
        getTessieStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getTessieStatus: e.message
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
    this.getTessieDevices();
  }
  changeOrderDir(e) {
    this.setState({
      orderDir: e.target.value
    });
    this.getTessieDevices();
  }

  render(props, { orderDir, search, getTessieStatus, tessieDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tessie.device.title" />
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
              active: getTessieStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.tessieListBody)}>
              <StateConnection {...props} />
              <div class="alert alert-secondary">
                <p>
                  <MarkupText id="integration.tessie.device.descriptionInformation" />
                </p>
              </div>
              <div class="row">
                {tessieDevices &&
                  tessieDevices.length > 0 &&
                  tessieDevices.map((device, index) => (
                    <TessieDeviceBox
                      editable
                      editButton
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      showMostRecentValueAt={device.created_at && !device.updatable}
                      getTessieDevices={this.getTessieDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!tessieDevices || (tessieDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
