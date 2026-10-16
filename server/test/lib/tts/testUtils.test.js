const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const Tts = require('../../../lib/tts');
const StateManager = require('../../../lib/state');

/**
 * @description Build a tts manager wired with fakes for tests.
 * @param {object} [options] - Options.
 * @param {object} [options.gateway] - Gateway fakes overrides.
 * @returns {object} The tts manager and its fakes ({ tts, stateManager, variable, gateway, variableStore }).
 * @example
 * const { tts } = buildTts();
 */
function buildTts({ gateway: gatewayOverrides } = {}) {
  const event = { emit: fake.returns(null), on: fake.returns(null) };
  const stateManager = new StateManager(event);
  const variableStore = new Map();
  const variable = {
    getValue: fake(async (key) => (variableStore.has(key) ? variableStore.get(key) : null)),
    setValue: fake(async (key, value) => variableStore.set(key, value)),
  };
  const serviceManager = {
    getService: (name) => stateManager.get('service', name),
  };
  const gateway = {
    getTTSApiUrl: fake.resolves({ url: 'https://plus.test/audio.mp3' }),
    ...gatewayOverrides,
  };
  const tts = new Tts(variable, serviceManager, stateManager, gateway);
  return { tts, stateManager, variable, gateway, variableStore };
}

/**
 * @description Register a fake TTS provider service in the stateManager.
 * @param {object} stateManager - The state manager.
 * @param {string} name - The service name.
 * @param {object} [synthesize] - The synthesize fake.
 * @returns {object} The synthesize fake.
 * @example
 * const synthesize = registerFakeTtsProvider(stateManager, 'ext-piper-tts');
 */
function registerFakeTtsProvider(stateManager, name, synthesize) {
  const synthesizeFake =
    synthesize || fake.resolves({ buffer: Buffer.from('fake-mp3-bytes'), contentType: 'audio/mpeg', extension: 'mp3' });
  stateManager.setState('service', name, { tts: { synthesize: synthesizeFake } });
  return synthesizeFake;
}

module.exports = {
  buildTts,
  registerFakeTtsProvider,
};
