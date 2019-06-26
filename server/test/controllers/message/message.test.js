const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/message', () => {
  it('should send message', async () => {
    await authenticatedRequest
      .post('/api/v1/message')
      .send({
        text: 'What time is it?',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.deep.equal({
          text: 'What time is it?',
          source: 'api_client',
          source_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
          created_at: res.body.created_at,
        });
      });
  });
});

describe('GET /api/v1/message', () => {
  it('should get messages', async () => {
    await authenticatedRequest
      .get('/api/v1/message')
      .query({
        take: 1,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
            sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
            receiver_id: null,
            file: null,
            text: 'What time is it ?',
            is_read: true,
            created_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
});
