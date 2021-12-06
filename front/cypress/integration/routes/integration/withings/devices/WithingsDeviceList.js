describe('Withings device list', () => {
  const deviceBody = {
    name: 'Withings - Body',
    external_id: 'c43dbbbd-1091-44e7-b122-68911483d28b',
    selector: 'withings-body-c43dbbbd-1091-44e7-b122-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Battery',
        category: 'battery',
        type: 'integer',
        external_id: 'c43dbbbd-1091-44e7-b122-68911483d28b',
        selector: 'withings-battery-c43dbbbd-1091-44e7-b122-68911483d28b',
        read_only: true,
        keep_history: false,
        has_feedback: false,
        unit: 'percent',
        min: 0,
        max: 0
      },
      {
        name: 'Weight',
        category: 'health',
        type: 'weight',
        external_id: 'withings-Weight:c43dbbbd-1091-44e7-b122-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-weight-c43dbbbd-1091-44e7-b122-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      }
    ]
  };

  const deviceBodyPlus = {
    name: 'Withings - Body+',
    external_id: 'c43dbbbd-1091-44e7-b144-68911483d28b',
    selector: 'withings-body+-c43dbbbd-1091-44e7-b144-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Battery',
        category: 'battery',
        type: 'integer',
        external_id: 'c43dbbbd-1091-44e7-b144-68911483d28b',
        selector: 'withings-battery-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: false,
        has_feedback: false,
        unit: 'percent',
        min: 0,
        max: 100
      },
      {
        name: 'Weight',
        category: 'health',
        type: 'weight',
        external_id: 'withings-Weight:c43dbbbd-1091-44e7-b144-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-weight-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Fat Free Mass',
        category: 'health',
        type: 'fat-free-mass',
        external_id: 'withings-Fat Free Mass:c43dbbbd-1091-44e7-b144-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Fat Free Mass-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Fat Ratio',
        category: 'health',
        type: 'fat-ratio',
        external_id: 'withings-Fat Ratio:c43dbbbd-1091-44e7-b144-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Fat Ratio-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: '%',
        min: 0,
        max: 100000
      },
      {
        name: 'Fat Mass Weight',
        category: 'health',
        type: 'fat-mass-weight',
        external_id:
          'withings-Fat Mass Weight:c43dbbbd-1091-44e7-b144-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Fat Mass Weight-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Muscle Mass',
        category: 'health',
        type: 'muscle-mass',
        external_id: 'withings-Muscle Mass:c43dbbbd-1091-44e7-b144-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Muscle Mass-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Bone Mass',
        category: 'health',
        type: 'bone-mass',
        external_id: 'withings-Bone Mass:c43dbbbd-1091-44e7-b144-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Bone Mass-c43dbbbd-1091-44e7-b144-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      }
    ]
  };

  const deviceBodyCardio = {
    name: 'Withings - Body Cardio',
    external_id: 'c43dbbbd-1091-44e7-b166-68911483d28b',
    selector: 'withings-body+-c43dbbbd-1091-44e7-b166-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Battery',
        category: 'battery',
        type: 'integer',
        external_id: 'c43dbbbd-1091-44e7-b166-68911483d28b',
        selector: 'withings-battery-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: false,
        has_feedback: false,
        unit: 'percent',
        min: 0,
        max: 100
      },
      {
        name: 'Weight',
        category: 'health',
        type: 'weight',
        external_id: 'withings-Weight:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-weight-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Fat Free Mass',
        category: 'health',
        type: 'fat-free-mass',
        external_id: 'withings-Fat Free Mass:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Fat Free Mass-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Fat Ratio',
        category: 'health',
        type: 'fat-ratio',
        external_id: 'withings-Fat Ratio:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Fat Ratio-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: '%',
        min: 0,
        max: 100000
      },
      {
        name: 'Fat Mass Weight',
        category: 'health',
        type: 'fat-mass-weight',
        external_id:
          'withings-Fat Mass Weight:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Fat Mass Weight-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Muscle Mass',
        category: 'health',
        type: 'muscle-mass',
        external_id: 'withings-Muscle Mass:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Muscle Mass-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Bone Mass',
        category: 'health',
        type: 'bone-mass',
        external_id: 'withings-Bone Mass:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Bone Mass-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'kg',
        min: 0,
        max: 100000
      },
      {
        name: 'Heart Pulse',
        category: 'health',
        type: 'heart-pulse',
        external_id: 'withings-Heart Pulse:c43dbbbd-1091-44e7-b166-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Heart Pulse-c43dbbbd-1091-44e7-b166-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'bpm',
        min: 0,
        max: 100000
      }
    ]
  };

  const deviceSleep1 = {
    name: 'Withings - Withings WBS01',
    external_id: 'c43dbbbd-1091-44e7-b177-68911483d28b',
    selector: 'withings-body-c43dbbbd-1091-44e7-b177-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Heart Pulse',
        category: 'health',
        type: 'heart-pulse',
        external_id: 'withings-Heart Pulse:c43dbbbd-1091-44e7-b177-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Heart Pulse-c43dbbbd-1091-44e7-b177-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'bpm',
        min: 0,
        max: 100000
      }
    ]
  };

  const deviceBPM1 = {
    name: 'Withings - BPM Core',
    external_id: 'c43dbbbd-1091-44e7-b199-68911483d28b',
    selector: 'withings-bpm-c43dbbbd-1091-44e7-b199-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Heart Pulse',
        category: 'health',
        type: 'heart-pulse',
        external_id: 'withings-Heart Pulse:c43dbbbd-1091-44e7-b199-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Heart Pulse-c43dbbbd-1091-44e7-b199-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'bpm',
        min: 0,
        max: 100000
      },
      {
        name: 'Pulse Wave Velocity',
        category: 'health',
        type: 'pulse-wave-velocity',
        external_id:
          'withings-Pulse Wave Velocity:c43dbbbd-1091-44e7-b199-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Pulse Wave Velocity-c43dbbbd-1091-44e7-b199-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'm/s',
        min: 0,
        max: 100000
      }
    ]
  };

  const deviceBPM2 = {
    name: 'Withings - BPM Connect',
    external_id: 'c43dbbbd-1091-44e7-b120-68911483d28b',
    selector: 'withings-bpm-c43dbbbd-1091-44e7-b120-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Heart Pulse',
        category: 'health',
        type: 'heart-pulse',
        external_id: 'withings-Heart Pulse:c43dbbbd-1091-44e7-b120-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Heart Pulse-c43dbbbd-1091-44e7-b120-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'bpm',
        min: 0,
        max: 100000
      },
      {
        name: 'Pulse Wave Velocity',
        category: 'health',
        type: 'pulse-wave-velocity',
        external_id:
          'withings-Pulse Wave Velocity:c43dbbbd-1091-44e7-b120-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Pulse Wave Velocity-c43dbbbd-1091-44e7-b120-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'm/s',
        min: 0,
        max: 100000
      },
      {
        name: 'Systolic Blood Pressure',
        category: 'health',
        type: 'systolic-blood-pressure',
        external_id:
          'withings-Systolic Blood Pressure:c43dbbbd-1091-44e7-b120-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Systolic Blood Pressure-c43dbbbd-1091-44e7-b120-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'mmHg',
        min: 0,
        max: 100000
      },
      {
        name: 'Diastolic Blood Pressure',
        category: 'health',
        type: 'diastolic-blood-pressure',
        external_id:
          'withings-Diastolic Blood Pressure:c43dbbbd-1091-44e7-b120-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Diastolic Blood Pressure-c43dbbbd-1091-44e7-b120-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'm/s',
        min: 0,
        max: 100000
      }
    ]
  };

  const deviceThermo = {
    name: 'Withings - Thermo',
    external_id: 'c43dbbbd-1091-44e7-b121-68911483d28b',
    selector: 'withings-thermo-c43dbbbd-1091-44e7-b121-68911483d28b',
    should_poll: 1,
    poll_frequency: 86400000,
    features: [
      {
        name: 'Temperature',
        category: 'health',
        type: 'temperature',
        external_id: 'withings-Temperature:c43dbbbd-1091-44e7-b121-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Temperature-c43dbbbd-1091-44e7-b121-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'celsius',
        min: 0,
        max: 100000
      },
      {
        name: 'Body Temperature',
        category: 'health',
        type: 'body-temperature',
        external_id:
          'withings-Body Temperature:c43dbbbd-1091-44e7-b121-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Body Temperature-c43dbbbd-1091-44e7-b121-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'celsius',
        min: 0,
        max: 100000
      },
      {
        name: 'Skin Temperature',
        category: 'health',
        type: 'skin-temperature',
        external_id:
          'withings-Skin Temperature:c43dbbbd-1091-44e7-b121-68911483d28b:0d9226e1-e794-4d46-9d0e-ed91725a8c9e',
        selector: 'withings-Skin Temperature-c43dbbbd-1091-44e7-b121-68911483d28b',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        unit: 'celsius',
        min: 0,
        max: 100000
      }
    ]
  };

  before(() => {
    cy.login();

    // Create a new peripheral
    cy.createDevice(deviceBody, 'withings');
    cy.createDevice(deviceBodyPlus, 'withings');
    cy.createDevice(deviceBodyCardio, 'withings');

    cy.createDevice(deviceSleep1, 'withings');

    cy.createDevice(deviceBPM1, 'withings');
    cy.createDevice(deviceBPM2, 'withings');

    cy.createDevice(deviceThermo, 'withings');

    cy.visit('/dashboard/integration/health/withings/device');
  });

  after(() => {
    // Delete all withings devices
    cy.deleteDevices('withings');
  });

  it('Check Withings - Body device', () => {
    cy.contains('.card-header', deviceBody.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/body-black-kg.jpg');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-battery').should('exist');
        cy.get('.fe-grid').should('exist');
      });
  });

  it('Check Withings - Body+ device', () => {
    cy.contains('.card-header', deviceBodyPlus.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/body-plus-black-kg.jpg');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-battery').should('exist');
        cy.get('.fe-grid').should('exist');
        cy.get('.fe-percent').should('exist');
      });
  });

  it('Check Withings - Body Cardio device', () => {
    cy.contains('.card-header', deviceBodyCardio.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/body-cardio-black-kg.jpg');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-battery').should('exist');
        cy.get('.fe-grid').should('exist');
        cy.get('.fe-percent').should('exist');
        cy.get('.fe-activity').should('exist');
      });
  });

  it('Check Withings - Sleep device', () => {
    cy.contains('.card-header', deviceSleep1.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/sleep-analyzer-single.png');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-activity').should('exist');
      });
  });

  it('Check Withings - Thermo device', () => {
    cy.contains('.card-header', deviceThermo.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/thermo-c.jpg');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-thermometer').should('exist');
      });
  });

  it('Check Withings - BPM Core device', () => {
    cy.contains('.card-header', deviceBPM1.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/bpm-core.jpg');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-activity').should('exist');
      });
  });

  it('Check Withings - BPM Connect device', () => {
    cy.contains('.card-header', deviceBPM2.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('img').should('have.attr', 'src', '/assets/images/withings/bpm-connect.jpg');
        cy.get('select').should('have.value', '');
        cy.get('span').should('exist');
        cy.get('.fe-activity').should('exist');
        cy.get('.fe-droplet').should('exist');
      });
  });

  it('Update device', () => {
    const { rooms } = Cypress.env('house');
    cy.contains('.card-header', deviceBody.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('select').select(rooms[0].name);

        cy.contains('button', 'integration.withings.device.saveButton').click();
      });
    // Check redirected to edit page
    cy.location('pathname').should('eq', '/dashboard/integration/health/withings/device');
  });

  it('Check updated device', () => {
    const { rooms } = Cypress.env('house');
    cy.contains('.card-header', deviceBody.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('select option:selected').should('have.text', rooms[0].name);
      });
  });
});
