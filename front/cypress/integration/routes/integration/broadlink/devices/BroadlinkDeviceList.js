import { PARAMS } from '../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';

describe('Broadlink device list', () => {
  before(() => {
    cy.login();

    // Create a actuator device
    const actuator = {
      external_id: 'broadlink:7396e6541fb0',
      selector: 'broadlink:7396e6541fb0',
      name: 'SP2',
      model: 'SP2',
      should_poll: false,
      poll_frequency: null,
      features: [
        {
          name: 'SP2',
          category: 'switch',
          type: 'binary',
          external_id: 'broadlink:7396e6541fb0:0',
          selector: 'broadlink:7396e6541fb0:0',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        }
      ]
    };
    cy.createDevice(actuator, 'broadlink');

    // Create a remote device
    const remote = {
      name: 'TV Remote',
      model: 'television',
      selector: 'broadlink-8008bda3ae44',
      external_id: 'broadlink:8008bda3ae44',
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Power',
          external_id: 'broadlink:8008bda3ae44:binary',
          selector: 'broadlink-8008bda3ae44-binary',
          category: 'television',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        },
        {
          name: 'Source',
          external_id: 'broadlink:8008bda3ae44:source',
          selector: 'broadlink-8008bda3ae44-source',
          category: 'television',
          type: 'source',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        },
        {
          name: 'Channel',
          external_id: 'broadlink:8008bda3ae44:channel',
          selector: 'broadlink-8008bda3ae44-channel',
          category: 'television',
          type: 'channel',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        }
      ],
      params: [
        {
          name: PARAMS.PERIPHERAL,
          value: '8008bda3ae44'
        },
        {
          name: 'ir_code_binary-1',
          value: 'POWER'
        },
        {
          name: 'ir_code_source',
          value: 'SOURCE'
        },
        {
          name: 'ir_code_channel-0',
          value: 'CHANNEL_0'
        },
        {
          name: 'ir_code_channel-1',
          value: 'CHANNEL_1'
        },
        {
          name: 'ir_code_channel-2',
          value: 'CHANNEL_2'
        },
        {
          name: 'ir_code_channel-3',
          value: 'CHANNEL_3'
        },
        {
          name: 'ir_code_channel-4',
          value: 'CHANNEL_4'
        },
        {
          name: 'ir_code_channel-5',
          value: 'CHANNEL_5'
        },
        {
          name: 'ir_code_channel-6',
          value: 'CHANNEL_6'
        }
      ]
    };
    cy.createDevice(remote, 'broadlink');

    cy.visit('/dashboard/integration/device/broadlink');
  });

  after(() => {
    // Delete all Broadlink devices
    cy.deleteDevices('broadlink');
  });

  it('Check list', () => {
    cy.get('[data-cy=device-card]').should('be.length', 2);
  });

  it('Check switch device', () => {
    cy.contains('.card-header', 'SP2')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check device name
        cy.get('[data-cy=device-name]')
          .should('have.value', 'SP2')
          .should('not.be.disabled');
        // Check device model
        cy.get('[data-cy=device-model]')
          .should('have.value', 'SP2')
          .should('be.disabled');
        // Check device room
        cy.get('select')
          .should('have.value', '')
          .should('not.be.disabled');
        // Check device features
        cy.get('.tag').should('be.length', 1);
        // Check device actions
        cy.get('button')
          .should('have.length', 3)
          .should('not.be.disabled');
      });
  });

  it('Update switch device', () => {
    const { rooms } = Cypress.env('house');
    const serverUrl = Cypress.env('serverUrl');

    cy.intercept({
      method: 'POST',
      url: `${serverUrl}/api/v1/device`
    }).as('saveDevice');

    cy.contains('.card-header', 'SP2')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check device name
        cy.get('[data-cy=device-name]').type(' new name');
        // Check device room
        cy.get('select').select(rooms[0].name);

        cy.contains('button', 'integration.broadlink.device.saveButton').click();
      });

    cy.wait('@saveDevice');

    // Check device well created
    cy.get('@saveDevice')
      .its('response.body')
      .should(body => {
        expect(body.name).to.eq('SP2 new name');
        expect(body.room.name).to.eq(rooms[0].name);
      });
  });

  it('Delete switch device', () => {
    const serverUrl = Cypress.env('serverUrl');

    cy.intercept({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/device/broadlink-7396e6541fb0`
    }).as('deleteDevice');

    cy.contains('.card-header', 'SP2 new name')
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.contains('button', 'integration.broadlink.device.deleteButton').click();
      });

    cy.wait('@deleteDevice');

    // Check device well created
    cy.get('@deleteDevice')
      .its('response.body')
      .should('deep.eq', { success: true });
  });

  it('Check remote device', () => {
    const i18n = Cypress.env('i18n');

    cy.contains('.card-header', 'TV Remote')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check device name
        cy.get('[data-cy=device-name]')
          .should('have.value', 'TV Remote')
          .should('not.be.disabled');
        // Check device model
        cy.get('[data-cy=device-model]')
          .should('have.value', i18n.deviceFeatureCategory.television.shortCategoryName)
          .should('be.disabled');
        // Check device room
        cy.get('select')
          .should('have.value', '')
          .should('not.be.disabled');
        // Check device features
        cy.get('.tag').should('be.length', 3);
        // Check device actions
        cy.get('button')
          .should('have.length', 3)
          .should('not.be.disabled');
      });
  });

  it('Edit remote device', () => {
    cy.contains('.card-header', 'TV Remote')
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.contains('button', 'integration.broadlink.device.editButton').click();
      });

    cy.location('pathname').should('eq', '/dashboard/integration/device/broadlink/edit/broadlink-8008bda3ae44');

    cy.contains('button', 'global.backButton').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/broadlink');
  });
});
