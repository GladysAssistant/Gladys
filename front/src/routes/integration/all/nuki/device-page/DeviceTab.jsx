import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import NukiDeviceBox from '../NukiDeviceBox';
import CardFilter from '../../../../../components/layout/CardFilter';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      orderDir: 'asc',
      nukiDevices: [],
      loading: true,
      error: null,
      nukiEnabled: null
    };
    this.debouncedGetNukiDevices = debounce(this.getNukiDevices, 200).bind(this);
  }

  componentWillMount() {
    this.init();
  }

  init = async () => {
    this.setState({ loading: true });
    await Promise.all([this.loadConfiguration(), this.getHouses()]);
    if (this.state.nukiEnabled) {
      await this.getNukiDevices();
    }
    this.setState({
      loading: false
    });
  };

  loadConfiguration = async () => {
    try {
      const { mqttOk, webOk } = await this.props.httpClient.get('/api/v1/service/nuki/status');
      const nukiEnabled = mqttOk || webOk;
      await this.setState({
        nukiEnabled
      });
    } catch (e) {
      console.error(e);
      await this.setState({
        nukiEnabled: false
      });
      if (e.response && e.response.status !== 404) {
        this.setState({ error: RequestStatus.Error });
      }
    }
  };

  getNukiDevices = async () => {
    this.setState({
      nukiGetStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const nukiDevices = await this.props.httpClient.get('/api/v1/service/nuki/device', options);
      this.setState({
        nukiDevices,
        nukiGetStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        nukiGetStatus: RequestStatus.Error
      });
    }
  };
  search = async e => {
    await this.setState({
      search: e.target.value
    });
    this.debouncedGetNukiDevices();
  };
  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getNukiDevices();
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

  render({}, { orderDir, search, nukiGetStatus, nukiDevices, housesWithRooms, nukiEnabled }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.nuki.device.title" />
          </h1>
          <div class="page-options d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={this.changeOrderDir}
                orderValue={orderDir}
                search={this.search}
                searchValue={search}
                searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: nukiGetStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.nukiListBody)}>
              {!nukiEnabled && (
                <div class="alert alert-warning">
                  <MarkupText id="integration.nuki.setup.disabledWarning" />
                </div>
              )}
              <div class="row">
                {nukiDevices &&
                  nukiDevices.length > 0 &&
                  nukiDevices.map((device, index) => (
                    <NukiDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      housesWithRooms={housesWithRooms}
                      getNukiDevices={this.getNukiDevices}
                    />
                  ))}
                {nukiEnabled && (!nukiDevices || (nukiDevices.length === 0 && <EmptyState />))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
