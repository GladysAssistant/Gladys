const os = require('os');
const Sequelize = require('sequelize');
const { DuckDBInstance, DuckDBTimestampTZValue } = require('@duckdb/node-api');
const Umzug = require('umzug');
const Promise = require('bluebird');
const chunk = require('lodash.chunk');
const path = require('path');
const getConfig = require('../utils/getConfig');
const logger = require('../utils/logger');
const { formatDateInUTC } = require('../utils/date');

const config = getConfig();

// SQLite
const sequelize = new Sequelize('mainDB', null, null, config);

// Migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [sequelize.getQueryInterface(), Sequelize],
  },
  logging: logger.debug,
  storage: 'sequelize',
  storageOptions: {
    sequelize,
  },
});

const AreaModel = require('./area');
const CalendarModel = require('./calendar');
const CalendarEventModel = require('./calendar_event');
const DashboardModel = require('./dashboard');
const DeviceFeatureStateModel = require('./device_feature_state');
const DeviceFeatureAggregateModel = require('./device_feature_state_aggregate');
const DeviceFeatureModel = require('./device_feature');
const DeviceFeatureSupportedOptionModel = require('./device_feature_supported_option');
const DeviceParamModel = require('./device_param');
const DeviceModel = require('./device');
const EnergyPriceModel = require('./energy_price');
const HouseModel = require('./house');
const JobModel = require('./job');
const LifeEventModel = require('./life_event');
const LocationModel = require('./location');
const MessageModel = require('./message');
const PodModel = require('./pod');
const RoomModel = require('./room');
const SceneModel = require('./scene');
const ScriptModel = require('./script');
const ServiceModel = require('./service');
const SessionModel = require('./session');
const TagScene = require('./tag_scene');
const UserModel = require('./user');
const VariableModel = require('./variable');

const models = {
  Area: AreaModel(sequelize, Sequelize),
  Calendar: CalendarModel(sequelize, Sequelize),
  CalendarEvent: CalendarEventModel(sequelize, Sequelize),
  Dashboard: DashboardModel(sequelize, Sequelize),
  DeviceFeatureState: DeviceFeatureStateModel(sequelize, Sequelize),
  DeviceFeatureStateAggregate: DeviceFeatureAggregateModel(sequelize, Sequelize),
  DeviceFeature: DeviceFeatureModel(sequelize, Sequelize),
  DeviceFeatureSupportedOption: DeviceFeatureSupportedOptionModel(sequelize, Sequelize),
  DeviceParam: DeviceParamModel(sequelize, Sequelize),
  Device: DeviceModel(sequelize, Sequelize),
  EnergyPrice: EnergyPriceModel(sequelize, Sequelize),
  House: HouseModel(sequelize, Sequelize),
  Job: JobModel(sequelize, Sequelize),
  LifeEvent: LifeEventModel(sequelize, Sequelize),
  Location: LocationModel(sequelize, Sequelize),
  Message: MessageModel(sequelize, Sequelize),
  Pod: PodModel(sequelize, Sequelize),
  Room: RoomModel(sequelize, Sequelize),
  Scene: SceneModel(sequelize, Sequelize),
  Script: ScriptModel(sequelize, Sequelize),
  Service: ServiceModel(sequelize, Sequelize),
  Session: SessionModel(sequelize, Sequelize),
  TagScene: TagScene(sequelize, Sequelize),
  User: UserModel(sequelize, Sequelize),
  Variable: VariableModel(sequelize, Sequelize),
};

// Associate all model
// Run `.associate` if it exists,
// ie create relationships in the ORM
Object.values(models)
  .filter((model) => typeof model.associate === 'function')
  .forEach((model) => model.associate(models));

// DuckDB
const duckDbFilePath = `${config.storage.replace('.db', '')}.duckdb`;
// Configure DuckDB with memory limit to prevent excessive memory usage
// Default to 30% of system RAM, can be overridden via DUCKDB_MEMORY_LIMIT env var
const totalMemoryBytes = os.totalmem();
const defaultMemoryLimitBytes = Math.floor(totalMemoryBytes * 0.3);
const defaultMemoryLimitMB = Math.floor(defaultMemoryLimitBytes / (1024 * 1024));
const duckDbMemoryLimit = process.env.DUCKDB_MEMORY_LIMIT || `${defaultMemoryLimitMB}MB`;

// The DuckDB Node "Neo" API (@duckdb/node-api) replaces the deprecated `duckdb`
// package. It is fully asynchronous: the database instance and its connections
// have to be created with `await`. We open them lazily and cache the resulting
// promise so that every query waits for the same one-time initialization.
// This keeps the on-disk file format unchanged (same DuckDB engine version), so
// existing `.duckdb` files stay fully compatible.
let duckDbInstance;
let duckDbWriteConnection;
let duckDbReadConnection;
let duckDbWriteQueue;
let duckDbReadQueue;
let duckDbInitPromise = null;

