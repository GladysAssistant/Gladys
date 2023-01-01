const { expect } = require('chai');
const { fake, assert } = require('sinon');

const fakeTasks = [
  {
    id: '4571479272',
    content: 'Task 1',
  },
  {
    id: '32506549',
    name: 'Task 2',
  },
];

const Todolist = require('../../../lib/todolist');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const todoist = {
  todolist: {
    getTasks: fake.resolves(fakeTasks),
  },
};

const service = {
  getService: () => todoist,
};

const serviceWithoutTodoist = {
  getService: () => null,
};

describe('todolist.getTasks', () => {
  it('should get tasks', async () => {
    const todolist = new Todolist(service);

    const result = await todolist.getTasks();
    expect(result).to.deep.equal([
      {
        id: '4571479272',
        content: 'Task 1',
      },
      {
        id: '32506549',
        name: 'Task 2',
      },
    ]);
    assert.calledWith(todoist.todolist.getTasks);
  });
  it('should throw an error, service not configured', async () => {
    const todolist = new Todolist(serviceWithoutTodoist);
    expect(() => {
      todolist.getTasks();
    }).to.throw(ServiceNotConfiguredError, 'Service todoist is not found or not configured');
  });
});
