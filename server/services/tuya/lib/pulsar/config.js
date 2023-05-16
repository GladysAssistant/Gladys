const TuyaRegionConfigEnum = {
  CN: 'wss://mqe.tuyacn.com:8285/',
  US: 'wss://mqe.tuyaus.com:8285/',
  EU: 'wss://mqe.tuyaeu.com:8285/',
  IN: 'wss://mqe.tuyain.com:8285/',
};

const TUYA_PASULAR_ENV = {
  PROD: 'prod',
  TEST: 'test',
};

export const TuyaEnvConfig = Object.freeze({
  [TUYA_PASULAR_ENV.PROD]: {
    name: TUYA_PASULAR_ENV.PROD,
    value: 'event',
    desc: 'online environment',
  },
  [TUYA_PASULAR_ENV.TEST]: {
    name: TUYA_PASULAR_ENV.TEST,
    value: 'event-test',
    desc: 'test environment',
  },
});

/**
 * Get tuya region config.
 * @param env
 * @returns {*}
 * @example
 */
export function getTuyaEnvConfig(env) {
  return TuyaEnvConfig[env];
}
