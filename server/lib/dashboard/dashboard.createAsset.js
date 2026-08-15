const { Op } = require('sequelize');

const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

// Only raster image types the frontend can display in an <img> data URI.
const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
// ~3 MB of binary once decoded, sized under the route's JSON body bound.
const MAX_BASE64_LENGTH = 4 * 1024 * 1024;
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * @description Create an image asset attached to a dashboard.
 * @param {string} userId - The userId querying.
 * @param {string} selector - The dashboard selector.
 * @param {object} asset - The asset to store.
 * @param {string} asset.content_type - Image MIME type.
 * @param {string} asset.data - Base64-encoded image data.
 * @returns {Promise<object>} Resolve with the created asset id.
 * @example
 * gladys.dashboard.createAsset('user-id', 'main-dashboard', { content_type: 'image/png', data: 'iVBORw0...' });
 */
async function createAsset(userId, selector, asset) {
  if (!ALLOWED_CONTENT_TYPES.includes(asset.content_type)) {
    throw new BadParameters(`Content type "${asset.content_type}" is not allowed`);
  }
  if (typeof asset.data !== 'string' || asset.data.length === 0 || asset.data.length > MAX_BASE64_LENGTH) {
    throw new BadParameters('Asset data must be a base64 string of at most 4 MB');
  }
  if (!BASE64_REGEX.test(asset.data)) {
    throw new BadParameters('Asset data must be a valid base64 string');
  }

  const dashboard = await db.Dashboard.findOne({
    where: {
      // I can edit dashboards I created or public dashboards
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

  if (dashboard === null) {
    throw new NotFoundError('Dashboard not found');
  }

  const dashboardAsset = await db.DashboardAsset.create({
    dashboard_id: dashboard.id,
    content_type: asset.content_type,
    data: Buffer.from(asset.data, 'base64'),
  });

  return { id: dashboardAsset.id };
}

module.exports = {
  createAsset,
};
