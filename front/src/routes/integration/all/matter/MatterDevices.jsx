import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../utils/consts';
import CardFilter from '../../../../components/layout/CardFilter';
import MatterDeviceBox from './MatterDeviceBox';
import MatterPage from './MatterPage';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class MatterDevices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      orderDir: 'asc',
      matterDevices: [],
      pairedDevices: [],
      loading: true,
      error: null
    };
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  init = async () => {
    await this.getHouses();
    await this.getMatterDevices();
    await this.getPairedDevices();
  };

  componentWillMount() {
    this.init();
  }

  getMatterDevices = async () => {
    this.setState({
      loading: true
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const matterDevices = await this.props.httpClient.get('/api/v1/service/matter/device', options);
      this.setState({
        matterDevices,
        loading: false,
        error: null
      });
    } catch (e) {
      console.error(e);
      this.setState({
        loading: false,
        error: RequestStatus.Error
      });
    }
  };

  getPairedDevices = async () => {
    try {
      const pairedDevices = await this.props.httpClient.get('/api/v1/service/matter/paired-device');
      // Filter out devices that are already in Gladys
      const filteredPairedDevices = pairedDevices.filter(
        pairedDevice =>
          !this.state.matterDevices.some(gladysDevice => gladysDevice.external_id === pairedDevice.external_id)
      );
      this.setState({ pairedDevices: filteredPairedDevices });
    } catch (e) {
      console.error(e);
    }
  };

  addDeviceToGladys = async device => {
    try {
      await this.props.httpClient.post('/api/v1/device', device);
      await this.getMatterDevices();
      await this.getPairedDevices();
    } catch (e) {
      console.error(e);
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
      const housesWithRooms = await this.props.httpClient.get('/api/v1/house', params);
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

  search = async e => {
    await this.setState({
      search: e.target.value
    });
    this.getMatterDevices();
  };

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getMatterDevices();
  };

  render(props, { orderDir, search, loading, error, matterDevices, pairedDevices, housesWithRooms }) {
    return (
      <MatterPage user={props.user}>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.matter.device.title" />
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
            {pairedDevices && pairedDevices.length > 0 && (
              <div class="alert alert-info">
                <h4 class="alert-heading">
                  <Text id="integration.matter.device.pairedDevicesTitle" />
                </h4>
                <div class="row mt-4">
                  {pairedDevices.map(device => (
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">{device.name || device.model}</div>
                        <div class="card-body">
                          {device.features && device.features.length > 0 && (
                            <div class="form-group">
                              <label class="form-label">
                                <Text id="integration.matter.featuresLabel" />
                              </label>
                              <DeviceFeatures features={device.features} />
                            </div>
                          )}
                          <div class="form-group">
                            <button onClick={() => this.addDeviceToGladys(device)} class="btn btn-success">
                              <Text id="integration.matter.device.addToGladys" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              class={cx('dimmer', {
                active: loading
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                {error && (
                  <div class="alert alert-danger">
                    <Text id="integration.matter.error.getDevicesError" />
                  </div>
                )}
                <div class="row">
                  {matterDevices && matterDevices.length > 0 ? (
                    matterDevices.map((device, index) => (
                      <MatterDeviceBox
                        editable
                        saveButton
                        deleteButton
                        device={device}
                        deviceIndex={index}
                        getMatterDevices={this.getMatterDevices}
                        housesWithRooms={housesWithRooms}
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MatterPage>
    );
  }
}

export default connect('httpClient,user', {})(MatterDevices);
