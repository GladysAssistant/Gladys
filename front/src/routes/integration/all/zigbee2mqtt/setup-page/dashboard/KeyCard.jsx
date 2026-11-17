import { Text } from 'preact-i18n';
import get from 'get-value';

import KeyPhoto from '../wizard/KeyPhoto';
import { isExternal, isNetworkCoordinator } from './dashboardState';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// The driver Zigbee2mqtt talks to the coordinator with: the one of the dongle model, or the network coordinator type
export const getDriver = (configuration, adapter) =>
  isNetworkCoordinator(configuration) ? configuration.z2mNetworkAdapterType : get(adapter, 'configKey');

const Fact = ({ name, value }) => (
  <div class={style.fact} data-cy={`z2m-dashboard-fact-${name}`}>
    <span class={style.factName}>
      <Text id={`${T}.facts.${name}`} />
    </span>
    <span class={style.factValue}>{value || <Text id={`${T}.facts.unknown`} />}</span>
  </div>
);

// The coordinator of the installation (its photo, its commercial name), what it runs, and the way to change it
const KeyCard = ({ view, actions }) => {
  const { configuration, status, savedAdapter } = view;
  if (isExternal(configuration)) {
    return (
      <section class={style.card} data-cy="z2m-dashboard-key">
        <div class={style.keyHead}>
          <span class={style.keyIcon} aria-hidden="true">
            <i class="fe fe-share-2" />
          </span>
          <span class={style.keyName}>
            <strong>
              <Text id={`${T}.external.title`} />
            </strong>
            <span class="text-muted">{configuration.mqttUrl}</span>
          </span>
        </div>
        <div class={style.facts}>
          <Fact name="version" value={status.z2mVersion} />
          <Fact name="devices" value={Number.isInteger(status.deviceCount) ? `${status.deviceCount}` : null} />
        </div>
      </section>
    );
  }
  const network = isNetworkCoordinator(configuration);
  const driver = getDriver(configuration, savedAdapter);
  const revision = get(status, 'coordinatorFirmware.revision');
  return (
    <section class={style.card} data-cy="z2m-dashboard-key">
      <div class={style.keyHead}>
        {network ? (
          <span class={style.keyIcon} aria-hidden="true">
            <i class="fe fe-wifi" />
          </span>
        ) : (
          <KeyPhoto adapter={savedAdapter} size={56} />
        )}
        <span class={style.keyName}>
          <strong data-cy="z2m-dashboard-key-name">
            {network && <Text id={`${T}.network.title`} />}
            {!network && ((savedAdapter && savedAdapter.displayName) || configuration.z2mDongleName)}
          </strong>
          <span class="text-muted">
            {network ? configuration.z2mNetworkAdapterUrl : savedAdapter && savedAdapter.modelCode}
          </span>
        </span>
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          onClick={actions.changeKey}
          disabled={view.installing}
          data-cy="z2m-dashboard-change-key"
        >
          <Text id={`${T}.actions.changeKey`} />
        </button>
      </div>
      <div class={style.facts}>
        <Fact
          name="driver"
          value={driver === 'ezsp' ? <Text id="integration.zigbee2mqtt.setup.wizard.ready.ezspDriver" /> : driver}
        />
        <Fact name="firmware" value={revision !== undefined && revision !== null ? `${revision}` : null} />
        <Fact name="version" value={status.z2mVersion} />
      </div>
    </section>
  );
};

export default KeyCard;
