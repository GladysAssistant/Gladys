import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';
import {
  normalizeBoolean,
  buildParamsMap,
  getLocalOverrideValue,
  getTuyaDeviceId,
  getLocalPollDpsFromParams,
  getUnknownDpsKeys,
  getUnknownSpecificationCodes,
  resolveOnlineStatus
} from './commons/deviceHelpers';
import TuyaLocalPollSection from './TuyaLocalPollSection';
import TuyaGithubIssueSection from './discover-page/TuyaGithubIssueSection';

const LOCAL_POLL_FREQUENCY = 10 * 1000;
const CLOUD_POLL_FREQUENCY = 30 * 1000;

const getDeviceDisplayData = device => {
  const params = buildParamsMap(device);
  return {
    deviceId: params.DEVICE_ID || getTuyaDeviceId(device),
    localKey: params.LOCAL_KEY || device.local_key || '',
    productId: params.PRODUCT_ID || device.product_id || '',
    productKey: params.PRODUCT_KEY || device.product_key || '',
    localOverride: normalizeBoolean(getLocalOverrideValue(device)),
    persistedLocalPollDps: getLocalPollDpsFromParams(device)
  };
};

const buildComparableDevice = device => {
  if (!device) {
    return null;
  }
  const params = buildParamsMap(device);
  return {
    name: device.name || '',
    room_id: device.room_id || null,
    ip: params.IP_ADDRESS || device.ip || '',
    protocol: params.PROTOCOL_VERSION || device.protocol_version || '',
    local_override: normalizeBoolean(getLocalOverrideValue(device))
  };
};

const hasDeviceChanged = (device, baselineDevice) => {
  const current = buildComparableDevice(device);
  const baseline = buildComparableDevice(baselineDevice);
  if (!current || !baseline) {
    return false;
  }
  return (
    current.name !== baseline.name ||
    current.room_id !== baseline.room_id ||
    current.ip !== baseline.ip ||
    current.protocol !== baseline.protocol ||
    current.local_override !== baseline.local_override
  );
};

const getLocalConfig = device => {
  if (!device) {
    return {
      ip: '',
      protocol: '',
      localOverride: false
    };
  }
  const params = buildParamsMap(device);
  return {
    ip: params.IP_ADDRESS || device.ip || '',
    protocol: params.PROTOCOL_VERSION || device.protocol_version || '',
    localOverride: normalizeBoolean(getLocalOverrideValue(device))
  };
};

const hasLocalConfigChanged = (currentConfig, baselineConfig) =>
  currentConfig.localOverride !== baselineConfig.localOverride ||
  currentConfig.ip !== baselineConfig.ip ||
  currentConfig.protocol !== baselineConfig.protocol;

const isLocalPollValidated = (validation, currentConfig) =>
  !!validation &&
  validation.localOverride === true &&
  validation.ip === currentConfig.ip &&
  validation.protocol === currentConfig.protocol;

const getLocalValidationState = (device, baselineDevice, localPollValidation) => {
  const currentLocalConfig = getLocalConfig(device);
  const baselineLocalConfig = getLocalConfig(baselineDevice);
  const localConfigChanged = hasLocalConfigChanged(currentLocalConfig, baselineLocalConfig);
  const requiresLocalPollValidation = currentLocalConfig.localOverride === true && localConfigChanged;
  const localPollValidated = isLocalPollValidated(localPollValidation, currentLocalConfig);
  return {
    hasLocalChanges: hasDeviceChanged(device, baselineDevice),
    requiresLocalPollValidation,
    localPollValidated,
    canSave: !requiresLocalPollValidation || localPollValidated
  };
};

const getUnknownKeys = (device, effectiveLocalPollDps) => {
  if (effectiveLocalPollDps) {
    return getUnknownDpsKeys(effectiveLocalPollDps, device.features, device);
  }
  return getUnknownSpecificationCodes(device.specifications, device.features, device);
};

class TuyaDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device,
      baselineDevice: this.props.device,
      localPollValidation: null,
      localPollDps: null
    });
  }

  componentWillReceiveProps(nextProps) {
    const currentDevice = this.state.device;
    const nextDevice = nextProps.device;
    const isNewDevice = !currentDevice || currentDevice.external_id !== nextDevice.external_id;
    const baselineDevice = this.state.baselineDevice;
    const shouldRefreshBaseline = isNewDevice || !baselineDevice || baselineDevice.updated_at !== nextDevice.updated_at;
    let mergedNextDevice =
      currentDevice && currentDevice.specifications && !nextDevice.specifications
        ? { ...nextDevice, specifications: currentDevice.specifications }
        : nextDevice;
    if (currentDevice && currentDevice.tuya_report && !mergedNextDevice.tuya_report) {
      mergedNextDevice = {
        ...mergedNextDevice,
        tuya_report: currentDevice.tuya_report
      };
    }
    if (isNewDevice) {
      this.setState({
        device: mergedNextDevice,
        baselineDevice: mergedNextDevice,
        localPollValidation: null,
        localPollDps: null
      });
      return;
    }
    this.setState({
      device: mergedNextDevice,
      baselineDevice: shouldRefreshBaseline ? mergedNextDevice : baselineDevice
    });
  }

  updateName = e => {
    this.setState({
      device: {
        ...this.state.device,
        name: e.target.value
      }
    });
  };

  updateRoom = e => {
    this.setState({
      device: {
        ...this.state.device,
        room_id: e.target.value
      }
    });
  };

  handleLocalPollChange = patch => {
    this.setState(patch);
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      const payload = {
        ...this.state.device,
        poll_frequency: getLocalConfig(this.state.device).localOverride ? LOCAL_POLL_FREQUENCY : CLOUD_POLL_FREQUENCY
      };
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, payload);
      this.setState({
        device: savedDevice,
        baselineDevice: savedDevice
      });
      if (typeof this.props.onDeviceSaved === 'function') {
        this.props.onDeviceSaved(savedDevice);
      }
    } catch (e) {
      let errorMessage = 'integration.tuya.error.defaultError';
      if (e.response && e.response.status === 409) {
        errorMessage = 'integration.tuya.error.conflictError';
      }
      this.setState({
        errorMessage
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    try {
      if (this.state.device.created_at) {
        await this.props.httpClient.delete(`/api/v1/device/${this.state.device.selector}`);
      }
      this.props.getTuyaDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.tuya.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  render(
    {
      deviceIndex,
      editable,
      editButton,
      deleteButton,
      saveButton,
      updateButton,
      alreadyCreatedButton,
      housesWithRooms
    },
    {
      device,
      loading,
      errorMessage,
      tooMuchStatesError,
      statesNumber,
      localPollStatus,
      localPollError,
      localPollProtocol,
      localPollValidation,
      localPollDps
    }
  ) {
    const validModel = device.features && device.features.length > 0;
    const online = resolveOnlineStatus(device);
    const { deviceId, localKey, productId, productKey, localOverride, persistedLocalPollDps } = getDeviceDisplayData(
      device
    );
    const { hasLocalChanges, requiresLocalPollValidation, localPollValidated, canSave } = getLocalValidationState(
      device,
      this.state.baselineDevice,
      localPollValidation
    );
    const isDiscoverPage = !deleteButton;
    const showUpdateButton =
      validModel && isDiscoverPage && (updateButton || (alreadyCreatedButton && hasLocalChanges));
    const showAlreadyCreatedButton = validModel && alreadyCreatedButton && !hasLocalChanges;
    const effectiveLocalPollDps = localOverride ? localPollDps || persistedLocalPollDps : null;
    const unknownKeys = getUnknownKeys(device, effectiveLocalPollDps);
    const hasPartialSupport = validModel && unknownKeys.length > 0;
    const partialCountLabelId =
      isDiscoverPage && !device.created_at
        ? 'integration.tuya.device.partialFeaturesCountDiscover'
        : 'integration.tuya.device.partialFeaturesCount';

    const renderGithubIssuePrepAlert = titleId => (
      <div class="alert alert-warning mt-3 mb-3">
        <div class="font-weight-bold h5 mb-2">
          <Text id={titleId} />
        </div>
        <div>
          <MarkupText id="integration.tuya.device.githubIssueLocalPrepInfo" />
        </div>
      </div>
    );

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div title={<Text id={`integration.tuya.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.tuya.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.tuya.namePlaceholder" />}
                      disabled={!editable}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.tuya.modelLabel" />
                  </label>
                  <input
                    id={`model_${deviceIndex}`}
                    type="text"
                    value={device.model}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for={`device_id_${deviceIndex}`}>
                    <Text id="integration.tuya.device.idLabel" />
                  </label>
                  <input
                    id={`device_id_${deviceIndex}`}
                    type="text"
                    value={deviceId}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.tuya.roomLabel" />
                  </label>
                  <select
                    id={`room_${deviceIndex}`}
                    onChange={this.updateRoom}
                    class="form-control"
                    disabled={!editable}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {housesWithRooms &&
                      housesWithRooms.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === device.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`product_id_${deviceIndex}`}>
                    <Text id="integration.tuya.device.productIdLabel" />
                  </label>
                  <input
                    id={`product_id_${deviceIndex}`}
                    type="text"
                    value={productId}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                {productKey && (
                  <div class="form-group">
                    <label class="form-label" for={`product_key_${deviceIndex}`}>
                      <Text id="integration.tuya.device.productKeyLabel" />
                    </label>
                    <input
                      id={`product_key_${deviceIndex}`}
                      type="text"
                      value={productKey}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}

                <div class="form-group">
                  <label class="form-label" for={`local_key_${deviceIndex}`}>
                    <Text id="integration.tuya.device.localKeyLabel" />
                  </label>
                  <input
                    id={`local_key_${deviceIndex}`}
                    type="text"
                    value={localKey}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                <TuyaLocalPollSection
                  httpClient={this.props.httpClient}
                  device={device}
                  deviceIndex={deviceIndex}
                  localPollStatus={localPollStatus}
                  localPollError={localPollError}
                  localPollProtocol={localPollProtocol}
                  onLocalPollChange={this.handleLocalPollChange}
                />

                {validModel && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.tuya.device.featuresLabel" />
                      {hasPartialSupport && (
                        <span class="text-muted ml-2">
                          <Text id={partialCountLabelId} fields={{ count: unknownKeys.length }} />
                        </span>
                      )}
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                {hasPartialSupport && renderGithubIssuePrepAlert('integration.tuya.partiallyManagedModelButton')}

                <div class="form-group">
                  {requiresLocalPollValidation && !localPollValidated && (
                    <div class="text-muted mb-2">
                      <Text id="integration.tuya.device.localPollRequired" />
                    </div>
                  )}
                  <div class="d-flex flex-wrap align-items-center justify-content-between">
                    <div class="d-flex flex-wrap align-items-center">
                      {showAlreadyCreatedButton && (
                        <button class="btn btn-primary mr-2" disabled="true">
                          <Text id="integration.tuya.alreadyCreatedButton" />
                        </button>
                      )}

                      {showUpdateButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2" disabled={!canSave}>
                          <Text id="integration.tuya.updateButton" />
                        </button>
                      )}

                      {validModel && saveButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2" disabled={!canSave}>
                          <Text id="integration.tuya.saveButton" />
                        </button>
                      )}

                      {validModel && deleteButton && (
                        <button onClick={this.deleteDevice} class="btn btn-danger">
                          <Text id="integration.tuya.deleteButton" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!validModel && (
                    <div>
                      {renderGithubIssuePrepAlert('integration.tuya.unmanagedModelButton')}
                      {isDiscoverPage && (
                        <TuyaGithubIssueSection
                          actionLabelId="integration.tuya.device.createGithubIssue"
                          device={device}
                          localPollStatus={localPollStatus}
                          localPollError={localPollError}
                          localPollValidation={localPollValidation}
                          localPollDps={localPollDps}
                        />
                      )}
                    </div>
                  )}

                  {validModel && editButton && (
                    <Link href={`/dashboard/integration/device/tuya/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.tuya.device.editButton" />
                      </button>
                    </Link>
                  )}
                </div>
                {hasPartialSupport && isDiscoverPage && (
                  <TuyaGithubIssueSection
                    actionLabelId="integration.tuya.device.createGithubIssuePartial"
                    device={device}
                    localPollStatus={localPollStatus}
                    localPollError={localPollError}
                    localPollValidation={localPollValidation}
                    localPollDps={localPollDps}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(TuyaDeviceBox);
