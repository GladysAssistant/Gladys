const get = require('get-value');
const cypressWebSockets = [];

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
Cypress.on('window:before:load', window => {
  const lang = Cypress.env('language');
  Object.defineProperty(window.navigator, 'language', { value: lang });

  window.WebSocket = class MockWebSocket extends WebSocket {
    constructor(props) {
      super(props);

      cypressWebSockets.push(this);
    }

    onmessage(event) {
      return new Cypress.Promise(resolve => {
        this.onmessage(event);
        resolve(event);
      });
    }
  };
});

// i18n handler
Cypress.Commands.overwrite('contains', (originalFn, subject, filter, text, options = {}) => {
  // determine if a filter argument was passed
  if (typeof text === 'object') {
    options = text;
    text = filter;
    filter = undefined;
  } else if (text === undefined) {
    text = filter;
    filter = undefined;
  }

  const i18n = Cypress.env('i18n');
  const value = get(i18n, text, { default: text });

  return originalFn(subject, filter, value, options);
});

Cypress.Commands.add('i18n', { prevSubject: 'element' }, (element, labelKey) => {
  const i18n = Cypress.env('i18n');
  const value = get(i18n, labelKey);

  return cy.get(element).should('contain', value);
});

// login
Cypress.Commands.add('login', () => {
  const serverUrl = Cypress.env('serverUrl');
  cy.task('loadVariable', 'tony').then(tony => {
    if (tony && tony.access_token) {
      cy.log(`Uses stored Tony's token`);
      window.localStorage.setItem('user', JSON.stringify(tony));
    } else {
      // Check instance is configured
      cy.request({
        method: 'GET',
        url: `${serverUrl}/api/v1/setup`
      }).then(resp => {
        if (resp.body.account_configured) {
          return cy.onlyLogin();
        }

        return cy.setupAccount();
      });
    }
  });
});

// login
Cypress.Commands.add('onlyLogin', () => {
  const serverUrl = Cypress.env('serverUrl');
  const users = Cypress.env('users');
  const { tony } = users;

  cy.log('Login with Tony');

  cy.request({
    method: 'POST',
    url: `${serverUrl}/api/v1/login`,
    body: {
      email: tony.email,
      password: tony.password
    }
  }).then(resp => {
    const { body } = resp;
    const newUser = { ...tony, ...body };
    window.localStorage.setItem('user', JSON.stringify(newUser));
    return cy.task('storeVariable', { key: 'tony', value: newUser });
  });
});

Cypress.Commands.add('setupAccount', () => {
  const house = Cypress.env('house');
  const serverUrl = Cypress.env('serverUrl');
  const users = Cypress.env('users');
  const language = Cypress.env('language');
  const { tony } = users;

  cy.log('Setup Gladys');

  const userToCreate = {
    ...tony,
    language,
    birthdate: new Date(tony.birthYear, tony.birthMonth - 1, tony.birthDay)
  };

  cy.request({
    method: 'POST',
    url: `${serverUrl}/api/v1/signup`,
    body: userToCreate
  }).then(resp => {
    const { body } = resp;
    const newUser = { ...tony, ...body };

    window.localStorage.setItem('user', JSON.stringify(newUser));
    users.tony = newUser;

    // Create house
    const accessToken = body.access_token;
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/house`,
      body: house,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    }).then(resp => {
      cy.request({
        method: 'POST',
        url: `${serverUrl}/api/v1/house/${resp.body.selector}/room`,
        body: house.rooms[0],
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      }).then(res => {
        const house = Cypress.env('house');
        house.rooms[0] = res.body;
        Cypress.env('house', house);
      });
    });
  });
});

// Add bearer to request
Cypress.Commands.overwrite('request', (originalFn, options) => {
  cy.task('loadVariable', 'tony').then(tony => {
    if (tony && tony.access_token) {
      options.headers = { Authorization: `Bearer ${tony.access_token}` };
    }

    return originalFn(options);
  });
});

Cypress.Commands.add('sendWebSocket', payload => {
  cypressWebSockets
    .filter(ws => typeof ws.onmessage === 'function')
    .forEach(ws => ws.onmessage({ data: JSON.stringify(payload) }));
});

// Clean all devices according to a single service
Cypress.Commands.add('deleteDevices', service => {
  // Reset all Bluetooth devices
  const serverUrl = Cypress.env('serverUrl');
  cy.request({
    method: 'GET',
    url: `${serverUrl}/api/v1/device`,
    query: {
      service
    }
  }).then(res => {
    const devices = res.body;
    cy.wrap(devices).each(device =>
      cy.request({
        method: 'DELETE',
        url: `${serverUrl}/api/v1/device/${device.selector}`
      })
    );
  });
});

// Create device for a service
Cypress.Commands.add('createDevice', (device, service) => {
  const serverUrl = Cypress.env('serverUrl');

  // Get service
  cy.request({
    method: 'GET',
    url: `${serverUrl}/api/v1/service/${service}`
  }).then(res => {
    const { id: serviceId } = res.body;
    const deviceWithService = { ...device, service_id: serviceId };
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/device`,
      body: deviceWithService
    });
  });
});
