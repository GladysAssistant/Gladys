const { getProviders } = require('./tts.getProviders');
const { getProviderConfiguration } = require('./tts.getProviderConfiguration');
const { setActiveProvider } = require('./tts.setActiveProvider');
const { getSpeechUrl } = require('./tts.getSpeechUrl');
const { getAudio } = require('./tts.getAudio');
const { purgeExpiredAudios } = require('./tts.purgeExpiredAudios');
const { getLocalApiBaseUrl } = require('./tts.getLocalApiBaseUrl');

/**
 * @description Text-to-speech manager: decouples the TTS consumers (the
 * PLAY_NOTIFICATION scene action, the voice assistant reply) from the
 * providers. A provider is any stateManager service exposing
 * tts.synthesize({ text, language }) — the core knows no engine by name;
 * Gladys Plus stays the built-in provider under the reserved id
 * 'gladys-plus' (see docs/specs/external-integrations.md, B.21).
 * @param {object} variable - Variable manager.
 * @param {object} service - Service manager.
 * @param {object} stateManager - State manager.
 * @param {object} gateway - Gladys Gateway manager.
 * @example
 * const tts = new Tts(variable, service, stateManager, gateway);
 */
const Tts = function Tts(variable, service, stateManager, gateway) {
  this.variable = variable;
  this.service = service;
  this.stateManager = stateManager;
  this.gateway = gateway;
  // synthesized clips, in RAM only: token -> { buffer, contentType, expiresAt }
  this.audios = new Map();
};

Tts.prototype.getProviders = getProviders;
Tts.prototype.getProviderConfiguration = getProviderConfiguration;
Tts.prototype.setActiveProvider = setActiveProvider;
Tts.prototype.getSpeechUrl = getSpeechUrl;
Tts.prototype.getAudio = getAudio;
Tts.prototype.purgeExpiredAudios = purgeExpiredAudios;
Tts.prototype.getLocalApiBaseUrl = getLocalApiBaseUrl;

module.exports = Tts;
