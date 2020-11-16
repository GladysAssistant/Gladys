const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const TodoistController = require('./api/todoist.controller');
const { generateProjectsTree } = require('./lib')

const TODOIST_API_KEY = 'TODOIST_API_KEY';

module.exports = function TodoistService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let todoistApiKey;

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.todoist.start();
   */
  async function start() {
    logger.info('Starting Todoist service');
    todoistApiKey = await gladys.variable.getValue(TODOIST_API_KEY, serviceId);
    if (!todoistApiKey) {
      throw new ServiceNotConfiguredError('Todoist Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.todoist.stop();
   */
  async function stop() {
    logger.log('stopping Todoist service');
  }

  /**
   * @description Get Todoist tasks.
   * @param {Object} options
   * @param {number} options.projectId
   * @example
   * gladys.services.todoist.getTasks();
   */
  async function getTasks(options) {
    if (!todoistApiKey) {
      throw new ServiceNotConfiguredError('Todoist API Key not found');
    }
    const url = `https://api.todoist.com/rest/v1/tasks`;
    try {
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${todoistApiKey}` }, params: options });
      logger.debug(`Found ${data.length} task(s).`);
      return data;
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  /**
   * @description Get Todoist tasks.
   * @example
   * gladys.services.todoist.getProjects();
   */
  async function getProjects() {
    if (!todoistApiKey) {
      throw new ServiceNotConfiguredError('Todoist API Key not found');
    }
    const url = `https://api.todoist.com/rest/v1/projects`;
    try {
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${todoistApiKey}` } });
      logger.debug(`Found ${data.length} project(s).`);
      return generateProjectsTree(data);
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  const service = {
    start,
    stop,
    getTasks,
    getProjects,
  };

  return Object.freeze({
    ...service,
    controllers: TodoistController(service),
  });
};
