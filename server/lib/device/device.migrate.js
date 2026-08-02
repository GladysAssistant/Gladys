const Promise = require('bluebird');
const cloneDeep = require('lodash.clonedeep');
const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError, BadParameters, ConflictError } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');
const { getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');

// Fields carrying selectors in scene actions/triggers and dashboard boxes.
// This list is a contract with the Joi schemas of models/scene.js and
// models/dashboard.js (see docs/specs/device-migration.md, B.3).
const FEATURE_STRING_FIELDS = ['device_feature'];
const FEATURE_ARRAY_FIELDS = ['device_features'];
const DEVICE_STRING_FIELDS = ['device', 'camera'];
const DEVICE_ARRAY_FIELDS = ['devices'];

/**
 * @description Replace device/feature selectors in one scene action, scene trigger or dashboard box.
 * @param {object} item - The action/trigger/box object, mutated in place.
 * @param {object} featureReplacements - Map of source feature selector to destination feature selector.
 * @param {object} deviceReplacements - Map of source device selector to destination device selector.
 * @returns {boolean} True if the item was modified.
 * @example
 * rewriteReferences({ device_feature: 'old-feature' }, { 'old-feature': 'new-feature' }, {});
 */
function rewriteReferences(item, featureReplacements, deviceReplacements) {
  let changed = false;
  const replaceString = (field, replacements) => {
    if (typeof item[field] === 'string' && replacements[item[field]] !== undefined) {
      item[field] = replacements[item[field]];
      changed = true;
    }
  };
  const replaceArray = (field, replacements) => {
    if (Array.isArray(item[field])) {
      item[field] = item[field].map((value) => {
        if (typeof value === 'string' && replacements[value] !== undefined) {
          changed = true;
          return replacements[value];
        }
        return value;
      });
    }
  };
  FEATURE_STRING_FIELDS.forEach((field) => replaceString(field, featureReplacements));
  FEATURE_ARRAY_FIELDS.forEach((field) => replaceArray(field, featureReplacements));
  DEVICE_STRING_FIELDS.forEach((field) => replaceString(field, deviceReplacements));
  DEVICE_ARRAY_FIELDS.forEach((field) => replaceArray(field, deviceReplacements));
  return changed;
}

/**
 * @description Replace selectors in scene actions/triggers or dashboard boxes. Handles both
 * flat arrays (triggers) and arrays of arrays (actions, boxes), and recurses into the nested
 * actions of condition.if-then-else (`if` is a flat list, `then`/`else` are arrays of arrays).
 * @param {Array} items - Array of items (or of arrays of items), mutated in place.
 * @param {object} featureReplacements - Map of source feature selector to destination feature selector.
 * @param {object} deviceReplacements - Map of source device selector to destination device selector.
 * @returns {boolean} True if at least one item was modified.
 * @example
 * rewriteItems([[{ device_feature: 'old-feature' }]], { 'old-feature': 'new-feature' }, {});
 */
function rewriteItems(items, featureReplacements, deviceReplacements) {
  let changed = false;
  items.forEach((item) => {
    if (Array.isArray(item)) {
      if (rewriteItems(item, featureReplacements, deviceReplacements)) {
        changed = true;
      }
      return;
    }
    if (rewriteReferences(item, featureReplacements, deviceReplacements)) {
      changed = true;
    }
    if (Array.isArray(item.if) && rewriteItems(item.if, featureReplacements, deviceReplacements)) {
      changed = true;
    }
    if (Array.isArray(item.then) && rewriteItems(item.then, featureReplacements, deviceReplacements)) {
      changed = true;
    }
    if (Array.isArray(item.else) && rewriteItems(item.else, featureReplacements, deviceReplacements)) {
      changed = true;
    }
  });
  return changed;
}

/**
 * @description Migrate a device to another device: move the DuckDB state history,
 * rewrite scenes and dashboards, then delete the source device.
 * See docs/specs/device-migration.md for the full behavior contract.
 * @param {string} selector - Selector of the source device.
 * @param {object} options - Migration options.
 * @param {string} options.destination_device_selector - Selector of the destination device.
 * @param {object} [options.features_mapping] - Map of source feature selector to destination feature selector.
 * @param {string} [jobId] - Id of the job (injected by the job wrapper).
 * @returns {Promise<object>} Resolve with the migration report.
 * @example
 * await executeMigration.call(deviceManager, 'old-device', { destination_device_selector: 'new-device' });
 */
async function executeMigration(selector, options, jobId) {
  const destinationSelector = options.destination_device_selector;
  if (!destinationSelector) {
    throw new BadParameters('destination_device_selector is required');
  }
  const featuresMapping = options.features_mapping || {};

  const sourceRow = await db.Device.findOne({
    where: { selector },
    include: getStandardDeviceIncludes(),
  });
  if (sourceRow === null) {
    throw new NotFoundError('Device not found');
  }
  const destinationRow = await db.Device.findOne({
    where: { selector: destinationSelector },
    include: getStandardDeviceIncludes(),
  });
  if (destinationRow === null) {
    throw new NotFoundError('Destination device not found');
  }
  const source = sourceRow.get({ plain: true });
  const destination = destinationRow.get({ plain: true });

  if (source.id === destination.id) {
    throw new BadParameters('Source and destination devices must be different');
  }
  if (source.service_id === destination.service_id) {
    throw new BadParameters('Destination device must belong to another service');
  }

  const sourceFeatureBySelector = new Map(source.features.map((feature) => [feature.selector, feature]));
  const destinationFeatureBySelector = new Map(destination.features.map((feature) => [feature.selector, feature]));
  const usedDestinationSelectors = new Set();
  const pairs = Object.keys(featuresMapping).map((sourceFeatureSelector) => {
    const destinationFeatureSelector = featuresMapping[sourceFeatureSelector];
    const sourceFeature = sourceFeatureBySelector.get(sourceFeatureSelector);
    if (!sourceFeature) {
      throw new BadParameters(`Feature ${sourceFeatureSelector} does not belong to device ${selector}`);
    }
    const destinationFeature = destinationFeatureBySelector.get(destinationFeatureSelector);
    if (!destinationFeature) {
      throw new BadParameters(`Feature ${destinationFeatureSelector} does not belong to device ${destinationSelector}`);
    }
    if (usedDestinationSelectors.has(destinationFeatureSelector)) {
      throw new BadParameters(`Feature ${destinationFeatureSelector} is used twice as a destination`);
    }
    usedDestinationSelectors.add(destinationFeatureSelector);
    return { sourceFeature, destinationFeature };
  });

  logger.info(`Migrating device ${selector} to ${destinationSelector}, ${pairs.length} features mapped`);
  await this.job.updateProgress(jobId, 5, {
    device_name: source.name,
    destination_device_name: destination.name,
    step: 'moving_states',
  });

  // Move the DuckDB history of each mapped pair, cut at the destination's
  // oldest state so the overlap period is never counted twice.
  let duckDbStatesMigrated = 0;
  await Promise.each(pairs, async ({ sourceFeature, destinationFeature }) => {
    const [{ min_date: minDate }] = await db.duckDbReadConnectionAllAsync(
      `SELECT MIN(created_at) AS min_date FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)`,
      destinationFeature.id,
    );
    if (minDate === null) {
      const [{ count }] = await db.duckDbReadConnectionAllAsync(
        `SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)`,
        sourceFeature.id,
      );
      await db.duckDbWriteConnectionAllAsync(
        `UPDATE t_device_feature_state SET device_feature_id = CAST(? AS UUID) WHERE device_feature_id = CAST(? AS UUID)`,
        destinationFeature.id,
        sourceFeature.id,
      );
      duckDbStatesMigrated += Number(count);
    } else {
      const cutoff = new Date(minDate).toISOString();
      const [{ count }] = await db.duckDbReadConnectionAllAsync(
        `SELECT COUNT(*) AS count FROM t_device_feature_state
         WHERE device_feature_id = CAST(? AS UUID) AND created_at < CAST(? AS TIMESTAMPTZ)`,
        sourceFeature.id,
        cutoff,
      );
      await db.duckDbWriteConnectionAllAsync(
        `UPDATE t_device_feature_state SET device_feature_id = CAST(? AS UUID)
         WHERE device_feature_id = CAST(? AS UUID) AND created_at < CAST(? AS TIMESTAMPTZ)`,
        destinationFeature.id,
        sourceFeature.id,
        cutoff,
      );
      // States of the overlap period are deleted with the source device.
      await db.duckDbWriteConnectionAllAsync(
        'DELETE FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)',
        sourceFeature.id,
      );
      duckDbStatesMigrated += Number(count);
    }
  });

  // Unmapped source features: their history disappears with the device.
  const mappedSourceFeatureIds = new Set(pairs.map((pair) => pair.sourceFeature.id));
  const unmappedSourceFeatures = source.features.filter((feature) => !mappedSourceFeatureIds.has(feature.id));
  await Promise.each(unmappedSourceFeatures, async (feature) => {
    await db.duckDbWriteConnectionAllAsync(
      'DELETE FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)',
      feature.id,
    );
  });
  const sourceFeatureIds = source.features.map((feature) => feature.id);
  if (sourceFeatureIds.length > 0) {
    // Flush the WAL and release the delete-tracking memory of the moves/deletes.
    await db.duckDbWriteConnectionAllAsync('CHECKPOINT');
  }

  await this.job.updateProgress(jobId, 40, { step: 'cleaning_sqlite' });

  // SQLite leftovers (installs that have not purged after the DuckDB
  // migration): deleted, not moved — the DuckDB migration already imported
  // them. This also guarantees the final destroy never hits the
  // "too much states" refusal.
  if (sourceFeatureIds.length > 0) {
    await db.DeviceFeatureState.destroy({ where: { device_feature_id: sourceFeatureIds } });
    await db.DeviceFeatureStateAggregate.destroy({ where: { device_feature_id: sourceFeatureIds } });
  }

  await this.job.updateProgress(jobId, 55, { step: 'updating_references' });

  // Copy last values when the source is fresher, and re-point energy children.
  const deviceIdsToRefresh = new Set([destination.id]);
  await Promise.each(pairs, async ({ sourceFeature, destinationFeature }) => {
    const sourceIsFresher =
      sourceFeature.last_value_changed !== null &&
      (destinationFeature.last_value_changed === null ||
        new Date(destinationFeature.last_value_changed) < new Date(sourceFeature.last_value_changed));
    if (sourceIsFresher) {
      await db.DeviceFeature.update(
        {
          last_value: sourceFeature.last_value,
          last_value_string: sourceFeature.last_value_string,
          last_value_changed: sourceFeature.last_value_changed,
        },
        { where: { id: destinationFeature.id } },
      );
    }
    const energyChildren = await db.DeviceFeature.findAll({
      where: { energy_parent_id: sourceFeature.id },
      attributes: ['id', 'device_id'],
      raw: true,
    });
    if (energyChildren.length > 0) {
      await db.DeviceFeature.update(
        { energy_parent_id: destinationFeature.id },
        { where: { energy_parent_id: sourceFeature.id } },
      );
      energyChildren.forEach((child) => deviceIdsToRefresh.add(child.device_id));
    }
  });

  // Energy price contracts reference their meter by device FK (SET NULL on
  // delete): re-point them, or destroying the source would silently detach
  // the meter from the contracts and cost charts would lose their data.
  await db.EnergyPrice.update(
    { electric_meter_device_id: destination.id },
    { where: { electric_meter_device_id: source.id } },
  );

  // The destination inherits the source's room only when it has none.
  const roomInherited = destination.room_id === null && source.room_id !== null;
  if (roomInherited) {
    await db.Device.update({ room_id: source.room_id }, { where: { id: destination.id } });
  }

  // Refresh the RAM caches of every touched device (except the source,
  // which is about to be destroyed).
  deviceIdsToRefresh.delete(source.id);
  const devicesToRefresh = await db.Device.findAll({
    where: { id: Array.from(deviceIdsToRefresh) },
    include: getStandardDeviceIncludes(),
  });
  let refreshedDestination = null;
  devicesToRefresh.forEach((deviceRow) => {
    const plainDevice = deviceRow.get({ plain: true });
    this.add(plainDevice);
    if (plainDevice.id === destination.id) {
      refreshedDestination = plainDevice;
    }
  });
  if (roomInherited) {
    await this.notify(refreshedDestination, EVENTS.DEVICE.UPDATE);
  }

  await this.job.updateProgress(jobId, 70, { step: 'rewriting_scenes' });

  // Rewrite scenes then dashboards with the selector replacement maps.
  const featureReplacements = {};
  pairs.forEach(({ sourceFeature, destinationFeature }) => {
    featureReplacements[sourceFeature.selector] = destinationFeature.selector;
  });
  const deviceReplacements = { [source.selector]: destination.selector };

  const scenesUpdated = [];
  const scenes = await db.Scene.findAll();
  await Promise.each(scenes, async (sceneRow) => {
    // Deep clone before rewriting: for JSON columns, the plain object shares
    // its reference with the row's dataValues, and mutating it in place would
    // defeat the Sequelize changed-attribute detection on update.
    const scene = cloneDeep(sceneRow.get({ plain: true }));
    const updatePayload = {};
    if (rewriteItems(scene.actions, featureReplacements, deviceReplacements)) {
      updatePayload.actions = scene.actions;
    }
    if (scene.triggers !== null && rewriteItems(scene.triggers, featureReplacements, deviceReplacements)) {
      updatePayload.triggers = scene.triggers;
    }
    if (Object.keys(updatePayload).length > 0) {
      // Goes through the scene manager so the RAM copy and its scheduled
      // triggers are replaced along with the DB row.
      await this.sceneManager.update(scene.selector, updatePayload);
      scenesUpdated.push(scene.selector);
    }
  });

  await this.job.updateProgress(jobId, 85, { step: 'rewriting_dashboards' });

  // All dashboards of all users are rewritten: a migration is a
  // whole-instance operation, not a per-user one.
  const dashboardsUpdated = [];
  const dashboards = await db.Dashboard.findAll();
  await Promise.each(dashboards, async (dashboardRow) => {
    // Same deep clone rationale as for scenes above.
    const dashboard = cloneDeep(dashboardRow.get({ plain: true }));
    if (rewriteItems(dashboard.boxes, featureReplacements, deviceReplacements)) {
      await dashboardRow.update({ boxes: dashboard.boxes });
      dashboardsUpdated.push(dashboard.selector);
    }
  });

  await this.job.updateProgress(jobId, 95, { step: 'deleting_source_device' });

  await this.destroy(source.selector);

  logger.info(
    `Migrated device ${selector} to ${destinationSelector}: ${duckDbStatesMigrated} states moved,` +
      ` ${scenesUpdated.length} scenes and ${dashboardsUpdated.length} dashboards updated`,
  );

  return {
    success: true,
    duck_db_states_migrated: duckDbStatesMigrated,
    scenes_updated: scenesUpdated,
    dashboards_updated: dashboardsUpdated,
  };
}

/**
 * @description Migrate a device to another device, rejecting concurrent runs on the same source.
 * See executeMigration above for the actual behavior, and docs/specs/device-migration.md for the contract.
 * @param {string} selector - Selector of the source device.
 * @param {object} options - Migration options.
 * @param {string} options.destination_device_selector - Selector of the destination device.
 * @param {object} [options.features_mapping] - Map of source feature selector to destination feature selector.
 * @param {string} [jobId] - Id of the job (injected by the job wrapper).
 * @returns {Promise<object>} Resolve with the migration report.
 * @example
 * await device.migrate('old-device', {
 *   destination_device_selector: 'new-device',
 *   features_mapping: { 'old-device-temperature': 'new-device-temperature' },
 * });
 */
async function migrate(selector, options, jobId) {
  // A migration deletes history: a concurrent run touching the same source
  // (e.g. a client-timeout retry) or the same destination (its feature
  // snapshot would go stale mid-run) must be rejected — the job wrapper does
  // not serialize anything.
  const selectorsToLock = [selector, options.destination_device_selector].filter(Boolean);
  const conflictingSelector = selectorsToLock.find((deviceSelector) => this.migrationsInProgress.has(deviceSelector));
  if (conflictingSelector) {
    throw new ConflictError(`A migration is already in progress for device ${conflictingSelector}`);
  }
  selectorsToLock.forEach((deviceSelector) => this.migrationsInProgress.add(deviceSelector));
  try {
    return await executeMigration.call(this, selector, options, jobId);
  } finally {
    selectorsToLock.forEach((deviceSelector) => this.migrationsInProgress.delete(deviceSelector));
  }
}

module.exports = {
  migrate,
};
