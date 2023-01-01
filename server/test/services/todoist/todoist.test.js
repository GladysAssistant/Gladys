const { expect, assert } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const TodoistApiMock = require('./TodoistApi.mock');
const TodoistApiBroken = require('./TodoistApiBroken.mock');

const todoistApi = {
  '@doist/todoist-api-typescript': {
    TodoistApi: TodoistApiMock,
  },
};

const brokenTodoistApi = {
  '@doist/todoist-api-typescript': {
    TodoistApi: TodoistApiBroken,
  },
};

const gladys = {
  variable: {
    getValue: () => Promise.resolve('TODOIST_API_KEY'),
  },
};

describe('TodoistService', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', todoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
  });
  it('should stop service', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', todoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.stop();
  });
  it('should return list of tasks', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', todoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
    const tasks = await todoistService.todolist.getTasks();
    expect(tasks).to.deep.equal([
      {
        id: 'taskId',
        name: 'Task 1',
      },
    ]);
  });
  it('should return error, unable to contact third party provider', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', brokenTodoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
    const promise = todoistService.todolist.getTasks();

    return assert.isRejected(promise, 'REQUEST_TO_THIRD_PARTY_FAILED');
  });

  it('should return list of todolist', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', todoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
    const tasks = await todoistService.todolist.get();
    expect(tasks).to.deep.equal([
      {
        id: 'todolistId',
        name: 'Todolist 1',
      },
    ]);
  });
  it('should return error, unable to contact third party provider', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', brokenTodoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
    const promise = todoistService.todolist.get();

    return assert.isRejected(promise, 'REQUEST_TO_THIRD_PARTY_FAILED');
  });

  it('should close a task', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', todoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
    await todoistService.todolist.closeTask('taskId');
  });
  it('should return error, unable to contact third party provider', async () => {
    const TodoistService = proxyquire('../../../services/todoist/index', brokenTodoistApi);
    const todoistService = TodoistService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await todoistService.start();
    const promise = todoistService.todolist.closeTask('taskId');

    return assert.isRejected(promise, 'REQUEST_TO_THIRD_PARTY_FAILED');
  });
});
