import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../utils/consts';
import { getMatterDeviceSaveError } from '../../../../utils/formatErrors';
import CardFilter from '../../../../components/layout/CardFilter';
import MatterDeviceBox from './MatterDeviceBox';
import MatterDeviceSaveErrorAlert from './MatterDeviceSaveErrorAlert';
import MatterPage from './MatterPage';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { getDeviceParam } from '../../../../utils/device';
import style from './style.css';

const compareDevices = (deviceA, deviceB) => {
  // If external_id is different, it's not the same device
  if (deviceA.external_id !== deviceB.external_id) {
    return false;
  }
  // Compare device features
  if (deviceA.features.length !== deviceB.features.length) {
    return false;
  }
  // Compare device params
  if (deviceA.params.length !== deviceB.params.length) {
    return false;
  }
  // We sort all features by external_id
  const deviceAFeaturesExternalIdSorted = deviceA.features.map(f => f.external_id).sort();
  const deviceBFeaturesExternalIdSorted = deviceB.features.map(f => f.external_id).sort();
  // We compare all features external_id
  for (let i = 0; i < deviceAFeaturesExternalIdSorted.length; i++) {
    if (deviceAFeaturesExternalIdSorted[i] !== deviceBFeaturesExternalIdSorted[i]) {
      return false;
    }
  }
  // We compare all features unit
  const deviceAFeaturesUnitSorted = deviceA.features.map(f => f.unit || 'empty').sort();
  const deviceBFeaturesUnitSorted = deviceB.features.map(f => f.unit || 'empty').sort();
  for (let i = 0; i < deviceAFeaturesUnitSorted.length; i++) {
    if (deviceAFeaturesUnitSorted[i] !== deviceBFeaturesUnitSorted[i]) {
      return false;
    }
  }
  // We compare all params name & value
  for (let i = 0; i < deviceA.params.length; i++) {
    const sameParamInDeviceB = deviceB.params.find(p => p.name === deviceA.params[i].name);
    if (!sameParamInDeviceB) {
      return false;
    }
    if (deviceA.params[i].value !== sameParamInDeviceB.value) {
      return false;
    }
  }
  return true;
};

const findGladysDeviceByExternalId = (matterDevices, externalId) =>
  matterDevices.find(device => device.external_id === externalId);

