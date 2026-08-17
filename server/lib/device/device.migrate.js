const Promise = require('bluebird');
const cloneDeep = require('lodash.clonedeep');
const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError, BadParameters, ConflictError } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');
const { getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');
const {
  FEATURE_STRING_FIELDS,
  FEATURE_ARRAY_FIELDS,
  DEVICE_STRING_FIELDS,
  DEVICE_ARRAY_FIELDS,
} = require('./device.selectorFields');

// Progress range of the DuckDB history move, spread over the slices below so a
// long migration keeps moving instead of sitting at its first percentage.
const MOVE_PROGRESS_START = 5;
const MOVE_PROGRESS_END = 40;

const uuidParam = () => 'CAST(? AS UUID)';

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
 * actions of condition.if-then-else (`if` is a flat list, `then`/`else` are arrays of arrays)
 * and of condition.while (`if` is a flat list, `then` is an array of arrays, no `else`).
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
 * @description Read the oldest destination state of every mapped pair — the cutoff past
 * which the source history is dropped instead of moved. One `MIN(...) FILTER` per pair in
 * a single statement: `device_feature_id` is not indexed, so one MIN per pair would be one
 * full scan of the whole history per pair.
 * @param {Array} pairs - Array of { sourceFeature, destinationFeature }.
 * @returns {Promise<Array>} Resolve with the pairs, each with its `cutoff` (ISO string or null).
 * @example
 * const pairsWithCutoff = await readDestinationCutoffs(pairs);
 */
async function readDestinationCutoffs(pairs) {
  const destinationIds = pairs.map(({ destinationFeature }) => destinationFeature.id);
  const [row] = await db.duckDbReadConnectionAllAsync(
    `SELECT ${destinationIds
      .map((id, index) => `MIN(created_at) FILTER (WHERE device_feature_id = ${uuidParam()}) AS cutoff_${index}`)
      .join(', ')}
     FROM t_device_feature_state WHERE device_feature_id IN (${destinationIds.map(uuidParam).join(',')})`,
    ...destinationIds,
    ...destinationIds,
  );
  return pairs.map((pair, index) => {
    const cutoff = row[`cutoff_${index}`];
    return { ...pair, cutoff: cutoff === null ? null : new Date(cutoff).toISOString() };
  });
}

/**
 * @description Build the `created_at` bounds of one slice. The first slice has no lower
 * bound and the last one no upper bound, so the slices always cover the whole timeline
 * (a state written at "now" while the migration runs falls in the last slice). A state
 * back-dated into an already-processed slice is caught by the final unbounded sweep of
 * `moveDuckDbHistory` instead.
 * @param {number} index - Index of the slice.
 * @param {number} numberOfSlices - Total number of slices.
 * @param {number} startTime - Timestamp of the oldest state to process.
 * @param {number} stepInMs - Duration of a slice.
 * @returns {object} The SQL fragment and its parameters.
 * @example
 * const { sql, params } = buildSliceBounds(0, 10, Date.now(), 1000);
 */
function buildSliceBounds(index, numberOfSlices, startTime, stepInMs) {
  const conditions = [];
  const params = [];
  if (index > 0) {
    conditions.push('created_at >= CAST(? AS TIMESTAMPTZ)');
    params.push(new Date(startTime + index * stepInMs).toISOString());
  }
  if (index < numberOfSlices - 1) {
    conditions.push('created_at < CAST(? AS TIMESTAMPTZ)');
    params.push(new Date(startTime + (index + 1) * stepInMs).toISOString());
  }
  return { sql: conditions.length > 0 ? conditions.join(' AND ') : 'TRUE', params };
}

/**
 * @description Move the DuckDB history of the mapped features to their destination, and
 * delete every state left on the source features (overlap period and unmapped features).
 *
 * Both are done in `created_at` slices, all mapped features at once:
 * - one statement per feature over the whole table (the first implementation) allocated
 *   transaction memory proportional to the number of updated rows — which `memory_limit`
 *   does not bound and DuckDB cannot spill — and held the single write connection for the
 *   whole run. Slicing bounds that memory, reports real progress, and gives the live state
 *   inserts and the energy jobs the write connection back between two slices.
 * - moving every mapped feature in the same statement turns N passes over the history into
 *   one, which is where most of the wall-clock time went.
 *
 * The slices are cut in time, which only bounds the rows per statement when the history has
 * a roughly even density: a burst of states in one window, or a whole feature sharing a
 * single timestamp, would put everything back into one statement. So each statement also
 * carries a hard cardinality cap (`rowid IN (SELECT … LIMIT n)`) and is repeated until the
 * slice is drained. In the even case the cap never triggers and costs nothing.
 * @param {Array} pairs - Array of { sourceFeature, destinationFeature }.
 * @param {Array} sourceFeatureIds - Ids of all the features of the source device.
 * @param {string} [jobId] - Id of the job.
 * @returns {Promise<number>} Resolve with the number of moved states.
 * @example
 * const moved = await moveDuckDbHistory.call(deviceManager, pairs, sourceFeatureIds, jobId);
 */
async function moveDuckDbHistory(pairs, sourceFeatureIds, jobId) {
  if (sourceFeatureIds.length === 0) {
    return 0;
  }
  const sourceIdsSql = sourceFeatureIds.map(uuidParam).join(',');
  const pairsWithCutoff = pairs.length > 0 ? await readDestinationCutoffs(pairs) : [];

  // Time range and volume of everything to move or delete, in one pass too.
  const [{ min_date: minDate, max_date: maxDate, count }] = await db.duckDbReadConnectionAllAsync(
    `SELECT MIN(created_at) AS min_date, MAX(created_at) AS max_date, COUNT(*) AS count
     FROM t_device_feature_state WHERE device_feature_id IN (${sourceIdsSql})`,
    ...sourceFeatureIds,
  );
  const numberOfStates = Number(count);
  if (numberOfStates === 0) {
    return 0;
  }

  const numberOfSlices = Math.min(
    this.DUCKDB_STATES_MIGRATE_MAX_TIME_SLICES,
    Math.max(1, Math.ceil(numberOfStates / this.DUCKDB_STATES_MIGRATE_STATES_PER_SLICE)),
  );
  const startTime = new Date(minDate).getTime();
  const stepInMs = (new Date(maxDate).getTime() - startTime) / numberOfSlices;
  logger.info(`Migration: moving ${numberOfStates} DuckDB states in ${numberOfSlices} slices.`);

  // `SET device_feature_id = CASE source THEN destination ... END` re-points every mapped
  // feature in one statement; the WHERE keeps each source feature below its own cutoff.
  const caseSql = pairsWithCutoff.map(() => `WHEN ${uuidParam()} THEN ${uuidParam()}`).join(' ');
  const caseParams = pairsWithCutoff.flatMap(({ sourceFeature, destinationFeature }) => [
    sourceFeature.id,
    destinationFeature.id,
  ]);
  const moveSql = pairsWithCutoff
    .map(({ cutoff }) =>
      cutoff === null
        ? `device_feature_id = ${uuidParam()}`
        : `(device_feature_id = ${uuidParam()} AND created_at < CAST(? AS TIMESTAMPTZ))`,
    )
    .join(' OR ');
  const moveParams = pairsWithCutoff.flatMap(({ sourceFeature, cutoff }) =>
    cutoff === null ? [sourceFeature.id] : [sourceFeature.id, cutoff],
  );

  // A statement never touches more than `cap` rows: it is repeated until it affects fewer
  // than that, which means the slice is drained. Termination is guaranteed — moved rows no
  // longer carry a source feature id, deleted rows are gone — and in an evenly spread
  // history the first statement already drains the slice.
  const cap = Math.max(1, Math.floor(this.DUCKDB_STATES_MIGRATE_STATES_PER_SLICE));
  const runCapped = async (query, params) => {
    let affected = cap;
    let total = 0;
    while (affected === cap) {
      // Sequential on purpose: the next statement works on what the previous one left.
      // eslint-disable-next-line no-await-in-loop
      const result = await db.duckDbWriteConnectionAllAsync(query, ...params);
      // DuckDB returns the number of affected rows
      affected = result && result[0] && result[0].Count !== undefined ? Number(result[0].Count) : 0;
      total += affected;
    }
    return total;
  };
  const moveSlice = (slice) =>
    runCapped(
      `UPDATE t_device_feature_state SET device_feature_id = CASE device_feature_id ${caseSql} END
       WHERE rowid IN (SELECT rowid FROM t_device_feature_state
                       WHERE ${slice.sql} AND (${moveSql}) LIMIT ${cap})`,
      [...caseParams, ...slice.params, ...moveParams],
    );
  // Whatever is left on a source feature is dropped: states of the overlap period (already
  // on the destination) and history of the unmapped features.
  const deleteSourceStatesOfSlice = (slice) =>
    runCapped(
      `DELETE FROM t_device_feature_state
       WHERE rowid IN (SELECT rowid FROM t_device_feature_state
                       WHERE ${slice.sql} AND device_feature_id IN (${sourceIdsSql}) LIMIT ${cap})`,
      [...slice.params, ...sourceFeatureIds],
    );

  let statesMigrated = 0;
  await Promise.each([...Array(numberOfSlices)], async (value, index) => {
    const slice = buildSliceBounds(index, numberOfSlices, startTime, stepInMs);
    const sliceStartedAt = Date.now();
    if (pairsWithCutoff.length > 0) {
      statesMigrated += await moveSlice(slice);
    }
    await deleteSourceStatesOfSlice(slice);
    const sliceDurationInMs = Date.now() - sliceStartedAt;
    await this.job.updateProgress(
      jobId,
      MOVE_PROGRESS_START + Math.round(((index + 1) / numberOfSlices) * (MOVE_PROGRESS_END - MOVE_PROGRESS_START)),
      { step: 'moving_states', states_migrated: statesMigrated },
    );
    // Duty cycle: pause about as long as the slice took, so the migration only uses a
    // fraction of the disk, the CPU and the single DuckDB write connection, and the
    // dashboards and energy computations stay usable while it runs.
    const pauseInMs = Math.max(
      sliceDurationInMs * this.DUCKDB_STATES_MIGRATE_PAUSE_FACTOR,
      this.DUCKDB_STATES_MIGRATE_MIN_PAUSE_IN_MS,
    );
    await Promise.delay(Math.min(pauseInMs, this.DUCKDB_STATES_MIGRATE_MAX_PAUSE_IN_MS));
  });

  // The source device keeps publishing while the migration runs. States written during
  // the run land after the last slice was cut, so they are picked up by the last slice
  // (no upper bound) — except the last few, written while that slice was being drained.
  // Replay the move on the last slice's bounds to catch them, rather than have the sweep
  // below delete history the mapping asked to keep. Cheap: bounded below, so DuckDB skips
  // everything but the tail of the table.
  if (pairsWithCutoff.length > 0) {
    statesMigrated += await moveSlice(buildSliceBounds(numberOfSlices - 1, numberOfSlices, startTime, stepInMs));
  }

  // Final unbounded sweep: a state back-dated into an already processed slice would
  // otherwise stay behind, and the destroy at the end of the migration counts the states
  // of the device before accepting to delete it. Such a state is dropped, not moved: it
  // cannot be caught without blocking the source device's writes for the whole migration.
  // The replay above leaves this to the rare back-dated write, not to normal polling.
  await deleteSourceStatesOfSlice({ sql: 'TRUE', params: [] });
  await this.job.updateProgress(jobId, MOVE_PROGRESS_END, { step: 'moving_states', states_migrated: statesMigrated });

  // Flush the WAL and release the delete-tracking memory of the moves/deletes.
  await db.duckDbWriteConnectionAllAsync('CHECKPOINT');
  return statesMigrated;
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
    // Published up front so the jobs page shows a counter from the start, and still shows
    // "0 states moved" when the history move returns early (no feature, or no state).
    states_migrated: 0,
  });

  // Move the DuckDB history of the mapped pairs, cut at the destination's oldest state so
  // the overlap period is never counted twice, and drop everything left on the source.
  const sourceFeatureIds = source.features.map((feature) => feature.id);
  const duckDbStatesMigrated = await moveDuckDbHistory.call(this, pairs, sourceFeatureIds, jobId);

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
