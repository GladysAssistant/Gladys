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
import MobileMatterDevices from './MobileMatterDevices';
import { withMobileViewport } from '../../../../components/mobile';
import MatterDeviceSaveErrorAlert from './MatterDeviceSaveErrorAlert';
import MatterPage from './MatterPage';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { getDeviceParam, stripDeviceStatesForSave } from '../../../../utils/device';
import style from './style.css';

// Tells if a device already in Gladys is up to date with the device paired in Matter.
// Only the params the integration provides (the ones of the paired device) are compared: the Gladys
// device also carries params the integration doesn't manage (e.g. the `ENERGY_INDEX_LAST_PROCESSED_*`
// watermarks written by energy monitoring), which must not make it look "to update".
const compareDevices = (gladysDevice, pairedDevice) => {
  // If external_id is different, it's not the same device
  if (gladysDevice.external_id !== pairedDevice.external_id) {
    return false;
  }
  // Compare device features
  if (gladysDevice.features.length !== pairedDevice.features.length) {
    return false;
  }
  // We sort all features by external_id
  const gladysDeviceFeaturesExternalIdSorted = gladysDevice.features.map(f => f.external_id).sort();
  const pairedDeviceFeaturesExternalIdSorted = pairedDevice.features.map(f => f.external_id).sort();
  // We compare all features external_id
  for (let i = 0; i < gladysDeviceFeaturesExternalIdSorted.length; i++) {
    if (gladysDeviceFeaturesExternalIdSorted[i] !== pairedDeviceFeaturesExternalIdSorted[i]) {
      return false;
    }
  }
  // We compare all features unit
  const gladysDeviceFeaturesUnitSorted = gladysDevice.features.map(f => f.unit || 'empty').sort();
  const pairedDeviceFeaturesUnitSorted = pairedDevice.features.map(f => f.unit || 'empty').sort();
  for (let i = 0; i < gladysDeviceFeaturesUnitSorted.length; i++) {
    if (gladysDeviceFeaturesUnitSorted[i] !== pairedDeviceFeaturesUnitSorted[i]) {
      return false;
    }
  }
  // We compare the range of each feature: a device created before Gladys read the real range of a
  // feature (ex: the setpoint limits of a thermostat) is proposed for an update
  const isSameBound = (gladysBound, pairedBound) =>
    gladysBound === null || gladysBound === undefined
      ? pairedBound === null || pairedBound === undefined
      : Number(gladysBound) === Number(pairedBound);
  const hasSameRange = (gladysFeature, pairedFeature) =>
    isSameBound(gladysFeature.min, pairedFeature.min) && isSameBound(gladysFeature.max, pairedFeature.max);
  for (let i = 0; i < pairedDevice.features.length; i++) {
    const pairedFeature = pairedDevice.features[i];
    const gladysFeature = gladysDevice.features.find(f => f.external_id === pairedFeature.external_id);
    if (!hasSameRange(gladysFeature, pairedFeature)) {
      return false;
    }
  }
  // We compare the name & value of all params provided by the integration
  const gladysParams = gladysDevice.params || [];
  const pairedParams = pairedDevice.params || [];
  for (let i = 0; i < pairedParams.length; i++) {
    const sameParamInGladys = gladysParams.find(p => p.name === pairedParams[i].name);
    if (!sameParamInGladys) {
      return false;
    }
    if (pairedParams[i].value !== sameParamInGladys.value) {
      return false;
    }
  }
  return true;
};

// Updating a device already in Gladys only refreshes what the integration provides (features and
// params): the device keeps its id, selector, name and room, and the params the integration doesn't
// manage. Posting the paired device as-is would rename the device and delete those params.
const mergePairedDeviceIntoGladysDevice = (gladysDevice, pairedDevice) => {
  const pairedParams = pairedDevice.params || [];
  const paramsNotManagedByMatter = (gladysDevice.params || []).filter(
    gladysParam => !pairedParams.some(pairedParam => pairedParam.name === gladysParam.name)
  );
  return {
    ...pairedDevice,
    id: gladysDevice.id,
    selector: gladysDevice.selector,
    name: gladysDevice.name,
    room_id: gladysDevice.room_id,
    params: [...pairedParams, ...paramsNotManagedByMatter]
  };
};

const findGladysDeviceByExternalId = (matterDevices, externalId) =>
  matterDevices.find(device => device.external_id === externalId);

