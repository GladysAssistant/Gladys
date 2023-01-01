const { expect } = require('chai');
const { fake, assert } = require('sinon');

const fakeTodolist = [
  {
    id: '2258112119',
    name: 'Inbox',
  },
  {
    id: '2258112120',
    name: 'Welcome 👋',
  },
];

const Todolist = require('../../../lib/todolist');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const todoist = {
  todolist: {
    get: fake.resolves(fakeTodolist),
  },
};

const service = {
  getService: () => todoist,
};

const serviceWithoutTodoist = {
  getService: () => null,
};

describe('todolist.get', () => {
  it('should get todolist', async () => {
    const todolist = new Todolist(service);

    const result = await todolist.get();
    expect(result).to.deep.equal([
      {
        id: '2258112119',
        name: 'Inbox',
      },
      {
        id: '2258112120',
        name: 'Welcome 👋',
      },
    ]);
    assert.calledWith(todoist.todolist.get);
  });
  it('should throw an error, service not configured', async () => {
    const todolist = new Todolist(serviceWithoutTodoist);
    expect(() => {
      todolist.get();
    }).to.throw(ServiceNotConfiguredError, 'Service todoist is not found or not configured');
  });
});
