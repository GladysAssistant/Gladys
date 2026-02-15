import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const sanitizeDeviceForIssue = device => {
  if (!device) {
    return device;
  }
  const sanitized = { ...device };
  const params = Array.isArray(device.params) ? device.params.map(param => ({ ...param })) : [];
  params.forEach(param => {
    if (['LOCAL_KEY', 'IP_ADDRESS', 'CLOUD_IP'].includes(param.name)) {
      param.value = '<redacted>';
    }
  });
  sanitized.params = params;
  if (sanitized.local_key) {
    sanitized.local_key = '<redacted>';
  }
  if (sanitized.ip) {
    sanitized.ip = '<redacted>';
  }
  if (sanitized.cloud_ip) {
    sanitized.cloud_ip = '<redacted>';
  }
  sanitized.mode = sanitized.local_override ? 'local' : 'cloud';
  return sanitized;
};

const createGithubUrl = device => {
  const title = encodeURIComponent(`Tuya: Unsupported device ${device.product_id || device.model || device.name}`);
  const sanitized = sanitizeDeviceForIssue(device);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(sanitized, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

class TuyaDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      device: nextProps.device
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

  updateProtocol = e => {
    const protocolVersion = e.target.value;
    const params = Array.isArray(this.state.device.params) ? [...this.state.device.params] : [];
    const existingIndex = params.findIndex(param => param.name === 'PROTOCOL_VERSION');
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: protocolVersion };
    } else {
      params.push({ name: 'PROTOCOL_VERSION', value: protocolVersion });
    }
    this.setState({
      device: {
        ...this.state.device,
        params
      }
    });
  };

  pollLocal = async () => {
    this.setState({
      localPollStatus: RequestStatus.Getting,
      localPollError: null
    });
    const params = Array.isArray(this.state.device.params) ? this.state.device.params : [];
    const getParam = name => {
      const found = params.find(param => param.name === name);
      return found ? found.value : undefined;
    };
    const tryProtocols = ['3.5', '3.4', '3.3', '3.1'];
    const selectedProtocol = getParam('PROTOCOL_VERSION') || this.state.device.protocol_version;
    const protocolList = selectedProtocol ? [selectedProtocol] : tryProtocols;
    try {
      let result = null;
      let usedProtocol = selectedProtocol;
      const isValidResult = data => data && typeof data === 'object' && data.dps;
      for (let i = 0; i < protocolList.length; i += 1) {
        const protocolVersion = protocolList[i];
        try {
          const response = await this.props.httpClient.post('/api/v1/service/tuya/local-poll', {
            deviceId: this.state.device.external_id && this.state.device.external_id.split(':')[1],
            ip: getParam('IP_ADDRESS') || this.state.device.ip,
            localKey: getParam('LOCAL_KEY') || this.state.device.local_key,
            protocolVersion
          });
          result = response && response.dps ? response : null;
          const updatedDevice = response && response.device ? response.device : null;
          if (updatedDevice) {
            this.setState({
              device: updatedDevice
            });
          }
          if (!isValidResult(result)) {
            throw new Error('Invalid local poll response');
          }
          usedProtocol = protocolVersion;
          break;
        } catch (e) {
          if (i === protocolList.length - 1) {
            throw e;
          }
        }
      }
      const newParams = [...params];
      if (usedProtocol) {
        const protocolIndex = newParams.findIndex(param => param.name === 'PROTOCOL_VERSION');
        if (protocolIndex >= 0) {
          newParams[protocolIndex] = { ...newParams[protocolIndex], value: usedProtocol };
        } else {
          newParams.push({ name: 'PROTOCOL_VERSION', value: usedProtocol });
        }
      }
      const existingIndex = newParams.findIndex(param => param.name === 'TUYA_DP_MAP');
      if (existingIndex >= 0) {
        newParams[existingIndex] = { ...newParams[existingIndex], value: JSON.stringify(result) };
      } else {
        newParams.push({ name: 'TUYA_DP_MAP', value: JSON.stringify(result) });
      }
      this.setState({
        device: {
          ...this.state.device,
          params: newParams
        },
        localPollStatus: RequestStatus.Success
      });
    } catch (e) {
      const message =
        (e && e.response && e.response.data && e.response.data.message) || (e && e.message) || 'Unknown error';
      this.setState({
        localPollStatus: RequestStatus.Error,
        localPollError: message
      });
    }
  };

  updateIpAddress = e => {
    const ipAddress = e.target.value;
    const params = Array.isArray(this.state.device.params) ? [...this.state.device.params] : [];
    const existingIndex = params.findIndex(param => param.name === 'IP_ADDRESS');
    const cloudIpParam = params.find(param => param.name === 'CLOUD_IP');
    const cloudIp = cloudIpParam ? cloudIpParam.value : undefined;
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: ipAddress };
    } else {
      params.push({ name: 'IP_ADDRESS', value: ipAddress });
    }
    const overrideValue = ipAddress && cloudIp && ipAddress !== cloudIp ? true : false;
    const overrideIndex = params.findIndex(param => param.name === 'LOCAL_OVERRIDE');
    if (overrideIndex >= 0) {
      params[overrideIndex] = { ...params[overrideIndex], value: overrideValue };
    } else {
      params.push({ name: 'LOCAL_OVERRIDE', value: overrideValue });
    }
    this.setState({
      device: {
        ...this.state.device,
        params
      }
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, this.state.device);
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      let errorMessage = 'integration.tuya.error.defaultError';
      if (e.response.status === 409) {
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
      housesWithRooms,
      selectable,
      selected,
      onToggleSelected
    },
    { device, loading, errorMessage, tooMuchStatesError, statesNumber, localPollStatus, localPollError }
  ) {
    const supportedModel = device.tuya_supported !== false;
    const validModel = supportedModel;
    const online = device.online;
    const paramsArray = Array.isArray(device.params) ? device.params : [];
    const params = paramsArray.reduce((acc, param) => {
      acc[param.name] = param.value;
      return acc;
    }, {});
    const deviceId = params.DEVICE_ID || (device.external_id ? device.external_id.split(':')[1] : '');
    const localKey = params.LOCAL_KEY || device.local_key || '';
    const protocolVersion = params.PROTOCOL_VERSION || device.protocol_version || '';
    const localOverride =
      params.LOCAL_OVERRIDE !== undefined && params.LOCAL_OVERRIDE !== null
        ? params.LOCAL_OVERRIDE
        : device.local_override;
    const dpMapParam = paramsArray.find(param => param.name === 'TUYA_DP_MAP');
    const dpMapValue = dpMapParam ? dpMapParam.value : null;
    const isJsonDpMap = dpMapValue && typeof dpMapValue === 'string' && dpMapValue.trim().startsWith('{');
    const ipAddress = params.IP_ADDRESS || device.ip || '';
    const hasProtocolSelected = protocolVersion && protocolVersion.length > 0;
    const canPollLocal = ipAddress && localKey;
    const requiresProtocol = localOverride === true;
    const canSave = !requiresProtocol || hasProtocolSelected;
    const productKey = params.PRODUCT_KEY || device.product_key || '';
    const productId = productKey || device.product_id || '';

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between">
            <Localizer>
              <div title={<Text id={`integration.tuya.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
            {selectable && (
              <div class="custom-control custom-checkbox">
                <input
                  id={`select_${deviceIndex}`}
                  type="checkbox"
                  class="custom-control-input"
                  checked={selected === true}
                  disabled={!validModel || (requiresProtocol && !hasProtocolSelected)}
                  onChange={() => onToggleSelected && onToggleSelected(device.external_id)}
                />
                <label class="custom-control-label" for={`select_${deviceIndex}`} />
              </div>
            )}
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
                  {productKey && device.product_id && productKey !== device.product_id && (
                    <small class="form-text text-muted">
                      <Text id="integration.tuya.device.productIdCloudLabel" /> {device.product_id}
                    </small>
                  )}
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

                <div class="form-group">
                  <label class="form-label" for={`ip_${deviceIndex}`}>
                    <Text id="integration.tuya.device.ipAddressLabel" />
                  </label>
                  <input
                    id={`ip_${deviceIndex}`}
                    type="text"
                    value={ipAddress}
                    class="form-control"
                    onInput={this.updateIpAddress}
                    disabled={!editable}
                  />
                  <small class="form-text text-muted">
                    <Text id="integration.tuya.device.localInfoHelp" />
                  </small>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`protocol_${deviceIndex}`}>
                    <Text id="integration.tuya.device.protocolVersionLabel" />
                  </label>
                  <select
                    id={`protocol_${deviceIndex}`}
                    class="form-control"
                    value={protocolVersion}
                    onChange={this.updateProtocol}
                    disabled={!editable}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    <option value="3.1">3.1</option>
                    <option value="3.3">3.3</option>
                    <option value="3.4">3.4</option>
                    <option value="3.5">3.5</option>
                  </select>
                </div>

                {(validModel || !supportedModel) && (
                  <div class="form-group">
                    <button
                      onClick={this.pollLocal}
                      class="btn btn-outline-secondary"
                      disabled={!canPollLocal || localPollStatus === RequestStatus.Getting}
                    >
                      <Text id="integration.tuya.device.localPollButton" />
                    </button>
                    {localPollStatus === RequestStatus.Success && (
                      <span class="text-success ml-2">
                        <Text id="integration.tuya.device.localPollSuccess" />
                      </span>
                    )}
                    {localPollStatus === RequestStatus.Error && (
                      <span class="text-danger ml-2">
                        <Text id="integration.tuya.device.localPollError" /> {localPollError}
                      </span>
                    )}
                    {!supportedModel && dpMapValue && (
                      <div class="mt-3">
                        <label class="form-label">
                          <Text id="integration.tuya.device.dpMapLabel" />
                        </label>
                        <pre class="mb-2">{isJsonDpMap ? dpMapValue : JSON.stringify(dpMapValue, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

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

                {validModel && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.tuya.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.tuya.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && updateButton && (
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

                  {!supportedModel && (
                    <div>
                      <div class="alert alert-warning">
                        <Text id="integration.tuya.unmanagedModelButton" />
                      </div>
                      <div class="alert alert-warning py-1">
                        <small>
                          <Text id="integration.tuya.unmanagedModelHelp" />
                        </small>
                      </div>
                      <a class="btn btn-gray" href={createGithubUrl(device)} target="_blank" rel="noopener noreferrer">
                        <Text id="integration.tuya.device.createGithubIssue" />
                      </a>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(TuyaDeviceBox);
