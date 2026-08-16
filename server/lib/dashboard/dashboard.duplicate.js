const { Op } = require('sequelize');

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { slugify } = require('../../utils/slugify');
const { DASHBOARD_VISIBILITY } = require('../../utils/constants');

/**
 * @description Duplicate a dashboard.
 * @param {string} userId - The userId querying.
 * @param {string} selector - The selector of the source dashboard.
 * @param {string} name - The name of the duplicated dashboard.
 * @returns {Promise<object>} Resolve with the duplicated dashboard.
 * @example
 * gladys.dashboard.duplicate('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'main-dashboard', 'Copy of Main dashboard');
 */
async function duplicate(userId, selector, name) {
  const existingDashboard = await db.Dashboard.findOne({
    where: {
      // I can duplicate a dashboard I created or a public dashboard
      [Op.or]: [
        {
          user_id: userId,
        },
        {
          visibility: 'public',
        },
      ],
      selector,
    },
  });

  if (existingDashboard === null) {
    throw new NotFoundError('Dashboard not found');
  }

  const plainExistingDashboard = existingDashboard.get({ plain: true });

  // The copy belongs to the user asking for it. Duplicating a public dashboard
  // of someone else should not re-share a second copy with the whole
  // installation, so only the creator of the source keeps its visibility.
  const visibility =
    plainExistingDashboard.user_id === userId ? plainExistingDashboard.visibility : DASHBOARD_VISIBILITY.PRIVATE;

  const newDashboard = {
    name,
    selector: slugify(name, true),
    type: plainExistingDashboard.type,
    visibility,
    boxes: plainExistingDashboard.boxes,
  };

  // create places the new dashboard at the end of the dashboard list of the user
  const createdDashboard = await this.create(userId, newDashboard);

  return createdDashboard.get({ plain: true });
}

module.exports = {
  duplicate,
};
