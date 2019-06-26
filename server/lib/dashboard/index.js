const { create } = require('./dashboard.create');
const { get } = require('./dashboard.get');
const { destroy } = require('./dashboard.destroy');
const { getBySelector } = require('./dashboard.getBySelector');
const { update } = require('./dashboard.update');

const Dashboard = function Dashboard() {};

Dashboard.prototype.create = create;
Dashboard.prototype.destroy = destroy;
Dashboard.prototype.get = get;
Dashboard.prototype.getBySelector = getBySelector;
Dashboard.prototype.update = update;

module.exports = Dashboard;
