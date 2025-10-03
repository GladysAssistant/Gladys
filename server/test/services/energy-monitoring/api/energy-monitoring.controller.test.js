const { expect } = require('chai');
const { fake, assert } = require('sinon');
const EnergyMonitoringController = require('../../../../services/energy-monitoring/api/energy-monitoring.controller');

describe('EnergyMonitoringController', () => {
  let energyMonitoringHandler;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    // Mock the energy monitoring handler
    energyMonitoringHandler = {
      calculateCostFromBeginning: fake.resolves(null),
      getContracts: fake.resolves({
        'edf-base': {
          '3': [
            {
              contract: 'base',
              price_type: 'consumption',
              currency: 'euro',
              start_date: '2023-01-01',
              end_date: '2023-12-31',
              price: 1500,
              hour_slots: null,
              day_type: null,
            },
          ],
          '6': [
            {
              contract: 'base',
              price_type: 'consumption',
              currency: 'euro',
              start_date: '2023-01-01',
              end_date: '2023-12-31',
              price: 1450,
              hour_slots: null,
              day_type: null,
            },
          ],
        },
        'edf-tempo': {
          '6': [
            {
              contract: 'edf_tempo',
              price_type: 'consumption',
              currency: 'euro',
              start_date: '2023-01-01',
              end_date: '2023-12-31',
              price: 1200,
              hour_slots:
                '00:00,00:30,01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30,22:00,22:30,23:00,23:30',
              day_type: 'blue',
            },
            {
              contract: 'edf_tempo',
              price_type: 'consumption',
              currency: 'euro',
              start_date: '2023-01-01',
              end_date: '2023-12-31',
              price: 1600,
              hour_slots:
                '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
              day_type: 'blue',
            },
          ],
        },
      }),
    };

    // Create controller instance
    controller = EnergyMonitoringController(energyMonitoringHandler);

    // Mock request and response objects
    req = {};
    res = {
      json: fake.returns(null),
    };
  });

  describe('POST /api/v1/service/energy-monitoring/calculate-cost-from-beginning', () => {
    it('should calculate cost from beginning successfully', async () => {
      await controller['post /api/v1/service/energy-monitoring/calculate-cost-from-beginning'].controller(req, res);

      assert.calledOnce(energyMonitoringHandler.calculateCostFromBeginning);
      assert.calledOnceWithExactly(res.json, {
        success: true,
      });
    });

    it('should propagate handler errors', async () => {
      const error = new Error('Calculation failed');
      energyMonitoringHandler.calculateCostFromBeginning = fake.rejects(error);

      try {
        await controller['post /api/v1/service/energy-monitoring/calculate-cost-from-beginning'].controller(req, res);
        expect.fail('Should have thrown an error');
      } catch (thrownError) {
        expect(thrownError).to.equal(error);
        assert.calledOnce(energyMonitoringHandler.calculateCostFromBeginning);
        assert.notCalled(res.json);
      }
    });

    it('should have correct route configuration', () => {
      const route = controller['post /api/v1/service/energy-monitoring/calculate-cost-from-beginning'];
      expect(route).to.have.property('authenticated', true);
      expect(route).to.have.property('controller');
      expect(typeof route.controller).to.equal('function');
    });
  });

  describe('GET /api/v1/service/energy-monitoring/contracts', () => {
    it('should get contracts successfully', async () => {
      const expectedContracts = {
        'edf-base': {
          '3': [
            {
              contract: 'base',
              price_type: 'consumption',
              currency: 'euro',
              start_date: '2023-01-01',
              end_date: '2023-12-31',
              price: 1500,
              hour_slots: null,
              day_type: null,
            },
          ],
        },
      };

      energyMonitoringHandler.getContracts = fake.resolves(expectedContracts);

      await controller['get /api/v1/service/energy-monitoring/contracts'].controller(req, res);

      assert.calledOnce(energyMonitoringHandler.getContracts);
      assert.calledOnceWithExactly(res.json, expectedContracts);
    });

    it('should propagate handler errors', async () => {
      const error = new Error('Failed to fetch contracts');
      energyMonitoringHandler.getContracts = fake.rejects(error);

      try {
        await controller['get /api/v1/service/energy-monitoring/contracts'].controller(req, res);
        expect.fail('Should have thrown an error');
      } catch (thrownError) {
        expect(thrownError).to.equal(error);
        assert.calledOnce(energyMonitoringHandler.getContracts);
        assert.notCalled(res.json);
      }
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      energyMonitoringHandler.getContracts = fake.rejects(timeoutError);

      try {
        await controller['get /api/v1/service/energy-monitoring/contracts'].controller(req, res);
        expect.fail('Should have thrown an error');
      } catch (thrownError) {
        expect(thrownError).to.equal(timeoutError);
        expect(thrownError.code).to.equal('ECONNABORTED');
        assert.calledOnce(energyMonitoringHandler.getContracts);
        assert.notCalled(res.json);
      }
    });

    it('should have correct route configuration', () => {
      const route = controller['get /api/v1/service/energy-monitoring/contracts'];
      expect(route).to.have.property('authenticated', true);
      expect(route).to.have.property('controller');
      expect(typeof route.controller).to.equal('function');
    });
  });

  describe('Controller structure', () => {
    it('should export all expected routes', () => {
      expect(controller).to.have.property('post /api/v1/service/energy-monitoring/calculate-cost-from-beginning');
      expect(controller).to.have.property('get /api/v1/service/energy-monitoring/contracts');
    });

    it('should have only the expected routes', () => {
      const routes = Object.keys(controller);
      expect(routes).to.have.lengthOf(2);
      expect(routes).to.include('post /api/v1/service/energy-monitoring/calculate-cost-from-beginning');
      expect(routes).to.include('get /api/v1/service/energy-monitoring/contracts');
    });

    it('should require authentication for all routes', () => {
      Object.values(controller).forEach((route) => {
        expect(route).to.have.property('authenticated', true);
      });
    });
  });

  describe('Integration with handler', () => {
    it('should pass through handler responses correctly', async () => {
      const mockContracts = {
        'test-contract': {
          '9': [
            {
              contract: 'test',
              price_type: 'consumption',
              currency: 'euro',
              start_date: '2024-01-01',
              price: 2000,
            },
          ],
        },
      };

      energyMonitoringHandler.getContracts = fake.resolves(mockContracts);

      await controller['get /api/v1/service/energy-monitoring/contracts'].controller(req, res);

      expect(res.json.firstCall.lastArg).to.deep.equal(mockContracts);
    });

    it('should not modify handler responses', async () => {
      const originalContracts = {
        'edf-base': {
          '6': [{ price: 1500, contract: 'base' }],
        },
      };

      energyMonitoringHandler.getContracts = fake.resolves(originalContracts);

      await controller['get /api/v1/service/energy-monitoring/contracts'].controller(req, res);

      // Verify the response is exactly what the handler returned
      expect(res.json.firstCall.lastArg).to.equal(originalContracts);
      assert.calledOnce(energyMonitoringHandler.getContracts);
    });
  });
});
