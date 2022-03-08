/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // Load NODE env variables
  const language = process.env.LANGUAGE || 'en';
  config.env.language = language;

  const serverUrl = process.env.LOCAL_API_URL || 'http://localhost:1443';
  config.env.serverUrl = serverUrl;

  const websocketUrl = process.env.WEBSOCKET_URL || 'ws://localhost:1443';
  config.env.websocketUrl = websocketUrl;

  const i18n = require(`../../src/config/i18n/${language}.json`);
  config.env.i18n = i18n;

  return config;
};
