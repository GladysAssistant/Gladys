import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../utils/consts';
import { getDeviceParam } from '../../../../utils/device';
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
      error: null,
      matterEnabled: null,
      devicesThatAlreadyExistButWithDifferentNodeId: new Map()
    };
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  init = async () => {
    await Promise.all([this.loadConfiguration(), this.getHouses(), this.getMatterDevices()]);
    // We need to wait before getting all matter devices before being able to load paired devices
    await this.getPairedDevices();
  };

  loadConfiguration = async () => {
    try {
      const { value: matterEnabled } = await this.props.httpClient.get(
        '/api/v1/service/matter/variable/MATTER_ENABLED'
      );
      this.setState({
        matterEnabled: matterEnabled === 'true'
      });
    } catch (e) {
      console.error(e);
      this.setState({ error: RequestStatus.Error });
    }
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

      /* const devicesThatAlreadyExistButWithDifferentNodeId = new Map();
      filteredPairedDevices.forEach(pairedDevice => {
        // First, we get the unique_id of the paired device if it exists
        const pairedDeviceUniqueId = getDeviceParam(pairedDevice, 'UNIQUE_ID');
        if (!pairedDeviceUniqueId) {
          return undefined;
        }
        // We find another device already in Gladys with the same unique_id
        const deviceWithSameUniqueId = this.state.matterDevices.find(gladysDevice => {
          const gladysDeviceUniqueId = getDeviceParam(gladysDevice, 'UNIQUE_ID');
          if (!gladysDeviceUniqueId) {
            return false;
          }
          return pairedDeviceUniqueId === gladysDeviceUniqueId;
        });

        if (deviceWithSameUniqueId) {
          devicesThatAlreadyExistButWithDifferentNodeId.set(
            pairedDevice.external_id,
            deviceWithSameUniqueId.external_id
          );
        }

        return undefined;
      }); */

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

  replaceGladysDevice = async device => {
    try {
      const gladysDevice = this.state.matterDevices.find(gladysDevice => {
        return (
          gladysDevice.external_id === this.state.devicesThatAlreadyExistButWithDifferentNodeId.get(device.external_id)
        );
      });

      // We'll update the external_id of the existing device
      const newExternalId = device.external_id;
      const oldExternalId = gladysDevice.external_id;

      // Put the id of the gladys device so we replace the device
      device.id = gladysDevice.id;
      device.features = device.features.map(f => {
        // try to find match feature to replace the external_id
        const gladysFeature = gladysDevice.features.find(gladysF => {
          return gladysF.external_id.replace(oldExternalId, newExternalId) === f.external_id;
        });
        // If a matching feature is found, give the id of the feature
        if (gladysFeature) {
          f.id = gladysFeature.id;
        }
        return f;
      });
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
    // No need to call getPairedDevices here as we filter them client-side in render
  };

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getMatterDevices();
    // No need to call getPairedDevices here as we sort them client-side in render
  };

  render(
    props,
    {
      orderDir,
      search,
      loading,
      error,
      matterDevices,
      pairedDevices,
      housesWithRooms,
      devicesThatAlreadyExistButWithDifferentNodeId,
      matterEnabled
    }
  ) {
    // Apply client-side filtering to paired devices
    const filteredPairedDevices = pairedDevices.filter(device => {
      // If no search term, include all devices
      if (!search || search.trim() === '') {
        return true;
      }

      // Search in name, model, and external_id
      const searchLower = search.toLowerCase();
      return (
        (device.name && device.name.toLowerCase().includes(searchLower)) ||
        (device.model && device.model.toLowerCase().includes(searchLower))
      );
    });

    // Apply client-side sorting to paired devices
    const sortedPairedDevices = [...filteredPairedDevices].sort((a, b) => {
      const nameA = (a.name || a.model || '').toLowerCase();
      const nameB = (b.name || b.model || '').toLowerCase();

      if (orderDir === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

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
            {!matterEnabled && (
              <div class="alert alert-warning">
                <Text id="integration.matter.settings.disabledWarning" />
              </div>
            )}
            {sortedPairedDevices && sortedPairedDevices.length > 0 && (
              <div class="alert alert-info">
                <h4 class="alert-heading">
                  <Text id="integration.matter.device.pairedDevicesTitle" />
                </h4>
                <div class="row mt-4">
                  {sortedPairedDevices.map(device => (
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">{device.name || device.model}</div>
                        <div class="card-body">
                          {devicesThatAlreadyExistButWithDifferentNodeId.has(device.external_id) && (
                            <div class="alert alert-info">
                              <Text id="integration.matter.device.deviceAlreadyExist" />
                            </div>
                          )}
                          {device.features && device.features.length > 0 && (
                            <div class="form-group">
                              <label class="form-label">
                                <Text id="integration.matter.featuresLabel" />
                              </label>
                              <DeviceFeatures features={device.features} />
                            </div>
                          )}
                          {devicesThatAlreadyExistButWithDifferentNodeId.has(device.external_id) && (
                            <div class="form-group">
                              <button onClick={() => this.replaceGladysDevice(device)} class="btn btn-info">
                                <Text id="integration.matter.device.replaceExisting" />
                              </button>
                            </div>
                          )}
                          {!devicesThatAlreadyExistButWithDifferentNodeId.has(device.external_id) && (
                            <div class="form-group">
                              <button onClick={() => this.addDeviceToGladys(device)} class="btn btn-success">
                                <Text id="integration.matter.device.addToGladys" />
                              </button>
                            </div>
                          )}
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
                        refreshMatterDevices={this.init}
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
