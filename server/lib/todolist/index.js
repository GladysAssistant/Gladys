const { getTasks } = require('./todolist.getTasks');
const { get } = require('./todolist.get');
const { closeTask } = require('./todolist.closeTask');

const Todolist = function Todolist(service) {
  this.service = service;
};
Todolist.prototype.getTasks = getTasks;
Todolist.prototype.get = get;
Todolist.prototype.closeTask = closeTask;

module.exports = Todolist;
