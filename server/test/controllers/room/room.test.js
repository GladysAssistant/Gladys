const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/house/:house_selector/room', () => {
  it('should create room', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/room')
      .send({
        name: 'my room',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'my room');
        expect(res.body).to.have.property('selector', 'my-room');
      });
  });
});

describe('PATCH /api/v1/room/:room_selector', () => {
  it('should update a room', async () => {
    await authenticatedRequest
      .patch('/api/v1/room/test-room')
      .send({
        name: 'new name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'new name');
        expect(res.body).to.have.property('selector', 'test-room');
      });
  });
});

describe('DELETE /api/v1/room/:room_selector', () => {
  it('should delete a room', async () => {
    await authenticatedRequest
      .delete('/api/v1/room/test-room')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('GET /api/v1/room/:room_selector', () => {
  it('should get a room by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/room/test-room')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
          name: 'Test room',
          selector: 'test-room',
          created_at: '2019-02-12T07:49:07.556Z',
          updated_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
  it('should get a room by selector with expanded temperature', async () => {
    await authenticatedRequest
      .get('/api/v1/room/test-room?expand=temperature')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
          name: 'Test room',
          selector: 'test-room',
          temperature: {
            temperature: 28.88888888888889,
            unit: 'celsius',
          },
          created_at: '2019-02-12T07:49:07.556Z',
          updated_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
  it('should get a room by selector with expanded humidity', async () => {
    await authenticatedRequest
      .get('/api/v1/room/test-room?expand=humidity')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
          name: 'Test room',
          selector: 'test-room',
          humidity: {
            humidity: 56.2,
            unit: 'percent',
          },
          created_at: '2019-02-12T07:49:07.556Z',
          updated_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
  it('should get a room by selector with expanded devices', async () => {
    await authenticatedRequest
      .get('/api/v1/room/test-room?expand=devices')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('devices');
        res.body.devices.forEach((device) => {
          expect(device).to.have.property('service');
        });
      });
  });
});

describe('GET /api/v1/room', () => {
  it('should get rooms with pagination and devices', async () => {
    await authenticatedRequest
      .get('/api/v1/room?expand=devices')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((room) => {
          expect(room).to.have.property('devices');
        });
      });
  });
});
