const TodoistApiBrokenMock = function TodoistApiBrokenMock() {
  return {
    getTasks: () => Promise.reject(new Error('broken')),
    getProjects: () => Promise.reject(new Error('broken')),
    closeTask: () => Promise.reject(new Error('broken')),
  };
};

module.exports = TodoistApiBrokenMock;
