const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { Error400 } = require('../../../utils/httpErrors');

const axiosClientGetTasks = fake.resolves({
  data: [
    {
      id: '1',
      name: 'Task 1',
    },
    {
      id: '2',
      name: 'Task 2',
      parent_id: '2',
    },
  ],
});

const axiosClientGetProjects = fake.resolves({
  data: [
    {
      id: '1',
      name: 'Project 1',
    },
    {
      id: '2',
      name: 'Project 2',
      parent_id: '2',
    },
  ],
});

const axiosClient = {
  default: {
    get: null,
    post: null,
  },
};

const TodoistService = proxyquire('../../../services/todoist/index', {
  axios: axiosClient,
});

describe('TodoistService', () => {
  const gladys = {
    variable: {
      getValue: fake.resolves('value'),
    },
  };

  const todoistService = TodoistService(gladys);
  it('should have start function', () => {
    expect(todoistService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(todoistService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should have getTasks function', () => {
    expect(todoistService)
      .to.have.property('getTasks')
      .and.be.instanceOf(Function);
  });
  it('should have getProjects function', () => {
    expect(todoistService)
      .to.have.property('getProjects')
      .and.be.instanceOf(Function);
  });
  it('should have completeTask function', () => {
    expect(todoistService)
      .to.have.property('completeTask')
      .and.be.instanceOf(Function);
  });
});

describe('ExampleService lifecycle', () => {
  const gladys = {
    variable: {
      getValue: fake.resolves('value'),
    },
  };
  const todoistService = TodoistService(gladys);
  it('should start the service', async () => {
    await todoistService.start();
    assert.callCount(gladys.variable.getValue, 1);
  });
  it("shouldn't start the service", async () => {
    gladys.variable.getValue = fake.resolves(null);

    try {
      await todoistService.start();
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      assert.callCount(gladys.variable.getValue, 1);
    }
  });
  it('should stop the service', async () => {
    await todoistService.stop();
  });
});

describe('ExampleService.getTasks', () => {
  const gladys = {
    variable: {
      getValue: fake.resolves('value'),
    },
  };

  const todoistService = TodoistService(gladys);
  beforeEach(async () => {
    axiosClient.default.get = axiosClientGetTasks;
    await todoistService.start();
  });

  it('should get tasks ', async () => {
    const tasks = await todoistService.getTasks();
    expect(tasks).to.have.length(2);
  });

  it("shouldn't get tasks because api reply error ", async () => {
    axiosClient.default.get = fake.throws(new Error());
    try {
      await todoistService.getTasks();
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).to.be.instanceOf(Error400);
    }
  });
});

describe('ExampleService.getProjects', () => {
  const gladys = {
    variable: {
      getValue: fake.resolves('value'),
    },
  };

  const todoistService = TodoistService(gladys);
  beforeEach(async () => {
    axiosClient.default.get = axiosClientGetProjects;
    await todoistService.start();
  });

  it('should get projects ', async () => {
    const projects = await todoistService.getProjects();
    expect(projects).to.have.length(2);
  });

  it("shouldn't get projects because api reply error ", async () => {
    axiosClient.default.get = fake.throws(new Error());
    try {
      await todoistService.getProjects();
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).to.be.instanceOf(Error400);
    }
  });
});

describe('ExampleService.completeTask', () => {
  const gladys = {
    variable: {
      getValue: fake.resolves('value'),
    },
  };

  const todoistService = TodoistService(gladys);
  beforeEach(async () => {
    axiosClient.default.get = axiosClientGetProjects;
    await todoistService.start();
  });

  it('should complete the tasks ', async () => {
    axiosClient.default.post = fake.resolves();
    await todoistService.completeTask();
  });

  it("shouldn't complete the tasks because api reply error ", async () => {
    axiosClient.default.post = fake.throws(new Error());
    try {
      await todoistService.completeTask();
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).to.be.instanceOf(Error400);
    }
  });
});
