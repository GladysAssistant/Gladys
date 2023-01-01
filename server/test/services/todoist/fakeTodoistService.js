const service = {
  todolist: {
    get: () =>
      Promise.resolve([
        {
          id: 'todolistId',
          name: 'Todolist 1',
        },
      ]),
    getTasks: () =>
      Promise.resolve([
        {
          id: 'taskId',
          name: 'Task 1',
        },
      ]),
    closeTask: () => Promise.resolve(),
  },
};

module.exports = service;
