import { ADAPTER_MODE } from '../constants';

const PHASE_KEYS = ['pull_z2m', 'pull_mqtt', 'start_mqtt', 'start_z2m', 'connect_adapter'];

// The connection phase, named after what Zigbee2mqtt (or Gladys, with an external broker) connects to
const getConnectLabel = (configuration, external) => {
  if (external) {
    return 'integration.zigbee2mqtt.setup.wizard.progress.phases.connectExternal';
  }
  return configuration.z2mAdapterMode === ADAPTER_MODE.NETWORK
    ? 'integration.zigbee2mqtt.setup.wizard.progress.phases.connectNetwork'
    : 'integration.zigbee2mqtt.setup.wizard.progress.phases.connectUsb';
};

// What a phase tells besides its name
const getDetail = (phase, ezspFallback) => {
  if (!phase.state) {
    return null;
  }
  if (phase.key === 'connect_adapter' && ezspFallback) {
    return phase.state === 'done'
      ? 'integration.zigbee2mqtt.setup.wizard.progress.ezspDriver'
      : 'integration.zigbee2mqtt.setup.wizard.progress.ezspSwitching';
  }
  if (phase.key.startsWith('pull_') && phase.state === 'skipped') {
    return 'integration.zigbee2mqtt.setup.wizard.progress.alreadyDownloaded';
  }
  return null;
};

/**
 * @description The phases of the installation as the wizard lists them. An external broker only has the
 * connection; before the installation shows up in the status, every phase is to come.
 * @param {object} installation - The installation of the status, or null while it starts.
 * @param {object} options - The configuration saved, whether it is an external broker, and the ezsp fallback.
 * @returns {Array} `[{ key, label, state, progress, detail }]`.
 */
export const getPhases = (installation, { configuration, external, ezspFallback }) => {
  const phases =
    installation && installation.phases.length > 0 ? installation.phases : PHASE_KEYS.map(key => ({ key }));
  return phases
    .filter(phase => !external || phase.key === 'connect_adapter')
    .map(phase => ({
      key: phase.key,
      state: phase.state || 'pending',
      progress: phase.progress || 0,
      label:
        phase.key === 'connect_adapter'
          ? getConnectLabel(configuration, external)
          : `integration.zigbee2mqtt.setup.installation.phases.${phase.key}`,
      detail: getDetail(phase, ezspFallback)
    }));
};

// The phase shown alone (mobile, summary): the failed one, the running one, or the next one between two
export const getCurrentPhase = phases =>
  phases.find(({ state }) => state === 'failed') ||
  phases.find(({ state }) => state === 'running') ||
  phases.find(({ state }) => state === 'pending') ||
  phases[phases.length - 1];