// A re-paired device (new node id) replaces the existing Gladys device: on top of the merge, every
// matched feature takes over the id, the selector and the energy parent of the existing feature.
// The paired device is not mutated, so a failed save leaves its card as it was.
const replaceGladysDeviceWithPairedDevice = (gladysDevice, pairedDevice) => {
  const oldExternalId = gladysDevice.external_id;
  const newExternalId = pairedDevice.external_id;
  const deviceToSave = mergePairedDeviceIntoGladysDevice(gladysDevice, pairedDevice);

  // the energy features derived by the server point to the ids of the paired features:
  // their parents follow the ids taken over from the existing device
  const replacedFeatureIds = new Map();
  deviceToSave.features = (pairedDevice.features || []).map(pairedFeature => {
    const feature = { ...pairedFeature };
    // try to find match feature to replace the external_id
    const gladysFeature = gladysDevice.features.find(gladysF => {
      return gladysF.external_id.replace(oldExternalId, newExternalId) === feature.external_id;
    });
    // If a matching feature is found, give the id of the feature
    if (gladysFeature) {
      if (feature.id) {
        replacedFeatureIds.set(feature.id, gladysFeature.id);
      }
      feature.id = gladysFeature.id;
      feature.selector = gladysFeature.selector;
      // the server could not see the existing device (new node id): its index fell back on the
      // main meter, the meter the user chose (or none, for a root) is kept
      feature.energy_parent_id = gladysFeature.energy_parent_id || null;
    }
    return feature;
  });
  deviceToSave.features.forEach(feature => {
    if (feature.energy_parent_id && replacedFeatureIds.has(feature.energy_parent_id)) {
      feature.energy_parent_id = replacedFeatureIds.get(feature.energy_parent_id);
    }
  });
  return deviceToSave;
};

