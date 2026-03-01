import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import { normalizeBoolean } from '../../../../../../server/services/tuya/lib/utils/tuya.normalize';
import {
  buildParamsMap,
  getLocalPollDpsFromParams,
  getUnknownDpsKeys,
  getUnknownSpecificationCodes
} from './commons/deviceHelpers';
import {
  buildIssueTitle,
  buildGithubSearchUrl,
  checkGithubIssueExists,
  createGithubIssueData,
  createGithubUrl,
  createEmptyGithubIssueUrl
} from './commons/githubIssue';

const ONLINE_RECENT_MINUTES = 5;
const LOCAL_POLL_FREQUENCY = 10 * 1000;
const CLOUD_POLL_FREQUENCY = 30 * 1000;

const parseDate = dateValue => {
  if (!dateValue) {
    return null;
  }
  let date = new Date(dateValue);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  if (typeof dateValue === 'string') {
    const normalized = dateValue.replace(' ', 'T').replace(' +', '+');
    date = new Date(normalized);
  }
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const getMostRecentFeatureDate = device => {
  if (!Array.isArray(device && device.features)) {
    return null;
  }
  return device.features.reduce((mostRecent, feature) => {
    const featureDate = parseDate(feature && feature.last_value_changed);
    if (!featureDate) {
      return mostRecent;
    }
    if (!mostRecent || featureDate > mostRecent) {
      return featureDate;
    }
    return mostRecent;
  }, null);
};

const isReachableFromRecentFeatures = device => {
  const mostRecentFeatureDate = getMostRecentFeatureDate(device);
  if (!mostRecentFeatureDate) {
    return false;
  }
  return Date.now() - mostRecentFeatureDate.getTime() <= ONLINE_RECENT_MINUTES * 60 * 1000;
};

const resolveOnlineStatus = device => {
  if (isReachableFromRecentFeatures(device)) {
    return true;
  }
  const online = device && device.online;
  if (typeof online === 'boolean') {
    return online;
  }
  if (online === 1 || online === 0) {
    return online === 1;
  }
  return false;
};

const buildComparableDevice = device => {
  if (!device) {
    return null;
  }
  const params = buildParamsMap(device);
  const localOverrideRaw =
    params.LOCAL_OVERRIDE !== undefined && params.LOCAL_OVERRIDE !== null
      ? params.LOCAL_OVERRIDE
      : device.local_override;
  return {
    name: device.name || '',
    room_id: device.room_id || null,
    ip: params.IP_ADDRESS || device.ip || '',
    protocol: params.PROTOCOL_VERSION || device.protocol_version || '',
    local_override: normalizeBoolean(localOverrideRaw)
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
  const localOverrideRaw =
    params.LOCAL_OVERRIDE !== undefined && params.LOCAL_OVERRIDE !== null
      ? params.LOCAL_OVERRIDE
      : device.local_override;
  return {
    ip: params.IP_ADDRESS || device.ip || '',
    protocol: params.PROTOCOL_VERSION || device.protocol_version || '',
    localOverride: normalizeBoolean(localOverrideRaw)
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

class TuyaDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device,
      baselineDevice: this.props.device,
      localPollValidation: null,
      localPollDps: null,
      githubIssueChecking: false,
      githubIssueExists: false,
      githubIssuePayload: null,
      githubIssuePayloadCopied: false,
      githubIssuePayloadUrl: null,
      githubIssueOpened: false
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
        localPollDps: null,
        githubIssueChecking: false,
        githubIssueExists: false,
        githubIssuePayload: null,
        githubIssuePayloadCopied: false,
        githubIssuePayloadUrl: null,
        githubIssueOpened: false
      });
      return;
    }
    this.setState({
      device: mergedNextDevice,
      baselineDevice: shouldRefreshBaseline ? mergedNextDevice : baselineDevice
    });
  }

  toggleIpMode = () => {
    const device = this.state.device;
    const params = Array.isArray(device.params) ? [...device.params] : [];
    const overrideParam = params.find(param => param.name === 'LOCAL_OVERRIDE');
    const localOverrideRaw = overrideParam ? overrideParam.value : device.local_override;
    const currentOverride = normalizeBoolean(localOverrideRaw);
    const nextOverride = currentOverride !== true;
    const existingIndex = params.findIndex(param => param.name === 'LOCAL_OVERRIDE');
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: nextOverride };
    } else {
      params.push({ name: 'LOCAL_OVERRIDE', value: nextOverride });
    }
    this.setState({
      device: {
        ...device,
        params,
        local_override: nextOverride
      },
      localPollValidation: null,
      localPollStatus: null,
      localPollError: null,
      localPollDps: null,
      githubIssueExists: false,
      githubIssuePayload: null,
      githubIssuePayloadCopied: false,
      githubIssuePayloadUrl: null,
      githubIssueOpened: false
    });
  };

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
      },
      localPollValidation: null,
      localPollStatus: null,
      localPollError: null,
      localPollDps: null
    });
  };

  pollLocal = async () => {
    const currentDevice = this.state.device;
    this.setState({
      localPollStatus: RequestStatus.Getting,
      localPollError: null,
      localPollProtocol: null,
      localPollDps: null
    });
    const params = Array.isArray(currentDevice.params) ? currentDevice.params : [];
    const getParam = name => {
      const found = params.find(param => param.name === name);
      return found ? found.value : undefined;
    };
    const tryProtocols = ['3.5', '3.4', '3.3', '3.1'];
    const selectedProtocol = getParam('PROTOCOL_VERSION') || currentDevice.protocol_version;
    const protocolList = selectedProtocol ? [selectedProtocol] : tryProtocols;
    try {
      let result = null;
      let usedProtocol = selectedProtocol;
      let latestDevice = null;
      const isValidResult = data => data && typeof data === 'object' && data.dps;
      for (let i = 0; i < protocolList.length; i += 1) {
        const protocolVersion = protocolList[i];
        try {
          this.setState({
            localPollProtocol: protocolVersion
          });
          const response = await this.props.httpClient.post('/api/v1/service/tuya/local-poll', {
            deviceId: currentDevice.external_id
              ? currentDevice.external_id.split(':')[1] || currentDevice.external_id
              : undefined,
            ip: getParam('IP_ADDRESS') || currentDevice.ip,
            localKey: getParam('LOCAL_KEY') || currentDevice.local_key,
            protocolVersion,
            timeoutMs: 3000,
            fastScan: true
          });
          result = response && response.dps ? response : null;
          const updatedDevice = response && response.device ? response.device : null;
          if (updatedDevice) {
            latestDevice = updatedDevice;
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
      const baseDevice = latestDevice || currentDevice;
      const baseParams = Array.isArray(baseDevice.params) ? [...baseDevice.params] : [];
      const newParams = baseParams;
      if (usedProtocol) {
        const protocolIndex = newParams.findIndex(param => param.name === 'PROTOCOL_VERSION');
        if (protocolIndex >= 0) {
          newParams[protocolIndex] = { ...newParams[protocolIndex], value: usedProtocol };
        } else {
          newParams.push({ name: 'PROTOCOL_VERSION', value: usedProtocol });
        }
      }
      this.setState({
        device: {
          ...baseDevice,
          params: newParams
        },
        localPollStatus: RequestStatus.Success,
        localPollProtocol: null,
        localPollValidation: {
          ip: getParam('IP_ADDRESS') || currentDevice.ip || '',
          protocol: usedProtocol || '',
          localOverride: true
        },
        localPollDps: result ? result.dps : null
      });
    } catch (e) {
      const message =
        (e && e.response && e.response.data && e.response.data.message) || (e && e.message) || 'Unknown error';
      this.setState({
        localPollStatus: RequestStatus.Error,
        localPollError: message,
        localPollProtocol: null,
        localPollDps: null
      });
    }
  };

  updateIpAddress = e => {
    const ipAddress = e.target.value;
    const params = Array.isArray(this.state.device.params) ? [...this.state.device.params] : [];
    const existingIndex = params.findIndex(param => param.name === 'IP_ADDRESS');
    if (existingIndex >= 0) {
      params[existingIndex] = { ...params[existingIndex], value: ipAddress };
    } else {
      params.push({ name: 'IP_ADDRESS', value: ipAddress });
    }
    this.setState({
      device: {
        ...this.state.device,
        params
      },
      localPollValidation: null,
      localPollStatus: null,
      localPollError: null,
      localPollDps: null
    });
  };

  handleCreateGithubIssue = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const {
      githubIssueChecking,
      githubIssueExists,
      githubIssuePayload,
      githubIssuePayloadUrl,
      githubIssueOpened,
      device,
      localPollStatus,
      localPollError,
      localPollValidation,
      localPollDps
    } = this.state;
    if (githubIssueChecking || githubIssueExists || githubIssuePayload || githubIssuePayloadUrl || githubIssueOpened) {
      return;
    }
    const persistedLocalPollDps = getLocalPollDpsFromParams(device);
    const effectiveLocalPollDps = localPollDps || persistedLocalPollDps;
    const issueData = createGithubIssueData(
      device,
      localPollStatus,
      localPollError,
      localPollValidation,
      effectiveLocalPollDps
    );
    const issueUrl = issueData.url;
    const issueTitle = buildIssueTitle(device);
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.title = 'GitHub';
      popup.document.body.innerText = 'Searching for existing issues...';
    }

    this.setState({ githubIssueChecking: true });

    let shouldOpenIssue = true;
    try {
      const exists = await checkGithubIssueExists(issueTitle);
      if (exists) {
        shouldOpenIssue = false;
        this.setState({ githubIssueExists: true });
      }
    } catch (error) {
      shouldOpenIssue = true;
    } finally {
      this.setState({ githubIssueChecking: false });
    }

    const closePopup = () => {
      if (popup && !popup.closed) {
        popup.close();
      }
    };

    if (!shouldOpenIssue) {
      closePopup();
      this.setState({
        githubIssuePayload: null,
        githubIssuePayloadCopied: false,
        githubIssuePayloadUrl: null,
        githubIssueOpened: false
      });
      return;
    }

    if (issueData.truncated) {
      closePopup();
      this.setState({
        githubIssuePayload: issueData.body,
        githubIssuePayloadCopied: false,
        githubIssuePayloadUrl: issueData.url,
        githubIssueOpened: false
      });
      return;
    }

    this.setState({
      githubIssuePayload: null,
      githubIssuePayloadCopied: false,
      githubIssuePayloadUrl: null,
      githubIssueOpened: true
    });

    if (popup) {
      popup.location = issueUrl;
      return;
    }
    window.open(issueUrl, '_blank');
  };

  copyGithubIssuePayload = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const { githubIssuePayload } = this.state;
    if (!githubIssuePayload) {
      return;
    }
    let copied = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(githubIssuePayload);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }
    if (!copied && this.githubIssueTextarea) {
      try {
        this.githubIssueTextarea.focus();
        this.githubIssueTextarea.select();
        this.githubIssueTextarea.setSelectionRange(0, this.githubIssueTextarea.value.length);
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      } finally {
        this.githubIssueTextarea.blur();
      }
    }
    this.setState({ githubIssuePayloadCopied: copied });
  };

  openEmptyGithubIssue = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const { githubIssuePayloadUrl, githubIssueChecking, githubIssueExists, githubIssueOpened, device } = this.state;
    if (!githubIssuePayloadUrl || githubIssueChecking || githubIssueExists || githubIssueOpened || !device) {
      return;
    }
    const issueTitle = buildIssueTitle(device);
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.opener = null;
    }
    this.setState({ githubIssueChecking: true });
    let shouldOpenIssue = true;
    try {
      const exists = await checkGithubIssueExists(issueTitle);
      if (exists) {
        shouldOpenIssue = false;
        if (popup && !popup.closed) {
          popup.close();
        }
        this.setState({ githubIssueExists: true });
      }
    } catch (error) {
      shouldOpenIssue = true;
    } finally {
      this.setState({ githubIssueChecking: false });
    }
    if (!shouldOpenIssue) {
      return;
    }
    if (popup && !popup.closed) {
      popup.location.href = createEmptyGithubIssueUrl(issueTitle);
    } else {
      window.open(createEmptyGithubIssueUrl(issueTitle), '_blank');
    }
    this.setState({ githubIssueOpened: true });
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
      localPollDps,
      githubIssueChecking,
      githubIssueExists,
      githubIssuePayload,
      githubIssuePayloadCopied,
      githubIssuePayloadUrl,
      githubIssueOpened
    }
  ) {
    const validModel = device.features && device.features.length > 0;
    const online = resolveOnlineStatus(device);
    const paramsArray = Array.isArray(device.params) ? device.params : [];
    const params = paramsArray.reduce((acc, param) => {
      acc[param.name] = param.value;
      return acc;
    }, {});
    const deviceId = params.DEVICE_ID || (device.external_id ? device.external_id.split(':')[1] : '');
    const localKey = params.LOCAL_KEY || device.local_key || '';
    const productId = params.PRODUCT_ID || device.product_id || '';
    const productKey = params.PRODUCT_KEY || device.product_key || '';
    const protocolVersion = params.PROTOCOL_VERSION || device.protocol_version || '';
    const localOverrideRaw =
      params.LOCAL_OVERRIDE !== undefined && params.LOCAL_OVERRIDE !== null
        ? params.LOCAL_OVERRIDE
        : device.local_override;
    const localOverride = normalizeBoolean(localOverrideRaw);
    const ipAddress = params.IP_ADDRESS || device.ip || '';
    const cloudIp = params.CLOUD_IP || device.cloud_ip || '';
    const showCloudIp = localOverride !== true;
    const displayIp = showCloudIp ? cloudIp : ipAddress;
    const isValidIp =
      typeof ipAddress === 'string' && /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ipAddress);
    const canPollLocal = localOverride === true && isValidIp && localKey;
    const hasLocalChanges = hasDeviceChanged(device, this.state.baselineDevice);
    const currentLocalConfig = getLocalConfig(device);
    const baselineLocalConfig = getLocalConfig(this.state.baselineDevice);
    const localConfigChanged = hasLocalConfigChanged(currentLocalConfig, baselineLocalConfig);
    const requiresLocalPollValidation = currentLocalConfig.localOverride === true && localConfigChanged;
    const localPollValidated = isLocalPollValidated(localPollValidation, currentLocalConfig);
    const canSave = !requiresLocalPollValidation || localPollValidated;
    const isDiscoverPage = !deleteButton;
    const showUpdateButton =
      validModel && isDiscoverPage && (updateButton || (alreadyCreatedButton && hasLocalChanges));
    const showAlreadyCreatedButton = validModel && alreadyCreatedButton && !hasLocalChanges;
    const pollProtocolLabel = localPollProtocol || protocolVersion || '-';
    const githubIssuesUrl = githubIssueExists ? buildGithubSearchUrl(buildIssueTitle(device)) : null;
    const persistedLocalPollDps = getLocalPollDpsFromParams(device);
    const effectiveLocalPollDps = localOverride ? localPollDps || persistedLocalPollDps : null;
    const unknownLocalDpsKeys = getUnknownDpsKeys(effectiveLocalPollDps, device.features, device);
    const unknownSpecCodes = getUnknownSpecificationCodes(device.specifications, device.features, device);
    const unknownKeys = effectiveLocalPollDps ? unknownLocalDpsKeys : unknownSpecCodes;
    const hasPartialSupport = validModel && unknownKeys.length > 0;
    const partialCountLabelId =
      isDiscoverPage && !device.created_at
        ? 'integration.tuya.device.partialFeaturesCountDiscover'
        : 'integration.tuya.device.partialFeaturesCount';
    const disableGithubIssueButton =
      githubIssueChecking || githubIssueExists || githubIssueOpened || githubIssuePayloadUrl || githubIssuePayload;

    const renderGithubIssueButton = (labelId, extraClass = '') => (
      <a
        class={cx('btn btn-gray', {
          [extraClass]: !!extraClass,
          disabled: disableGithubIssueButton
        })}
        href={
          disableGithubIssueButton
            ? '#'
            : createGithubUrl(
                this.state.device,
                localPollStatus,
                localPollError,
                localPollValidation,
                effectiveLocalPollDps
              )
        }
        onClick={this.handleCreateGithubIssue}
        aria-disabled={disableGithubIssueButton}
        tabIndex={disableGithubIssueButton ? -1 : undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Text id={labelId} />
      </a>
    );

    const renderGithubIssueAction = () => (
      <div>
        <div class="d-flex flex-wrap">
          {renderGithubIssueButton('integration.tuya.device.createGithubIssue', 'ml-sm-auto')}
        </div>
        {githubIssueExists ? (
          <div class="alert alert-info mt-2">
            <MarkupText id="integration.tuya.device.githubIssueExistsInfo" fields={{ issuesUrl: githubIssuesUrl }} />
          </div>
        ) : (
          <div class="text-muted mt-2">
            <Text id="integration.tuya.device.githubIssueInfo" />
          </div>
        )}
      </div>
    );

    const renderGithubIssuePayloadInfo = () => {
      if (!githubIssuePayload && !githubIssuePayloadCopied) {
        return null;
      }
      return (
        <div class="alert alert-info mt-2">
          <div>
            <Text id="integration.tuya.device.githubIssuePayloadInfo" />
            <textarea
              class="form-control mt-2"
              rows="6"
              readOnly
              value={githubIssuePayload || ''}
              ref={el => {
                this.githubIssueTextarea = el;
              }}
            />
            <div class="d-flex align-items-center mt-2">
              <button onClick={this.copyGithubIssuePayload} class="btn btn-outline-primary">
                <Text id="integration.tuya.device.githubIssuePayloadCopyButton" />
              </button>
              <button
                onClick={this.openEmptyGithubIssue}
                class="btn btn-outline-secondary ml-auto"
                disabled={!githubIssuePayloadUrl || githubIssueChecking || githubIssueExists || githubIssueOpened}
              >
                <Text id="integration.tuya.device.githubIssuePayloadOpenEmptyButton" />
              </button>
            </div>
            {githubIssuePayloadCopied && (
              <div class="text-success mt-2">
                <Text id="integration.tuya.device.githubIssuePayloadCopied" />
              </div>
            )}
          </div>
        </div>
      );
    };

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
                    <option value="3.1">3.1</option>
                    <option value="3.3">3.3</option>
                    <option value="3.4">3.4</option>
                    <option value="3.5">3.5</option>
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
                      {hasPartialSupport && (
                        <span class="text-muted ml-2">
                          <Text id={partialCountLabelId} fields={{ count: unknownKeys.length }} />
                        </span>
                      )}
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                {hasPartialSupport && (
                  <div class="alert alert-warning mt-3 mb-3">
                    <Text id="integration.tuya.partiallyManagedModelButton" />
                  </div>
                )}

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

                    {hasPartialSupport && isDiscoverPage && (
                      <div>{renderGithubIssueButton('integration.tuya.device.createGithubIssuePartial')}</div>
                    )}
                  </div>

                  {!validModel && (
                    <div>
                      <div class="alert alert-warning">
                        <Text id="integration.tuya.unmanagedModelButton" />
                      </div>
                      {isDiscoverPage && renderGithubIssueAction()}
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
                  <>
                    {githubIssueExists ? (
                      <div class="alert alert-info mt-2">
                        <MarkupText
                          id="integration.tuya.device.githubIssueExistsInfo"
                          fields={{ issuesUrl: githubIssuesUrl }}
                        />
                      </div>
                    ) : (
                      <div class="text-muted mt-2">
                        <Text id="integration.tuya.device.githubIssueInfo" />
                      </div>
                    )}
                  </>
                )}
                {renderGithubIssuePayloadInfo()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(TuyaDeviceBox);
