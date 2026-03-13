import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import { buildParamsMap, normalizeBoolean, getLocalOverrideValue, getTuyaDeviceId } from './commons/deviceHelpers';
import { pollLocalDevice } from './commons/localPoll';

const PROTOCOL_OPTIONS = ['3.1', '3.3', '3.4', '3.5'];

class TuyaLocalPollSection extends Component {
  toggleIpMode = () => {
    const { device, onLocalPollChange } = this.props;
    if (!device || typeof onLocalPollChange !== 'function') {
      return;
    }
    const params = Array.isArray(device.params) ? [...device.params] : [];
    const currentOverride = normalizeBoolean(getLocalOverrideValue(device));
    const nextOverride = currentOverride !== true;
    const existingIndex = params.findIndex(param => param.name === 'LOCAL_OVERRIDE');
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: nextOverride };
    } else {
      params.push({ name: 'LOCAL_OVERRIDE', value: nextOverride });
    }
    onLocalPollChange({
      device: {
        ...device,
        params,
        local_override: nextOverride
      },
      localPollValidation: null,
      localPollStatus: null,
      localPollError: null,
      localPollDps: null
    });
  };

  updateProtocol = e => {
    const { device, onLocalPollChange } = this.props;
    if (!device || typeof onLocalPollChange !== 'function') {
      return;
    }
    const protocolVersion = e.target.value;
    const params = Array.isArray(device.params) ? [...device.params] : [];
    const existingIndex = params.findIndex(param => param.name === 'PROTOCOL_VERSION');
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: protocolVersion };
    } else {
      params.push({ name: 'PROTOCOL_VERSION', value: protocolVersion });
    }
    onLocalPollChange({
      device: {
        ...device,
        params
      },
      localPollValidation: null,
      localPollStatus: null,
      localPollError: null,
      localPollDps: null
    });
  };

  updateIpAddress = e => {
    const { device, onLocalPollChange } = this.props;
    if (!device || typeof onLocalPollChange !== 'function') {
      return;
    }
    const ipAddress = e.target.value;
    const params = Array.isArray(device.params) ? [...device.params] : [];
    const existingIndex = params.findIndex(param => param.name === 'IP_ADDRESS');
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: ipAddress };
    } else {
      params.push({ name: 'IP_ADDRESS', value: ipAddress });
    }
    onLocalPollChange({
      device: {
        ...device,
        params
      },
      localPollValidation: null,
      localPollStatus: null,
      localPollError: null,
      localPollDps: null
    });
  };

  pollLocal = async () => {
    const { httpClient, device, onLocalPollChange } = this.props;
    if (!httpClient || !device || typeof onLocalPollChange !== 'function') {
      return;
    }
    onLocalPollChange({
      localPollStatus: RequestStatus.Getting,
      localPollError: null,
      localPollProtocol: null,
      localPollDps: null
    });
    try {
      const pollResult = await pollLocalDevice({
        httpClient,
        device,
        onProtocolAttempt: protocolVersion => {
          onLocalPollChange({
            localPollProtocol: protocolVersion
          });
        }
      });
      onLocalPollChange({
        device: pollResult.device,
        localPollStatus: RequestStatus.Success,
        localPollError: null,
        localPollProtocol: null,
        localPollValidation: {
          ip: pollResult.ip,
          protocol: pollResult.protocol,
          localOverride: true
        },
        localPollDps: pollResult.dps
      });
    } catch (e) {
      const message =
        (e && e.response && e.response.data && e.response.data.message) || (e && e.message) || 'Unknown error';
      onLocalPollChange({
        localPollStatus: RequestStatus.Error,
        localPollError: message,
        localPollProtocol: null,
        localPollDps: null
      });
    }
  };

  render({ device, deviceIndex, localPollStatus, localPollError, localPollProtocol }) {
    const params = buildParamsMap(device);
    const deviceId = params.DEVICE_ID || getTuyaDeviceId(device);
    const localKey = params.LOCAL_KEY || (device && device.local_key) || '';
    const protocolVersion = params.PROTOCOL_VERSION || (device && device.protocol_version) || '';
    const ipAddress = params.IP_ADDRESS || (device && device.ip) || '';
    const cloudIp = params.CLOUD_IP || (device && device.cloud_ip) || '';
    const localOverride = normalizeBoolean(getLocalOverrideValue(device));
    const showCloudIp = localOverride !== true;
    const displayIp = showCloudIp ? cloudIp : ipAddress;
    const canPollLocal = localOverride === true && !!localKey && !!deviceId;
    const pollProtocolLabel = localPollProtocol || protocolVersion || '-';

    return (
      <>
        <div class="form-group">
          <label class="form-label" for={`ip_${deviceIndex}`}>
            <Text id="integration.tuya.device.ipAddressLabel" />
          </label>
          <div class="input-group">
            <input
              id={`ip_${deviceIndex}`}
              type="text"
              value={displayIp}
              class="form-control"
              onInput={!showCloudIp ? this.updateIpAddress : undefined}
              disabled={showCloudIp}
            />
            <div class="input-group-append">
              <button class="btn btn-outline-secondary" type="button" onClick={this.toggleIpMode}>
                <Text id={`integration.tuya.device.${showCloudIp ? 'ipModeCloud' : 'ipModeLocal'}`} />
              </button>
            </div>
          </div>
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
            disabled={showCloudIp}
          >
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {PROTOCOL_OPTIONS.map(option => (
              <option value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div class="form-group">
          <button
            onClick={this.pollLocal}
            class="btn btn-outline-secondary"
            disabled={!canPollLocal || localPollStatus === RequestStatus.Getting}
          >
            <Text id="integration.tuya.device.localPollButton" />
          </button>
          {localPollStatus === RequestStatus.Getting && (
            <span class="text-muted ml-2">
              <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
              <Text id="integration.tuya.device.localPollInProgress" fields={{ protocol: pollProtocolLabel }} />
            </span>
          )}
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
          <small class="form-text text-muted mt-2">
            <Text id="integration.tuya.device.localPollHelp" />
          </small>
        </div>
      </>
    );
  }
}

export default TuyaLocalPollSection;
