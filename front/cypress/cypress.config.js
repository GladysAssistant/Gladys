const { defineConfig } = require('cypress');

const VARIABLES = {};

module.exports = defineConfig({
  // setupNodeEvents can be defined in either
  // the e2e or component configuration
  e2e: {
    setupNodeEvents(on, config) {
      // `on` is used to hook into various events Cypress emits
      // `config` is the resolved Cypress config
      on('task', {
        storeVariable: ({ key, value }) => {
          VARIABLES[key] = value;
          return null;
        },
        loadVariable: key => {
          const value = VARIABLES[key];
          return value === undefined ? null : value;
        }
      });

      // Load NODE env variables
      const language = process.env.LANGUAGE || 'en';
      config.env.language = language;

      const serverUrl = process.env.LOCAL_API_URL || 'http://localhost:1443';
      config.env.serverUrl = serverUrl;

      const websocketUrl = process.env.WEBSOCKET_URL || 'ws://localhost:1443';
      config.env.websocketUrl = websocketUrl;

      const i18n = require(`../src/config/i18n/${language}.json`);
      config.env.i18n = i18n;

      return config;
    },
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 120000,
    baseUrl: 'http://localhost:1444',
    env: {
      house: {
        name: 'My House',
        selector: 'my-house',
        rooms: [
          {
            name: 'Living Room',
            selector: 'living-room'
          }
        ]
      },
      users: {
        tony: {
          firstname: 'Tony',
          lastname: 'Stark',
          selector: 'tony',
          role: 'admin',
          email: 'tony.stark@gladysassistant.com',
          password: 'ONvAayxwrK',
          birthYear: '2011',
          birthMonth: '2',
          birthDay: '4'
        }
      }
    }
  }
});