class MatterDevices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      orderDir: 'asc',
      matterDevices: [],
      pairedDevices: [],
      getGladysDevicesLoading: true,
      getPairedDevicesLoading: true,
      error: null,
      matterEnabled: null,
      devicesThatAlreadyExistButWithDifferentNodeId: new Map(),
      nodesIsConnected: new Map(),
      pairedDeviceErrors: new Map(),
      pairedDeviceLoading: new Map()
    };
    this.debouncedGetMatterDevices = debounce(this.getMatterDevices, 200).bind(this);
  }

  init = async () => {
    await Promise.all([this.loadConfiguration(), this.getHouses()]);
    if (this.state.matterEnabled) {
      await this.getMatterDevices();
      // We need to wait before getting all matter devices before being able to load paired devices
      await this.getPairedDevices();
    }
  };

  loadConfiguration = async () => {
    try {
      const { value } = await this.props.httpClient.get('/api/v1/service/matter/variable/MATTER_ENABLED');
      const matterEnabled = value === 'true';
      await this.setState({
        matterEnabled
      });
    } catch (e) {
      console.error(e);
      await this.setState({
        matterEnabled: false
      });
      if (e.response && e.response.status !== 404) {
        this.setState({ error: RequestStatus.Error });
      }
    }
  };

  componentWillMount() {
    this.init();
  }

  getMatterDevices = async () => {
    try {
      await this.setState({ getGladysDevicesLoading: true });
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const matterDevices = await this.props.httpClient.get('/api/v1/service/matter/device', options);
      this.setState({
        matterDevices,
        error: null,
        getGladysDevicesLoading: false
      });
      await this.getNodes();
    } catch (e) {
      console.error(e);
      this.setState({
        error: RequestStatus.Error,
        getGladysDevicesLoading: false
      });
    }
  };

  getPairedDevices = async () => {
    try {
      await this.setState({ getPairedDevicesLoading: true });
      const pairedDevices = await this.props.httpClient.get('/api/v1/service/matter/paired-device');

      // Filter out devices that are already in Gladys
      const filteredPairedDevices = pairedDevices.filter(
        // We compare all devices by external_id and features external_id
        pairedDevice => !this.state.matterDevices.some(gladysDevice => compareDevices(gladysDevice, pairedDevice))
      );

      const devicesThatAlreadyExistButWithDifferentNodeId = new Map();

      // The external_id of a Matter device is `matter:<nodeId>:<devicePath>`.
      // The device path identifies the endpoint inside the node and is stable across re-pairings,
      // while the node id changes when a device is re-commissioned. We use UNIQUE_ID + device path
      // to reliably match a paired device with its already-existing counterpart in Gladys, even
      // when multiple endpoints of the same physical device share the same UNIQUE_ID.
      const getDevicePath = externalId =>
        externalId
          .split(':')
          .slice(2)
          .join(':');

      // We index all devices already in Gladys by `<unique_id>::<device_path>`
      const existingDevicesByUniqueIdAndPath = new Map();
      this.state.matterDevices.forEach(device => {
        const deviceUniqueId = getDeviceParam(device, 'UNIQUE_ID');
        if (!deviceUniqueId) {
          return;
        }
        existingDevicesByUniqueIdAndPath.set(`${deviceUniqueId}::${getDevicePath(device.external_id)}`, device);
      });

      // For each paired device, we look for an existing Gladys device with the same UNIQUE_ID and
      // the same device path. If found and the external_id differs (i.e. the node id has changed),
      // we register it so the user can update the existing device instead of creating a duplicate.
      pairedDevices.forEach(pairedDevice => {
        const pairedDeviceUniqueId = getDeviceParam(pairedDevice, 'UNIQUE_ID');
        if (!pairedDeviceUniqueId) {
          return;
        }
        const existingDevice = existingDevicesByUniqueIdAndPath.get(
          `${pairedDeviceUniqueId}::${getDevicePath(pairedDevice.external_id)}`
        );
        if (existingDevice && existingDevice.external_id !== pairedDevice.external_id) {
          devicesThatAlreadyExistButWithDifferentNodeId.set(pairedDevice.external_id, existingDevice.external_id);
        }
      });

      this.setState({
        pairedDevices: filteredPairedDevices,
        devicesThatAlreadyExistButWithDifferentNodeId,
        getPairedDevicesLoading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({ getPairedDevicesLoading: false });
    }
  };

  getNodes = async () => {
    try {
      const nodes = await this.props.httpClient.get('/api/v1/service/matter/node');
      const nodesIsConnected = new Map();
      nodes.forEach(node => {
        nodesIsConnected.set(node.node_id, node.is_connected);
      });
      this.setState({
        nodesIsConnected
      });
    } catch (e) {
      console.error(e);
    }
  };

  setPairedDeviceLoading = (externalId, loading) => {
    this.setState(prevState => {
      const pairedDeviceLoading = new Map(prevState.pairedDeviceLoading);
      if (loading) {
        pairedDeviceLoading.set(externalId, true);
      } else {
        pairedDeviceLoading.delete(externalId);
      }
      return { pairedDeviceLoading };
    });
  };

  setPairedDeviceError = (externalId, error) => {
    this.setState(prevState => {
      const pairedDeviceErrors = new Map(prevState.pairedDeviceErrors);
      if (error) {
        pairedDeviceErrors.set(externalId, error);
      } else {
        pairedDeviceErrors.delete(externalId);
      }
      return { pairedDeviceErrors };
    });
  };

  addDeviceToGladys = async device => {
    const { external_id: externalId } = device;
    this.setPairedDeviceLoading(externalId, true);
    this.setPairedDeviceError(externalId, null);
    try {
      await this.props.httpClient.post('/api/v1/device', device);
      await this.getMatterDevices();
      await this.getPairedDevices();
    } catch (e) {
      console.error(e);
      this.setPairedDeviceError(externalId, getMatterDeviceSaveError(e));
    } finally {
      this.setPairedDeviceLoading(externalId, false);
    }
  };

  replaceGladysDevice = async device => {
    const { external_id: externalId } = device;
    this.setPairedDeviceLoading(externalId, true);
    this.setPairedDeviceError(externalId, null);
    try {
      const gladysDevice = this.state.matterDevices.find(gladysDevice => {
        return (
          gladysDevice.external_id === this.state.devicesThatAlreadyExistButWithDifferentNodeId.get(device.external_id)
        );
      });

      if (!gladysDevice) {
        this.setPairedDeviceError(externalId, {
          errorMessage: 'integration.matter.error.replaceDeviceNotFound',
          errorDetail: null,
          isKnownError: true
        });
        return;
      }

      // We'll update the external_id of the existing device
      const newExternalId = device.external_id;
      const oldExternalId = gladysDevice.external_id;

      // Put back all the attributes of the previous device
      device.id = gladysDevice.id;
      device.selector = gladysDevice.selector;
      device.name = gladysDevice.name;
      device.room = gladysDevice.room;

      device.features = device.features.map(f => {
        // try to find match feature to replace the external_id
        const gladysFeature = gladysDevice.features.find(gladysF => {
          return gladysF.external_id.replace(oldExternalId, newExternalId) === f.external_id;
        });
        // If a matching feature is found, give the id of the feature
        if (gladysFeature) {
          f.id = gladysFeature.id;
          f.selector = gladysFeature.selector;
        }
        return f;
      });
      await this.props.httpClient.post('/api/v1/device', device);
      await this.getMatterDevices();
      await this.getPairedDevices();
    } catch (e) {
      console.error(e);
      this.setPairedDeviceError(externalId, getMatterDeviceSaveError(e));
    } finally {
      this.setPairedDeviceLoading(externalId, false);
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
    this.debouncedGetMatterDevices();
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
      getGladysDevicesLoading,
      getPairedDevicesLoading,
      error,
      matterDevices,
      pairedDevices,
      housesWithRooms,
      devicesThatAlreadyExistButWithDifferentNodeId,
      matterEnabled,
      nodesIsConnected,
      pairedDeviceErrors,
      pairedDeviceLoading
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
                  search={this.search}
                  searchValue={search}
                  searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
                />
              </Localizer>
              <button onClick={this.init} class="btn btn-sm btn-outline-primary ml-2 flex-shrink-0">
                <i class="fe fe-refresh-cw" />
              </button>
            </div>
          </div>
          <div class="card-body">
            <div
              class={cx('dimmer', {
                active: getGladysDevicesLoading
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                {!matterEnabled && (
                  <div class="alert alert-warning">
                    <MarkupText id="integration.matter.settings.disabledWarning" />
                  </div>
                )}
                {getPairedDevicesLoading && (
                  <div class="alert alert-info">
                    <h4 class="alert-heading text-center">
                      <Text id="integration.matter.device.refreshMatterDevices" />
                    </h4>
                    <p class="text-center">
                      <Text id="integration.matter.device.refreshMatterDevicesDescription" />
                    </p>
                    <div class="dimmer active">
                      <div class="loader" />
                      <div class={cx('dimmer-content', style.pairedDeviceLoadingContent)} />
                    </div>
                  </div>
                )}
                {sortedPairedDevices && sortedPairedDevices.length > 0 && (
                  <div class="alert alert-info">
                    <h4 class="alert-heading">
                      <Text id="integration.matter.device.pairedDevicesTitle" />
                    </h4>
                    <div class="row mt-4">
                      {sortedPairedDevices.map(device => {
                        const pairedError = pairedDeviceErrors.get(device.external_id);
                        const isPairedDeviceLoading = pairedDeviceLoading.get(device.external_id);
                        const isNodeIdChanged = devicesThatAlreadyExistButWithDifferentNodeId.has(device.external_id);
                        const existingGladysDevice = findGladysDeviceByExternalId(matterDevices, device.external_id);
                        const isUpdate = existingGladysDevice && !isNodeIdChanged;

                        return (
                          <div key={device.external_id} class="col-md-6">
                            <div class="card">
                              <div class="card-header">
                                {device.name || device.model}
                                {nodesIsConnected.get(device.external_id.split(':')[1]) === false && (
                                  <div class="page-options d-flex">
                                    <div class="tag tag-danger">
                                      <Text id="integration.matter.device.nodeDisconnected" />
                                      <span class="tag-addon">
                                        <i class="fe fe-wifi-off" />
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div
                                class={cx('dimmer', {
                                  active: isPairedDeviceLoading
                                })}
                              >
                                <div class="loader" />
                                <div class="dimmer-content">
                                  <div class="card-body">
                                    {pairedError && (
                                      <MatterDeviceSaveErrorAlert
                                        errorMessage={pairedError.errorMessage}
                                        errorDetail={pairedError.errorDetail}
                                        isKnownError={pairedError.isKnownError}
                                      />
                                    )}
                                    {isNodeIdChanged && (
                                      <div class="alert alert-info">
                                        <Text id="integration.matter.device.deviceAlreadyExist" />
                                      </div>
                                    )}
                                    {isUpdate && (
                                      <div class="alert alert-info">
                                        <Text id="integration.matter.device.deviceHasUpdates" />
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
                                    {isNodeIdChanged && (
                                      <div class="form-group">
                                        <button
                                          onClick={() => this.replaceGladysDevice(device)}
                                          class={cx('btn btn-info', {
                                            loading: isPairedDeviceLoading
                                          })}
                                          disabled={isPairedDeviceLoading}
                                        >
                                          <Text id="integration.matter.device.replaceExisting" />
                                        </button>
                                      </div>
                                    )}
                                    {!isNodeIdChanged && (
                                      <div class="form-group">
                                        <button
                                          onClick={() => this.addDeviceToGladys(device)}
                                          class={cx('btn', isUpdate ? 'btn-info' : 'btn-success', {
                                            loading: isPairedDeviceLoading
                                          })}
                                          disabled={isPairedDeviceLoading}
                                        >
                                          <Text
                                            id={
                                              isUpdate
                                                ? 'integration.matter.device.updateInGladys'
                                                : 'integration.matter.device.addToGladys'
                                            }
                                          />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {error && (
                  <div class="alert alert-danger">
                    <Text id="integration.matter.error.getDevicesError" />
                  </div>
                )}
                <div class="row">
                  {matterDevices &&
                    matterDevices.length > 0 &&
                    matterDevices.map((device, index) => (
                      <MatterDeviceBox
                        editable
                        saveButton
                        deleteButton
                        device={device}
                        deviceIndex={index}
                        refreshMatterDevices={this.init}
                        nodesIsConnected={nodesIsConnected}
                        housesWithRooms={housesWithRooms}
                      />
                    ))}
                  {matterDevices && matterDevices.length === 0 && pairedDevices && pairedDevices.length === 0 && (
                    <EmptyState matterEnabled={matterEnabled} />
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
