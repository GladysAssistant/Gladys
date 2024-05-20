describe('Dashboard Humidity Box', () => {
  beforeEach(() => {
    cy.login();

    // Create dashboard
    const serverUrl = Cypress.env('serverUrl');
    const { rooms } = Cypress.env('house');
    const roomSelector = rooms[0].selector;
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [
          [],
          [
            {
              type: 'humidity-in-room',
              room: roomSelector
            }
          ],
          []
        ]
      }
    });

    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${roomSelector}`
    }).then(res => {
      // Create humidity device in room
      const device1 = {
        name: 'First device',
        external_id: 'first-device',
        selector: 'first-device',
        room_id: res.body.id,
        features: [
          {
            name: 'Temp sensor',
            category: 'humidity-sensor',
            type: 'decimal',
            external_id: 'first-humidity',
            selector: 'first-humidity',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -50,
            max: 100
          }
        ]
      };
      cy.createDevice(device1, 'example');
    });

    // Create another humidity device without room
    const otherRoomDevice = {
      name: 'Second device',
      external_id: 'second-device',
      selector: 'second-device',
      features: [
        {
          name: 'Temp sensor',
          category: 'humidity-sensor',
          type: 'decimal',
          external_id: 'second-humidity',
          selector: 'second-humidity',
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -50,
          max: 100
        }
      ]
    };
    cy.createDevice(otherRoomDevice, 'example');

    cy.intercept({
      method: 'GET',
      url: `${serverUrl}/api/v1/dashboard/test`
    }).as('loadDashboard');

    cy.intercept({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${roomSelector}?expand=humidity,devices`
    }).as('loadBox');

    cy.visit('/dashboard/test');

    cy.wait('@loadDashboard');
    cy.wait('@loadBox');
  });
  afterEach(() => {
    // Delete all devices
    cy.deleteDevices('example');
    // Delete dashboard
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });
  it('Should have no value box', () => {
    cy.contains('p', 'dashboard.boxes.humidityInRoom.noHumidityRecorded').should('exist');

    const { rooms } = Cypress.env('house');
    const roomName = rooms[0].name;
    cy.contains('small', roomName).should('exist');
  });

  it('Should update humidity on update device value', () => {
    const serverUrl = Cypress.env('serverUrl');
    const { rooms } = Cypress.env('house');
    const roomSelector = rooms[0].selector;

    cy.intercept({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${roomSelector}?expand=humidity,devices`
    }).as('reloadBox');

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/device/first-device/humidity-sensor/decimal/value`,
      body: { value: 24 }
    });

    cy.sendWebSocket({ type: 'device.new-state', payload: { device_feature_selector: 'first-humidity' } });

    cy.wait('@reloadBox');

    cy.contains('h4', '24%').should('exist');
  });

  it('Should not update humidity on update device value', () => {
    const serverUrl = Cypress.env('serverUrl');

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/device/first-device/humidity-sensor/decimal/value`,
      body: { value: 24 }
    });

    cy.sendWebSocket({ type: 'device.new-state', payload: { device_feature_selector: 'second-humidity' } });

    cy.contains('p', 'dashboard.boxes.humidityInRoom.noHumidityRecorded').should('exist');
  });
});