// Serialize statement execution per connection. The Neo API can raise a
// "Failed to execute prepared statement" error when several statements run
// concurrently on the same connection, so — like the old `duckdb` package did
// internally — we queue statements and run them one at a time. The read and write
// connections keep their own independent queue, so reads and writes still run in
// parallel with each other.
const createSerialQueue = () => {
  // `tail` always resolves (never rejects) once the previously queued task has
  // settled, so a failing task never blocks the ones queued after it.
  let tail = Promise.resolve();
  return (task) => {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => {
      release = resolve;
    });
    const run = async () => {
      try {
        await previous;
      } catch (previousError) {
        // Ignore the previous task's failure: it is already reported to its own caller.
      }
      try {
        return await task();
      } finally {
        release();
      }
    };
    return run();
  };
};

const initializeDuckDb = async () => {
  duckDbInstance = await DuckDBInstance.create(duckDbFilePath, {
    memory_limit: duckDbMemoryLimit,
  });
  duckDbWriteConnection = await duckDbInstance.connect();
  duckDbReadConnection = await duckDbInstance.connect();
  duckDbWriteQueue = createSerialQueue();
  duckDbReadQueue = createSerialQueue();
  logger.info(
    `DuckDB initialized with memory_limit=${duckDbMemoryLimit} (system RAM: ${Math.floor(
      totalMemoryBytes / (1024 * 1024),
    )}MB)`,
  );
};

const ensureDuckDbInitialized = () => {
  if (duckDbInitPromise === null) {
    const initPromise = (async () => {
      try {
        await initializeDuckDb();
      } catch (initError) {
        // Clear the cached promise on failure so a later call can retry after a
        // transient error, instead of staying stuck on the rejected promise. Only
        // reset if no other initialization has started in the meantime.
        if (duckDbInitPromise === initPromise) {
          duckDbInitPromise = null;
        }
        throw initError;
      }
    })();
    duckDbInitPromise = initPromise;
  }
  return duckDbInitPromise;
};

// Convert a legacy positional parameter (plain JS value, as accepted by the old
// `duckdb` package) into a value the Neo API can bind. Only `Date` needs special
// handling: the new API cannot infer a type for a raw JS Date, so we wrap it into
// a DuckDB TIMESTAMPTZ value (microseconds since the Unix epoch). Every other type
// (string, number, boolean, bigint, null) is bound as-is.
const toDuckDbParam = (param) => {
  if (param instanceof Date) {
    return new DuckDBTimestampTZValue(BigInt(param.getTime()) * 1000n);
  }
  return param;
};

// The old `duckdb` package accepted parameters either as a variadic list
// (`all(sql, p1, p2)`) or as a single array (`all(sql, [p1, p2])`, typically used
// together with `$1`/`$2` numbered placeholders). The Neo API only takes an array,
// so we normalize both calling conventions to a single array of parameters.
const normalizeParams = (params) => {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
};

// Run a query on the given connection and return plain JS row objects, matching
// the exact shape returned by the old `duckdb` package (Date for TIMESTAMPTZ,
// string for UUID, number for DOUBLE, BigInt for BIGINT/COUNT...). Using
// `getRowObjectsJS()` guarantees that the values keep their legacy JS types so
// that no downstream code needs to change.
const runDuckDbQuery = async (getConnection, getQueue, query, params) => {
  await ensureDuckDbInitialized();
  const mappedParams = normalizeParams(params).map(toDuckDbParam);
  return getQueue()(async () => {
    const reader = await getConnection().runAndReadAll(query, mappedParams);
    return reader.getRowObjectsJS();
  });
};

const duckDbWriteConnectionAllAsync = (query, ...params) =>
  runDuckDbQuery(
    () => duckDbWriteConnection,
    () => duckDbWriteQueue,
    query,
    params,
  );
const duckDbReadConnectionAllAsync = (query, ...params) =>
  runDuckDbQuery(
    () => duckDbReadConnection,
    () => duckDbReadQueue,
    query,
    params,
  );

// Close all DuckDB connections and the database instance. Safe to call multiple
// times and before initialization has completed.
const duckDbClose = async () => {
  if (duckDbInitPromise !== null) {
    // Make sure a pending initialization is settled before closing (ignore its error).
    try {
      await duckDbInitPromise;
    } catch (initError) {
      // The initialization already reported its own error; nothing to close if it failed.
    }
  }
  if (duckDbReadConnection) {
    duckDbReadConnection.disconnectSync();
  }
  if (duckDbWriteConnection) {
    duckDbWriteConnection.disconnectSync();
  }
  if (duckDbInstance) {
    duckDbInstance.closeSync();
  }
};

