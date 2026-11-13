import { Text } from 'preact-i18n';
import get from 'get-value';

import { MQTT_MODE } from '../constants';

const toMegabytes = bytes => Math.round(bytes / 1000000);

// Images downloaded in the background while nothing is configured, so that the installation does not wait for them
const PrefetchStatus = ({ configuration, zigbee2mqttStatus = {} }) => {
  const { prefetch, installation } = zigbee2mqttStatus;
  const configured =
    configuration.z2mDriverPath || configuration.z2mNetworkAdapterUrl || configuration.mqttMode === MQTT_MODE.EXTERNAL;
  // The progress of the installation takes over
  const installing = installation && (installation.state === 'running' || installation.state === 'failed');
  if (!prefetch || configured || installing) {
    return null;
  }

  if (prefetch.state === 'running' || prefetch.state === 'done') {
    return (
      <p class="small text-muted" data-cy="z2m-prefetch-status">
        {prefetch.state === 'running' ? (
          <Text id="integration.zigbee2mqtt.setup.prefetch.running" fields={{ progress: prefetch.progress }} />
        ) : (
          <Text id="integration.zigbee2mqtt.setup.prefetch.done" />
        )}
      </p>
    );
  }

  if (prefetch.state === 'failed' && get(prefetch, 'error.code') === 'NOT_ENOUGH_DISK_SPACE') {
    const { freeBytes, neededBytes } = prefetch;
    return (
      <div class="alert alert-warning" data-cy="z2m-prefetch-disk-space">
        {Number.isFinite(freeBytes) && Number.isFinite(neededBytes) ? (
          <Text
            id="integration.zigbee2mqtt.setup.prefetch.notEnoughDiskSpace"
            fields={{ free: toMegabytes(freeBytes), needed: toMegabytes(neededBytes) }}
          />
        ) : (
          <Text id="integration.zigbee2mqtt.setup.prefetch.notEnoughDiskSpaceNoFigures" />
        )}
      </div>
    );
  }

  return null;
};

export default PrefetchStatus;
