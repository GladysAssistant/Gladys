const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

describe('GET /api/v1/todolist', () => {
  it('should return list of todolist', async () => {
    await authenticatedRequest
      .get('/api/v1/todolist')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: 'todolistId',
            name: 'Todolist 1',
          },
        ]);
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .get('/api/v1/todolist')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});

describe('GET /api/v1/todolist/:todolistId/tasks', () => {
  it('should return list of task of the todolist', async () => {
    await authenticatedRequest
      .get('/api/v1/todolist/todolistId/tasks')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: 'taskId',
            name: 'Task 1',
          },
        ]);
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .get('/api/v1/todolist/todolistId/tasks')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});

describe('POST /api/v1/todolist/tasks/:task_id/close', () => {
  it('should close a task in the todolist', async () => {
    await authenticatedRequest.post('/api/v1/todolist/tasks/:task_id/close').expect(204);
  });
  it('should return 401 unauthorized', async () => {
    await request
      .post('/api/v1/todolist/tasks/:task_id/close')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
