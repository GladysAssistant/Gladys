import { Text, MarkupText } from 'preact-i18n';
import get from 'get-value';
import Select from 'react-select';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { EXPOSURE_MODES, ERROR_CODES } from './actions';
import style from './style.css';

// Vendor ids of the main Matter ecosystems, from the CSA vendor list: a paired ecosystem is shown
// by name rather than by number.
const ECOSYSTEMS = {
  4937: 'Apple Home',
  24582: 'Google Home',
  4631: 'Amazon Alexa',
  4362: 'SmartThings',
  4939: 'Home Assistant'
};

const ecosystemName = fabric =>
  ECOSYSTEMS[fabric.vendorId] ||
  fabric.label ||
  `0x${Number(fabric.vendorId)
    .toString(16)
    .toUpperCase()}`;

// The manual pairing code is easier to type in groups, the way ecosystems print it: 1234-567-8901.
const formatManualCode = code => (code ? code.replace(/^(\d{4})(\d{3})(\d+)$/, '$1-$2-$3') : '');

const ExposedDevicesSelect = ({
  matterBridgeDevices,
  matterBridgeDevicesStatus,
  matterBridgeForm,
  updateMatterBridgeExposedDevices,
  getMatterBridgeDevices,
  intl
}) => {
  const functionName = key => get(intl.dictionary, `integration.matter-bridge.functions.${key}`, { default: key });
  const devicesError = matterBridgeDevicesStatus === RequestStatus.Error;

  const options = (matterBridgeDevices || []).map(device => ({
    value: device.selector,
    label: `${device.name} (${device.functions.map(functionName).join(', ')})`
  }));

  let content = null;
  if (!devicesError && options.length === 0) {
    content = (
      <div class="alert alert-info">
        <Text id="integration.matter-bridge.noCompatibleDevice" />
      </div>
    );
  } else if (!devicesError) {
    content = (
      <Select
        isMulti
        aria-label={get(intl.dictionary, 'integration.matter-bridge.exposedDevicesLabel')}
        options={options}
        value={options.filter(option => matterBridgeForm.exposedDevices.includes(option.value))}
        onChange={updateMatterBridgeExposedDevices}
        maxMenuHeight={220}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    );
  }

  // A failed refresh replaces the selector: the live region stays mounted so that a screen reader
  // announces the error when it appears, and the retry button sits right after it.
  return (
    <div>
      <div role="status" aria-live="polite">
        {devicesError && (
          <div class="alert alert-danger">
            <Text id="integration.matter-bridge.devicesError" />
            <button type="button" class="btn btn-sm btn-secondary ml-2" onClick={getMatterBridgeDevices}>
              <Text id="integration.matter-bridge.retryButton" />
            </button>
          </div>
        )}
      </div>
      {content}
    </div>
  );
};

const ExposedDevicesSelectWithIntl = withIntlAsProp(ExposedDevicesSelect);

const PairingSection = ({ status, qrCode }) => (
  <div class="mt-5">
    <h4>
      <Text id="integration.matter-bridge.pairingTitle" />
    </h4>
    {status.fabrics.length > 0 && (
      <div>
        <p>
          <Text id="integration.matter-bridge.pairedWith" />
        </p>
        <ul>
          {status.fabrics.map(fabric => (
            <li key={fabric.fabricIndex}>{ecosystemName(fabric)}</li>
          ))}
        </ul>
        <p class="text-muted">
          <Text id="integration.matter-bridge.multiAdmin" />
        </p>
      </div>
    )}
    {!status.commissioned && (
      <div class="text-center">
        <p>
          <Text id="integration.matter-bridge.scanQrCode" />
        </p>
        {qrCode && <img class={cx('mx-auto d-block mb-3', style.qrCode)} src={qrCode} />}
        <p>
          <Text id="integration.matter-bridge.manualCode" />
        </p>
        <p class={style.pairingCode}>{formatManualCode(status.manualPairingCode)}</p>
      </div>
    )}
  </div>
);

const ExposureSection = props => (
  <form class="mt-5" onSubmit={props.saveMatterBridge}>
    <h4 id="matter-bridge-exposure-title">
      <Text id="integration.matter-bridge.exposureTitle" />
    </h4>
    <div class="form-group">
      <select
        aria-labelledby="matter-bridge-exposure-title"
        class="form-control mb-2"
        onChange={props.updateMatterBridgeExposureMode}
        value={props.matterBridgeForm.exposureMode}
      >
        <option value={EXPOSURE_MODES.ALL}>
          <Text id="integration.matter-bridge.exposureModeAll" />
        </option>
        <option value={EXPOSURE_MODES.SELECTION}>
          <Text id="integration.matter-bridge.exposureModeSelection" />
        </option>
      </select>
      {props.matterBridgeForm.exposureMode === EXPOSURE_MODES.SELECTION && <ExposedDevicesSelectWithIntl {...props} />}
    </div>
    {props.matterBridgeStatus.running && (
      <p class="text-muted">
        <Text id="integration.matter-bridge.exposedCount" fields={{ count: props.matterBridgeStatus.exposedCount }} />
      </p>
    )}
    <button type="submit" class="btn btn-success">
      <Text id="integration.matter-bridge.saveButton" />
    </button>
    {props.matterBridgeSaveStatus === RequestStatus.Success && (
      <div class="alert alert-success mt-2">
        <Text id="integration.matter-bridge.saveSuccess" />
      </div>
    )}
    {props.matterBridgeSaveStatus === RequestStatus.Error && (
      <div class="alert alert-danger mt-2">
        <Text id="integration.matter-bridge.saveError" />
      </div>
    )}
  </form>
);

