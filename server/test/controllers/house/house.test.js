const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/house', () => {
  it('should create house', async () => {
    await authenticatedRequest
      .post('/api/v1/house')
      .send({
        name: 'my house',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'my house');
        expect(res.body).to.have.property('selector', 'my-house');
      });
  });
});

describe('GET /api/v1/house', () => {
  it('should return list of houses', async () => {
    await authenticatedRequest
      .get('/api/v1/house')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
            name: 'Peppers house',
            selector: 'pepper-house',
            alarm_code: null,
            alarm_delay_before_arming: 10,
            alarm_mode: 'disarmed',
            latitude: null,
            longitude: null,
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
          {
            id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
            name: 'Test house',
            selector: 'test-house',
            alarm_code: null,
            alarm_delay_before_arming: 10,
            alarm_mode: 'disarmed',
            latitude: 12,
            longitude: 12,
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
  it('should return list of houses in desc order', async () => {
    await authenticatedRequest
      .get('/api/v1/house')
      .query({
        order_dir: 'desc',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
            name: 'Test house',
            selector: 'test-house',
            alarm_code: null,
            alarm_delay_before_arming: 10,
            alarm_mode: 'disarmed',
            latitude: 12,
            longitude: 12,
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
          {
            id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
            name: 'Peppers house',
            selector: 'pepper-house',
            alarm_code: null,
            alarm_delay_before_arming: 10,
            alarm_mode: 'disarmed',
            latitude: null,
            longitude: null,
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
  it('should search and return only one house', async () => {
    await authenticatedRequest
      .get('/api/v1/house')
      .query({
        search: 'test',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
            name: 'Test house',
            selector: 'test-house',
            alarm_code: null,
            alarm_delay_before_arming: 10,
            alarm_mode: 'disarmed',
            latitude: 12,
            longitude: 12,
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
});

describe('PATCH /api/v1/house/test-house', () => {
  it('should update a house', async () => {
    await authenticatedRequest
      .patch('/api/v1/house/test-house')
      .send({
        name: 'NEW NAME',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'NEW NAME');
      });
  });
});

describe('GET /api/v1/house/test-house', () => {
  it('should get a house by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/house/test-house')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', 'test-house');
        expect(res.body).to.have.property('alarm_mode', 'disarmed');
      });
  });
});

describe('DELETE /api/v1/house/test-house', () => {
  it('should delete a house', async () => {
    await authenticatedRequest
      .delete('/api/v1/house/test-house')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('GET /api/v1/house/test-house/room', () => {
  it('should return rooms in a house', async () => {
    await authenticatedRequest
      .get('/api/v1/house/test-house/room')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((room) => {
          expect(room).to.have.property('id');
          expect(room).to.have.property('name');
        });
      });
  });
});

describe('POST /api/v1/house/:user_selector/user/:user_selector/seen', () => {
  it('should mark the user has seen in this house', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/user/john/seen')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('current_house_id', 'a741dfa6-24de-4b46-afc7-370772f068d5');
      });
  });
});