class MatterDevices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      orderDir: 'asc',
      matterDevices: [],
      // every Matter device of Gladys, whatever the search: the paired devices are compared with them
      allMatterDevices: [],
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

  // The search only filters the list of devices shown on the page: a paired device is compared with,
  // and merged into, the device of Gladys that has its external_id, whatever its name
  getAllGladysMatterDevices = () =>
    this.props.httpClient.get('/api/v1/service/matter/device', {
      order_dir: this.state.orderDir || 'asc'
    });

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
      const allMatterDevices = options.search ? await this.getAllGladysMatterDevices() : matterDevices;
      this.setState({
        matterDevices,
        allMatterDevices,
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
        pairedDevice => !this.state.allMatterDevices.some(gladysDevice => compareDevices(gladysDevice, pairedDevice))
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
      this.state.allMatterDevices.forEach(device => {
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

  // resolves to false when the device could not be added (the phone sheet then stays open)
  addDeviceToGladys = async device => {
    const { external_id: externalId } = device;
    this.setPairedDeviceLoading(externalId, true);
    this.setPairedDeviceError(externalId, null);
    try {
      // A device with this external_id may already be in Gladys ("Update"): the server would then
      // update it with the posted object, so we only refresh what the integration provides.
      // The devices are read again: the list of the page is filtered by the search, and the params
      // the core writes (energy watermarks) may have moved since the page was loaded
      const allGladysDevices = await this.getAllGladysMatterDevices();
      const existingGladysDevice = findGladysDeviceByExternalId(allGladysDevices, externalId);
      const deviceToSave = existingGladysDevice
        ? mergePairedDeviceIntoGladysDevice(existingGladysDevice, device)
        : device;
      await this.props.httpClient.post('/api/v1/device', stripDeviceStatesForSave(deviceToSave));
      await this.getMatterDevices();
      await this.getPairedDevices();
      return true;
    } catch (e) {
      console.error(e);
      this.setPairedDeviceError(externalId, getMatterDeviceSaveError(e));
      return false;
    } finally {
      this.setPairedDeviceLoading(externalId, false);
    }
  };

  replaceGladysDevice = async device => {
    const { external_id: externalId } = device;
    this.setPairedDeviceLoading(externalId, true);
    this.setPairedDeviceError(externalId, null);
    try {
      // read again, like an update: not filtered by the search, and with the latest core params
      const allGladysDevices = await this.getAllGladysMatterDevices();
      const gladysDevice = findGladysDeviceByExternalId(
        allGladysDevices,
        this.state.devicesThatAlreadyExistButWithDifferentNodeId.get(externalId)
      );

      if (!gladysDevice) {
        this.setPairedDeviceError(externalId, {
          errorMessage: 'integration.matter.error.replaceDeviceNotFound',
          errorDetail: null,
          isKnownError: true
        });
        return false;
      }

      // On a copy: the paired device of the list stays as it was published until the list is
      // loaded again. A replacement that fails must not leave its card (or its phone row, whose
      // sheet stays open on a failure) under the name and the ids of the existing device.
      const deviceToSave = replaceGladysDeviceWithPairedDevice(gladysDevice, device);
      await this.props.httpClient.post('/api/v1/device', stripDeviceStatesForSave(deviceToSave));
      await this.getMatterDevices();
      await this.getPairedDevices();
      return true;
    } catch (e) {
      console.error(e);
      this.setPairedDeviceError(externalId, getMatterDeviceSaveError(e));
      return false;
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
      allMatterDevices,
      pairedDevices,
      housesWithRooms,
      devicesThatAlreadyExistButWithDifferentNodeId,
      matterEnabled,
      nodesIsConnected,
      pairedDeviceErrors,
      pairedDeviceLoading
    }
  ) {
    // A paired device that updates a device of Gladys is shown under the name of that device
    const getDeviceToUpdate = device =>
      devicesThatAlreadyExistButWithDifferentNodeId.has(device.external_id)
        ? undefined
        : findGladysDeviceByExternalId(allMatterDevices, device.external_id);
    const getPairedDeviceTitle = device => {
      const deviceToUpdate = getDeviceToUpdate(device);
      return (deviceToUpdate && deviceToUpdate.name) || device.name || device.model;
    };

    // Apply client-side filtering to paired devices
    const filteredPairedDevices = pairedDevices.filter(device => {
      // If no search term, include all devices
      if (!search || search.trim() === '') {
        return true;
      }

      // Search in the name shown on the card, the name and the model published by Matter
      const searchLower = search.toLowerCase();
      return [getPairedDeviceTitle(device), device.name, device.model].some(
        value => value && value.toLowerCase().includes(searchLower)
      );
    });

    // Apply client-side sorting to paired devices
    const sortedPairedDevices = [...filteredPairedDevices].sort((a, b) => {
      const nameA = (getPairedDeviceTitle(a) || '').toLowerCase();
      const nameB = (getPairedDeviceTitle(b) || '').toLowerCase();

      if (orderDir === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    // On a phone the same lists are rows opening a sheet
    // (docs/specs/mobile-pages/integration-devices.md)
    if (props.isMobile) {
      return (
        <MatterPage user={props.user}>
          <MobileMatterDevices
            orderDir={orderDir}
            search={search}
            onSearch={this.search}
            onOrderChange={this.changeOrderDir}
            refresh={this.init}
            getGladysDevicesLoading={getGladysDevicesLoading}
            getPairedDevicesLoading={getPairedDevicesLoading}
            error={error}
            matterEnabled={matterEnabled}
            matterDevices={matterDevices}
            pairedItems={sortedPairedDevices.map(device => {
              const isNodeIdChanged = devicesThatAlreadyExistButWithDifferentNodeId.has(device.external_id);
              return {
                device,
                pairedError: pairedDeviceErrors.get(device.external_id),
                isNodeIdChanged,
                // like the desktop card: looked up whatever the search, and named after the Gladys device
                isUpdate: Boolean(getDeviceToUpdate(device)),
                title: getPairedDeviceTitle(device),
                nodeIsDisconnected: nodesIsConnected.get(device.external_id.split(':')[1]) === false
              };
            })}
            hasPairedDevices={pairedDevices.length > 0}
            housesWithRooms={housesWithRooms}
            nodesIsConnected={nodesIsConnected}
            addDeviceToGladys={this.addDeviceToGladys}
            replaceGladysDevice={this.replaceGladysDevice}
          />
        </MatterPage>
      );
    }

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
                        const isUpdate = !!getDeviceToUpdate(device);

                        return (
                          <div key={device.external_id} class="col-md-6" data-cy="matter-paired-device">
                            <div class="card">
                              <div class="card-header">
                                {/* an update card names the Gladys device it applies to */}
                                {getPairedDeviceTitle(device)}
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
                                          data-cy="matter-paired-device-replace"
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
                                          data-cy="matter-paired-device-save"
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
                        key={device.external_id}
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

export default connect('httpClient,user', {})(withMobileViewport(MatterDevices));