const ResetSection = props => (
  <div class="mt-5">
    <h4>
      <Text id="integration.matter-bridge.resetTitle" />
    </h4>
    <p class="text-muted">
      <Text id="integration.matter-bridge.reset" />
    </p>
    {props.matterBridgeResetStatus === RequestStatus.Error && (
      <div class="alert alert-danger">
        <Text id="integration.matter-bridge.resetError" />
      </div>
    )}
    {!props.matterBridgeConfirmReset && (
      <button class="btn btn-outline-danger" onClick={props.askMatterBridgeReset}>
        <Text id="integration.matter-bridge.resetButton" />
      </button>
    )}
    {props.matterBridgeConfirmReset && (
      <div class={cx('d-flex flex-column align-items-start', style.resetConfirm)}>
        <div class="alert alert-danger mb-0">
          <Text id="integration.matter-bridge.resetConfirmMessage" />
        </div>
        <div>
          <button class="btn btn-danger" onClick={props.resetMatterBridge}>
            <Text id="integration.matter-bridge.resetConfirmButton" />
          </button>
          <button class="btn ml-2" onClick={props.cancelMatterBridgeReset}>
            <Text id="integration.matter-bridge.resetCancelButton" />
          </button>
        </div>
      </div>
    )}
  </div>
);

// Why a bridge turned on is not running. The errors the page can explain get their own message;
// any other one is shown as the server reported it.
const StartError = ({ status }) => {
  if (status.errorCode === ERROR_CODES.MATTERBRIDGE_ENABLED) {
    return (
      <div class="alert alert-danger">
        <MarkupText id="integration.matter-bridge.matterbridgeEnabledStartError" fields={{ port: status.port }} />
      </div>
    );
  }
  if (status.errorCode === ERROR_CODES.PORT_IN_USE) {
    return (
      <div class="alert alert-danger">
        <Text id="integration.matter-bridge.portInUse" fields={{ port: status.port }} />
      </div>
    );
  }
  return (
    <div class="alert alert-danger">
      <Text id="integration.matter-bridge.startError" />
      <pre class="mb-0 mt-2">{status.error}</pre>
    </div>
  );
};

const MatterBridgePage = props => {
  const status = props.matterBridgeStatus;

  return (
    <IntegrationSubPageLayout title={<Text id="integration.matter-bridge.title" />}>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.matter-bridge.settingsTitle" />
          </h3>
        </div>
        <div class={cx('card-body dimmer', { active: props.loading })}>
          <div class="loader" />
          <div class="dimmer-content">
            {props.matterBridgeGetStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.matter-bridge.getError" />
              </div>
            )}
            {props.matterBridgeToggleStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.matter-bridge.toggleError" />
              </div>
            )}

            {status && status.hasIpv6 === false && (
              <div class="alert alert-danger">
                <Text id="integration.matter-bridge.ipv6NotEnabled" />
              </div>
            )}
            {status && status.hasIpv6 === true && (
              <div class="alert alert-success">
                <Text id="integration.matter-bridge.ipv6Enabled" />
              </div>
            )}

            {status && !status.enabled && (
              <>
                <p>
                  <MarkupText id="integration.matter-bridge.introduction" />
                </p>
                {status.matterbridgeEnabled ? (
                  <div class="alert alert-warning">
                    <MarkupText id="integration.matter-bridge.matterbridgeEnabled" fields={{ port: status.port }} />
                  </div>
                ) : (
                  <div class="alert alert-warning">
                    <Text id="integration.matter-bridge.disabledWarning" />
                  </div>
                )}
                <div class="form-group">
                  <button
                    class="btn btn-success"
                    onClick={props.enableMatterBridge}
                    disabled={status.matterbridgeEnabled}
                  >
                    <Text id="integration.matter-bridge.enableButton" />
                  </button>
                </div>
              </>
            )}

            {status && status.enabled && (
              <>
                <div class="alert alert-info">
                  <Text id="integration.matter-bridge.enabledDescription" />
                </div>
                {status.error && <StartError status={status} />}
                {status.running && <PairingSection status={status} qrCode={props.matterBridgeQrCode} />}
                {props.matterBridgeForm && <ExposureSection {...props} />}
                <div class="form-group mt-5">
                  <button class="btn btn-danger" onClick={props.disableMatterBridge}>
                    <Text id="integration.matter-bridge.disableButton" />
                  </button>
                </div>
                <ResetSection {...props} />
              </>
            )}
          </div>
        </div>
      </div>
    </IntegrationSubPageLayout>
  );
};

export default MatterBridgePage;
