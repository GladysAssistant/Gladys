const { expect } = require('chai');
const { fake, assert } = require('sinon');

const Todolist = require('../../../lib/todolist');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const todoist = {
  todolist: {
    closeTask: fake.resolves(),
  },
};

const service = {
  getService: () => todoist,
};

const serviceWithoutTodoist = {
  getService: () => null,
};

describe('todolist.closeTask', () => {
  it('should close a task', async () => {
    const todolist = new Todolist(service);

    await todolist.closeTask('taskId');

    assert.calledWith(todoist.todolist.closeTask);
  });
  it('should throw an error, service not configured', async () => {
    const todolist = new Todolist(serviceWithoutTodoist);
    expect(() => {
      todolist.closeTask();
    }).to.throw(ServiceNotConfiguredError, 'Service todoist is not found or not configured');
  });
});
