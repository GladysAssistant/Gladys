const TodoistApiMock = function TodoistApiMock() {
  return {
    getTasks: () =>
      Promise.resolve([
        {
          id: 'taskId',
          name: 'Task 1',
        },
      ]),
    getProjects: () =>
      Promise.resolve([
        {
          id: 'todolistId',
          name: 'Todolist 1',
        },
      ]),
    closeTask: () => Promise.resolve(),
  };
};

module.exports = TodoistApiMock;
