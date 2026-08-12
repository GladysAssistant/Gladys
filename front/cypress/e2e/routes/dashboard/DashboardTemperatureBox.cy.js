describe('Dashboard Temperature Box', () => {
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
              type: 'temperature-in-room',
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
      // Create temperature device in room
      const device1 = {
        name: 'First device',
        external_id: 'first-device',
        selector: 'first-device',
        room_id: res.body.id,
        features: [
          {
            name: 'Temp sensor',
            category: 'temperature-sensor',
            type: 'decimal',
            external_id: 'first-temperature',
            selector: 'first-temperature',
            unit: 'celsius',
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

    // Create another temperature device without room
    const otherRoomDevice = {
      name: 'Second device',
      external_id: 'second-device',
      selector: 'second-device',
      features: [
        {
          name: 'Temp sensor',
          category: 'temperature-sensor',
          type: 'decimal',
          external_id: 'second-temperature',
          selector: 'second-temperature',
          unit: 'celsius',
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
      url: `${serverUrl}/api/v1/room/${roomSelector}?expand=temperature,devices`
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
    cy.contains('p', 'dashboard.boxes.temperatureInRoom.noTemperatureRecorded').should('exist');

    const { rooms } = Cypress.env('house');
    const roomName = rooms[0].name;
    cy.contains('small', roomName).should('exist');
  });

  it('Should update temperature on update device value', () => {
    const serverUrl = Cypress.env('serverUrl');
    const { rooms } = Cypress.env('house');
    const roomSelector = rooms[0].selector;

    cy.intercept({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${roomSelector}?expand=temperature,devices`
    }).as('reloadBox');

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/device/first-device/temperature-sensor/decimal/value`,
      body: { value: 24.68 }
    });

    cy.sendWebSocket({ type: 'device.new-state', payload: { device_feature_selector: 'first-temperature' } });

    cy.wait('@reloadBox');

    cy.contains('h4', '24.7°C').should('exist');
  });

  it('Should not update temperature on update device value', () => {
    const serverUrl = Cypress.env('serverUrl');

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/device/first-device/temperature-sensor/decimal/value`,
      body: { value: 24 }
    });

    cy.sendWebSocket({ type: 'device.new-state', payload: { device_feature_selector: 'second-temperature' } });

    cy.contains('p', 'dashboard.boxes.temperatureInRoom.noTemperatureRecorded').should('exist');
  });
});
