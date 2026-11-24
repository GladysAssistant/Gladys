// The steps of the wizard: ① the dongle, ② the installation, then ③ the network ready (the installation done)
// and ④ the first device
export const STEP = {
  KEY: 'key',
  INSTALL: 'install',
  PAIR: 'pair'
};

// What the first step shows: the dongle Gladys detected, a dongle chosen by hand, a network coordinator, or the
// broker of a Zigbee2mqtt that runs elsewhere
export const PANE = {
  AUTO: 'auto',
  MANUAL: 'manual',
  NETWORK: 'network',
  EXTERNAL: 'external'
};

// The USB devices plugged in: one recognized dongle, several, none recognized, none at all
export const KEY_SCENARIO = {
  ONE: 'one',
  SEVERAL: 'several',
  UNKNOWN: 'unknown',
  NONE: 'none'
};

// The installation started by the wizard: not shown in the status yet, running, failed, connected to an external
// broker where Zigbee2mqtt does not answer yet, or done
export const INSTALL_VIEW = {
  STARTING: 'starting',
  RUNNING: 'running',
  FAILED: 'failed',
  WAITING: 'waiting',
  READY: 'ready'
};

// The type of a network coordinator, by its chip; ezsp only for an existing configuration (deprecated driver)
export const NETWORK_ADAPTER_TYPES = ['ember', 'zstack', 'deconz'];
