// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// A `cy.stub(win, 'open')` is restored the moment the test that installed it
// ends. Application code that reaches `window.open` one tick later — an OAuth
// "Connect" whose promise settles just after the last command — then calls the
// real one, Electron actually loads the provider, and the whole run fails with
// `ERR_FAILED (-2) loading 'https://…'` while every test is reported green.
// No test has any business leaving the app, so cross-origin openings are
// dropped: a spec that cares about them stubs `window.open` and asserts on it.
Cypress.on('window:before:load', win => {
  const nativeOpen = win.open;
  win.open = function open(url, ...args) {
    let sameOrigin = true;
    try {
      sameOrigin = new URL(url, win.location.href).origin === win.location.origin;
    } catch (e) {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      // eslint-disable-next-line no-console
      console.warn(`[cypress] blocked window.open to an external URL: ${url}`);
      return null;
    }
    return nativeOpen.call(this, url, ...args);
  };
});