const duckDbCreateTableIfNotExist = async () => {
  logger.info(`DuckDB - Creating database table if not exist`);
  await duckDbWriteConnectionAllAsync(`
    CREATE TABLE IF NOT EXISTS t_device_feature_state (
        device_feature_id UUID,
        value DOUBLE,
        created_at TIMESTAMPTZ
    );
  `);
};

const duckDbInsertState = async (deviceFeatureId, value, createdAt) => {
  const createdAtInString = formatDateInUTC(createdAt);
  await duckDbWriteConnectionAllAsync(
    'INSERT INTO t_device_feature_state VALUES (?, ?, ?)',
    deviceFeatureId,
    value,
    createdAtInString,
  );
};

const duckDbUpdateState = async (deviceFeatureId, value, createdAt) => {
  const createdAtInString = formatDateInUTC(createdAt);
  await duckDbWriteConnectionAllAsync(
    'UPDATE t_device_feature_state SET value = ? WHERE device_feature_id = ? AND created_at = ?',
    value,
    deviceFeatureId,
    createdAtInString,
  );
};

const duckDbBatchInsertState = async (deviceFeatureId, states) => {
  const chunks = chunk(states, 10000);
  await Promise.each(chunks, async (oneStatesChunk, chunkIndex) => {
    let queryString = `INSERT INTO t_device_feature_state (device_feature_id, value, created_at) VALUES `;
    const queryParams = [];
    oneStatesChunk.forEach((state, index) => {
      if (index > 0) {
        queryString += `,`;
      }
      queryString += '(?, ?, ?)';
      queryParams.push(deviceFeatureId);
      queryParams.push(state.value);
      queryParams.push(formatDateInUTC(state.created_at));
    });
    logger.info(`DuckDB : Inserting chunk ${chunkIndex} for deviceFeature = ${deviceFeatureId}.`);
    await duckDbWriteConnectionAllAsync(queryString, ...queryParams);
  });
};

const duckDbShowVersion = async () => {
  const result = await duckDbReadConnectionAllAsync('SELECT version() AS version;');
  logger.info(`DuckDB version = ${result[0].version}`);
  const memoryLimitResult = await duckDbReadConnectionAllAsync(
    "SELECT current_setting('memory_limit') AS memory_limit;",
  );
  logger.info(`DuckDB memory_limit = ${memoryLimitResult[0].memory_limit}`);
};

const duckDbSetTimezone = async (timezone) => {
  await duckDbWriteConnectionAllAsync('set timezone=?;', timezone);
};

/**
 * @description Create a separate DuckDB database instance for backup operations.
 * This opens the same database file but as a separate instance with its own buffer pool.
 * Closing this instance will release all memory used during the backup export.
 * @returns {Promise<object>} Object with allAsync and close methods.
 * @example
 * const backupDb = await duckDbCreateBackupInstance();
 * await backupDb.allAsync('EXPORT DATABASE ...');
 * await backupDb.close();
 */
const duckDbCreateBackupInstance = async () => {
  // Create a new database instance pointing to the same file
  // This instance has its own buffer pool that will be released when closed
  const backupDatabase = await DuckDBInstance.create(duckDbFilePath, {
    memory_limit: duckDbMemoryLimit,
    access_mode: 'READ_ONLY',
  });
  const connection = await backupDatabase.connect();
  const queue = createSerialQueue();
  const allAsync = (query, ...params) => {
    const mappedParams = normalizeParams(params).map(toDuckDbParam);
    return queue(async () => {
      const reader = await connection.runAndReadAll(query, mappedParams);
      return reader.getRowObjectsJS();
    });
  };
  const close = async () => {
    try {
      connection.disconnectSync();
    } catch (connErr) {
      logger.warn(`Error closing backup connection: ${connErr.message}`);
    }
    backupDatabase.closeSync();
  };
  return { allAsync, close };
};

const db = {
  ...models,
  sequelize,
  umzug,
  // The DuckDB instance and connections are created asynchronously and lazily,
  // so they are exposed through getters that always return the current value.
  get duckDb() {
    return duckDbInstance;
  },
  get duckDbWriteConnection() {
    return duckDbWriteConnection;
  },
  get duckDbReadConnection() {
    return duckDbReadConnection;
  },
  duckDbWriteConnectionAllAsync,
  duckDbReadConnectionAllAsync,
  duckDbClose,
  duckDbCreateTableIfNotExist,
  duckDbInsertState,
  duckDbUpdateState,
  duckDbBatchInsertState,
  duckDbShowVersion,
  duckDbSetTimezone,
  duckDbCreateBackupInstance,
};

// Start opening the DuckDB database right away so it is ready as soon as possible.
// Queries still await the same initialization promise, so this only warms it up.
ensureDuckDbInitialized().catch((e) => {
  logger.error(`DuckDB initialization failed: ${e.message}`);
});

module.exports = db;
