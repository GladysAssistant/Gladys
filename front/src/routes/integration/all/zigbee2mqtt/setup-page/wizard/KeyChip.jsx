import { Text } from 'preact-i18n';

import { ADAPTER_MODE } from '../constants';
import KeyPhoto from './KeyPhoto';
import style from './wizard.css';

// The coordinator being installed: the dongle with its photo and its commercial name, or the network coordinator
const KeyChip = ({ adapter, configuration }) => {
  const network = configuration.z2mAdapterMode === ADAPTER_MODE.NETWORK;
  return (
    <div class={style.keyChip} data-cy="z2m-wizard-key-chip">
      <KeyPhoto adapter={network ? null : adapter} size={48} round />
      <span class={style.keyChipText}>
        <span class="font-weight-bold">
          {network ? (
            <Text id="integration.zigbee2mqtt.setup.wizard.ready.networkCoordinator" />
          ) : (
            (adapter && adapter.displayName) || configuration.z2mDongleName
          )}
        </span>
        <span class="text-muted small">
          {network ? configuration.z2mNetworkAdapterUrl : adapter && adapter.modelCode}
        </span>
      </span>
    </div>
  );
};

export default KeyChip;
