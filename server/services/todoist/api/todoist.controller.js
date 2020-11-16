const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TodoistController(todoistService) {
  /**
   * @api {get} /api/v1/service/todoist/tasks Get Todoist tasks
   * @apiName getTasks
   * @apiGroup Todoist
   */
  async function getTasks(req, res) {
    const tasks = await todoistService.getTasks();
    res.json(tasks);
  }

  /**
   * @api {get} /api/v1/service/todoist/projects Get Todoist projects
   * @apiName getProjects
   * @apiGroup Todoist
   */
  async function getProjects(req, res) {
    const projects = await todoistService.getProjects();
    res.json(projects);
  }

  /**
   * @api {get} /api/v1/service/todoist/projects/:project_id/tasks Get Todoist tasks
   * @apiName getTasks
   * @apiGroup Todoist
   */
  async function getTasksByProjectId(req, res) {
    const project_id = parseInt(req.params.project_id, 10);
    const tasks = await todoistService.getTasks({ project_id });
    res.json(tasks);
  }

  return {
    'get /api/v1/service/todoist/tasks': {
      authenticated: true,
      controller: asyncMiddleware(getTasks),
    },
    'get /api/v1/service/todoist/projects': {
      authenticated: true,
      controller: asyncMiddleware(getProjects),
    },
    'get /api/v1/service/todoist/projects/:project_id/tasks': {
      authenticated: true,
      controller: asyncMiddleware(getTasksByProjectId),
    },
  };
};
