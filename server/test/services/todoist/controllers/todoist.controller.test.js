const { assert, fake, stub } = require('sinon');
const TodoistController = require('../../../../services/todoist/api/todoist.controller');

const todoistService = {
  getTasks: stub(),
  getProjects: stub(),
  completeTask: stub(),
};

const res = {
  json: fake.returns(null),
  status: fake.returns({
    send: fake.returns(null),
  }),
};

describe('get /api/v1/service/todoist/tasks', () => {
  it('should return list of tasks', async () => {
    const todoistController = TodoistController(todoistService);
    const req = {};
    await todoistController['get /api/v1/service/todoist/tasks'].controller(req, res);
    assert.calledWith(todoistService.getTasks);
  });
});

describe('get /api/v1/service/todoist/projects', () => {
  it('should return list of project', async () => {
    const todoistController = TodoistController(todoistService);
    const req = {};
    await todoistController['get /api/v1/service/todoist/projects'].controller(req, res);
    assert.calledWith(todoistService.getProjects);
  });
});

describe('get /api/v1/service/todoist/projects/:project_id/tasks', () => {
  it('should return list of tasks for a project', async () => {
    const todoistController = TodoistController(todoistService);
    const req = {
      params: {
        project_id: '3',
      },
    };
    await todoistController['get /api/v1/service/todoist/projects/:project_id/tasks'].controller(req, res);
    assert.calledWith(todoistService.getTasks);
  });
});

describe('post /api/v1/service/todoist/tasks/:task_id/complete', () => {
  it('should return list of tasks for a project', async () => {
    const todoistController = TodoistController(todoistService);
    const req = {
      params: {
        task_id: '6',
      },
    };
    await todoistController['post /api/v1/service/todoist/tasks/:task_id/complete'].controller(req, res);
    assert.calledWith(todoistService.completeTask);
  });
});
