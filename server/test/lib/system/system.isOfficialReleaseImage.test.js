const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const System = require('../../../lib/system');
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
};

const ENV_KEYS = ['NODE_ENV', 'GLADYS_OFFICIAL_RELEASE_IMAGE'];

/**
 * @description Call the function with the given environment variables, then restore them.
 * Everything is synchronous, so no other test code can run with the modified environment.
 * @param {object} env - Environment variables to set (undefined to unset).
 * @param {Function} func - Function to call.
 * @returns {any} The result of the function.
 * @example
 * withEnv({ NODE_ENV: 'production' }, () => system.isOfficialReleaseImage());
 */
function withEnv(env, func) {
  const previousEnv = {};
  ENV_KEYS.forEach((key) => {
    previousEnv[key] = process.env[key];
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  });
  try {
    return func();
  } finally {
    ENV_KEYS.forEach((key) => {
      if (previousEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousEnv[key];
      }
    });
  }
}

describe('system.isOfficialReleaseImage', () => {
  let system;

  beforeEach(() => {
    system = new System(sequelize, event, config, job);
  });

  it('should be true in an official release image', () => {
    const result = withEnv({ NODE_ENV: 'production', GLADYS_OFFICIAL_RELEASE_IMAGE: 'true' }, () =>
      system.isOfficialReleaseImage(),
    );
    expect(result).to.equal(true);
  });

  it('should be false in a pull request, dev or local image', () => {
    const result = withEnv({ NODE_ENV: 'production', GLADYS_OFFICIAL_RELEASE_IMAGE: 'false' }, () =>
      system.isOfficialReleaseImage(),
    );
    expect(result).to.equal(false);
  });

  it('should be false when running in production outside of a Docker image', () => {
    const result = withEnv({ NODE_ENV: 'production', GLADYS_OFFICIAL_RELEASE_IMAGE: undefined }, () =>
      system.isOfficialReleaseImage(),
    );
    expect(result).to.equal(false);
  });

  it('should be false outside of production, even with the release image marker', () => {
    const result = withEnv({ NODE_ENV: 'development', GLADYS_OFFICIAL_RELEASE_IMAGE: 'true' }, () =>
      system.isOfficialReleaseImage(),
    );
    expect(result).to.equal(false);
  });

  it('should be false in the test environment', () => {
    expect(system.isOfficialReleaseImage()).to.equal(false);
  });
});
