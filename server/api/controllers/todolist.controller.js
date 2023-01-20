const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function TodolistController(gladys) {
  /**
   * @api {get} /api/v1/todolist/tasks Get all todolist tasks
   * @apiName getTasks
   * @apiGroup Todolist
   */
  async function getTasks(req, res) {
    const tasks = await gladys.todolist.getTasks();
    res.json(tasks);
  }

  /**
   * @api {get} /api/v1/todolist Get list of todolist
   * @apiName getTodolist
   * @apiGroup Todolist
   */
  async function getTodolist(req, res) {
    const todolist = await gladys.todolist.get();
    res.json(todolist);
  }

  /**
   * @api {get} /api/v1/todolist/:todolist_id/tasks Get tasks by todolist id
   * @apiName getTasksByTodolistId
   * @apiGroup Todolist
   */
  async function getTasksByTodolistId(req, res) {
    const todolistId = req.params.todolist_id;
    const tasks = await gladys.todolist.getTasks({ todolist_id: todolistId });
    res.json(tasks);
  }

  /**
   * @api {post} /api/v1/todolist/tasks/:task_id/close Close a todolist task
   * @apiName closeTask
   * @apiGroup Todolist
   */
  async function closeTask(req, res) {
    const taskId = req.params.task_id;
    await gladys.todolist.closeTask(taskId);
    res.status(204);
    res.send();
  }

  return Object.freeze({
    getTasks: asyncMiddleware(getTasks),
    getTodolist: asyncMiddleware(getTodolist),
    getTasksByTodolistId: asyncMiddleware(getTasksByTodolistId),
    closeTask: asyncMiddleware(closeTask),
  });
};
