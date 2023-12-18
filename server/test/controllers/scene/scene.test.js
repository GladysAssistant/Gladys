const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');
const { ACTIONS, ACTIONS_STATUS } = require('../../../utils/constants');

describe('POST /api/v1/scene', () => {
  it('should create scene', async () => {
    await authenticatedRequest
      .post('/api/v1/scene')
      .send({
        name: 'New Scene',
        icon: 'bell',
        triggers: [],
        tags: [],
        actions: [
          [
            {
              type: ACTIONS.LIGHT.TURN_ON,
            },
          ],
        ],
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'New Scene');
        expect(res.body).to.have.property('selector', 'new-scene');
      });
  });
});

describe('GET /api/v1/scene', () => {
  it('should get scene', async () => {
    await authenticatedRequest
      .get('/api/v1/scene')
      .query({
        search: 'Test scene',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '3a30636c-b3f0-4251-a347-90787f0fe940',
            name: 'Test scene',
            icon: 'fe fe-bell',
            active: true,
            description: null,
            selector: 'test-scene',
            tags: [],
            last_executed: null,
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
  it('should return 0 scenes', async () => {
    await authenticatedRequest
      .get('/api/v1/scene')
      .query({
        search: 'UNKNOWN SCENE',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([]);
      });
  });
});

describe('PATCH /api/v1/scene/:scene_selector', () => {
  it('should update scene', async () => {
    await authenticatedRequest
      .patch('/api/v1/scene/test-scene')
      .send({
        name: 'New name',
        description: 'New description',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'New name');
        expect(res.body).to.have.property('description', 'New description');
      });
  });
});

describe('GET /api/v1/scene/:scene_selector', () => {
  it('should get scene by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/scene/test-scene')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', 'test-scene');
      });
  });
});

describe('DELETE /api/v1/scene/:scene_selector', () => {
  it('should delete scene', async () => {
    await authenticatedRequest
      .delete('/api/v1/scene/test-scene')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          success: true,
        });
      });
  });
});

describe('POST /api/v1/scene/:scene_selector/start', () => {
  it('should start a scene', async () => {
    await authenticatedRequest
      .post('/api/v1/scene/test-scene/start')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          type: ACTIONS.SCENE.START,
          scene: 'test-scene',
          status: ACTIONS_STATUS.PENDING,
        });
      });
  });
});

describe('POST /api/v1/scene/:scene_selector/duplicate', () => {
  it('should duplicate a scene', async () => {
    await authenticatedRequest
      .post('/api/v1/scene/to-duplicate-scene/duplicate')
      .send({
        name: 'Duplicated Scene',
        icon: 'anchor',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('icon', 'anchor');
        expect(res.body).to.have.property('name', 'Duplicated Scene');
        expect(res.body).to.have.property('selector', 'duplicated-scene');
      });
  });
});

describe('GET /api/v1/tag_scene', () => {
  it('should get tags', async () => {
    await authenticatedRequest
      .get('/api/v1/tag_scene')
      .send()
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            name: 'tag 1',
            scene_count: 1,
          },
          {
            name: 'tag 2',
            scene_count: 1,
          },
        ]);
      });
  });
});
