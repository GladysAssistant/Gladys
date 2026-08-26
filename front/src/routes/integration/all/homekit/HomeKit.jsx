import { Text, MarkupText } from 'preact-i18n';
import get from 'get-value';
import Select from 'react-select';
import { RequestStatus } from '../../../../utils/consts';
import { USER_ROLE } from '../../../../../../server/utils/constants';
import cx from 'classnames';
import style from './style.css';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import { EXPOSURE_MODES } from './actions';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

const mdnsAdvertisers = {
  AVAHI: 'avahi',
  BONJOUR: 'bonjour-hap',
  CIAO: 'ciao',
  RESOLVED: 'resolved'
};

// The house alarm is offered in the same list as the devices, under a prefixed selector. Its name
// is the name of the house, which on its own reads like a device, so it is labelled here — the
// server has no translations.
const ALARM_SELECTOR_PREFIX = 'house-alarm:';

const ExposedDevicesSelect = ({ homekitCompatibleDevices, homekitExposedDevices, updateExposedDevices, intl }) => {
  const alarmLabel = get(intl.dictionary, 'integration.homekit.alarmLabel');
  const deviceOptions = (homekitCompatibleDevices || []).map(device => ({
    value: device.selector,
    label: device.selector.startsWith(ALARM_SELECTOR_PREFIX) ? `${alarmLabel} — ${device.name}` : device.name
  }));

  if (deviceOptions.length === 0) {
    return (
      <div class="alert alert-info">
        <Text id="integration.homekit.noCompatibleDevice" />
      </div>
    );
  }

  return (
    <Select
      isMulti
      options={deviceOptions}
      value={deviceOptions.filter(option => (homekitExposedDevices || []).includes(option.value))}
      onChange={updateExposedDevices}
      maxMenuHeight={220}
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
};

const ExposedDevicesSelectWithIntl = withIntlAsProp(ExposedDevicesSelect);

const HomKitPage = ({ children, ...props }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.homekit.title" />}
    tabs={
      <DeviceConfigurationLink
        user={props.user}
        configurationKey="integrations"
        documentKey="homekit"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.homekit.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.homekit.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.loading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.user && props.user.role === USER_ROLE.ADMIN && (
              <p>
                <MarkupText id="integration.homekit.introduction" />
              </p>
            )}
            {props.homekitReloadStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.homekit.configurationError" />
              </div>
            )}
            {props.homekitResetStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.homekit.resetError" />
              </div>
            )}
            {props.user && props.user.role === USER_ROLE.ADMIN && (
              <div class="form-group">
                <Text id={`integration.homekit.qrCode`} />
                {props.homekitSetupDataUrl && <img class="mx-auto d-block mb-3" src={props.homekitSetupDataUrl} />}
                <div class="input-group mb-2">
                  <p className={style.buttonDescription}>
                    <Text id="integration.homekit.mdns" />
                  </p>
                  <select
                    class="form-control"
                    onChange={props.updateMDNSAdvertiser}
                    value={props.homekitMdnsAdvertiser}
                  >
                    {Object.keys(mdnsAdvertisers).map(mdns => (
                      <option value={mdnsAdvertisers[mdns]}>{mdns}</option>
                    ))}
                  </select>
                  <div class="input-group-append">
                    <button class="btn btn-success" onClick={props.saveMDNSAdvertiser}>
                      <Text id="integration.homekit.saveMDNSButton" />
                    </button>
                  </div>
                </div>
                {props.homekitSaveMDNSStatus === RequestStatus.Success && (
                  <div class="alert alert-success">
                    <Text id="integration.homekit.saveMDNSSuccess" />
                  </div>
                )}
                {props.homekitSaveMDNSStatus === RequestStatus.Error && (
                  <div class="alert alert-danger">
                    <Text id="integration.homekit.saveMDNSError" />
                  </div>
                )}
                <p className={style.buttonDescription}>
                  <Text id="integration.homekit.exposure" />
                </p>
                <select class="form-control mb-2" onChange={props.updateExposureMode} value={props.homekitExposureMode}>
                  <option value={EXPOSURE_MODES.ALL}>
                    <Text id="integration.homekit.exposureModeAll" />
                  </option>
                  <option value={EXPOSURE_MODES.SELECTION}>
                    <Text id="integration.homekit.exposureModeSelection" />
                  </option>
                </select>
                {props.homekitExposureMode === EXPOSURE_MODES.SELECTION && (
                  <div class="mb-2">
                    <ExposedDevicesSelectWithIntl {...props} />
                  </div>
                )}
                <button class="btn btn-success" onClick={props.saveExposure}>
                  <Text id="integration.homekit.saveExposureButton" />
                </button>
                {props.homekitSaveExposureStatus === RequestStatus.Success && (
                  <div class="alert alert-success mt-2">
                    <Text id="integration.homekit.saveExposureSuccess" />
                  </div>
                )}
                {props.homekitSaveExposureStatus === RequestStatus.Error && (
                  <div class="alert alert-danger mt-2">
                    <Text id="integration.homekit.saveExposureError" />
                  </div>
                )}
                <p className={style.buttonDescription}>
                  <Text id={`integration.homekit.reload`} />
                </p>
                <button class="btn btn-primary" onClick={props.refreshBridge}>
                  <Text id={`integration.homekit.reloadButton`} />
                </button>
                <p className={style.buttonDescription}>
                  <MarkupText id={`integration.homekit.reset`} />
                </p>
                <button class="btn btn-danger" onClick={props.resetBridge}>
                  <Text id={`integration.homekit.resetButton`} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default HomKitPage;
