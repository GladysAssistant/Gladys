const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');
const { EVENTS, CONDITIONS } = require('../../../utils/constants');

describe('POST /api/v1/trigger', () => {
  it('should create trigger', async () => {
    await authenticatedRequest
      .post('/api/v1/trigger')
      .send({
        name: 'New trigger',
        type: EVENTS.LIGHT.TURNED_ON,
        rule: {
          conditions: [
            {
              type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
              house: 'my-house',
            },
          ],
        },
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'New trigger');
        expect(res.body).to.have.property('selector', 'new-trigger');
      });
  });
});

describe('GET /api/v1/trigger', () => {
  it('should get triggers', async () => {
    await authenticatedRequest
      .get('/api/v1/trigger')
      .query({
        search: 'Test trigger',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '1763b345-b2b6-4c9b-8fed-ae017109956c',
            name: 'Test trigger',
            selector: 'test-trigger',
            type: 'light.turned-on',
            active: true,
            last_triggered: null,
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
  it('should return 0 triggers', async () => {
    await authenticatedRequest
      .get('/api/v1/trigger')
      .query({
        search: 'UNKNOWN TRIGGER',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([]);
      });
  });
});

describe('PATCH /api/v1/trigger/:trigger_selector', () => {
  it('should update trigger', async () => {
    await authenticatedRequest
      .patch('/api/v1/trigger/test-trigger')
      .send({
        name: 'New name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'New name');
      });
  });
});

describe('DELETE /api/v1/trigger/:trigger_selector', () => {
  it('should delete trigger', async () => {
    await authenticatedRequest
      .delete('/api/v1/trigger/test-trigger')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          success: true,
        });
      });
  });
});
