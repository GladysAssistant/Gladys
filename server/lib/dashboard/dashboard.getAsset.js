const { Op } = require('sequelize');

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a dashboard image asset, as a data-URI-ready string.
 * @param {string} userId - The userId querying.
 * @param {string} id - The asset id.
 * @returns {Promise<string>} Resolve with "content-type;base64,data".
 * @example
 * gladys.dashboard.getAsset('user-id', 'b21e1fbb-8bf5-45a2-9124-cc2d915ad324');
 */
async function getAsset(userId, id) {
  const dashboardAsset = await db.DashboardAsset.findOne({
    where: {
      id,
    },
    include: [
      {
        model: db.Dashboard,
        as: 'dashboard',
        attributes: ['id'],
        where: {
          // I can see assets of dashboards I created or of public dashboards
          [Op.or]: [
            {
              user_id: userId,
            },
            {
              visibility: 'public',
            },
          ],
        },
      },
    ],
  });

  if (dashboardAsset === null) {
    throw new NotFoundError('Dashboard asset not found');
  }

  return `${dashboardAsset.content_type};base64,${dashboardAsset.data.toString('base64')}`;
}

module.exports = {
  getAsset,
};
