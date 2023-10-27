const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

const proxyquire = require('proxyquire').noCallThru();

const { fake } = require('sinon');

const mockPassword = require('../mockPassword');

const configureContainerNodeRed = proxyquire('../../../../services/node-red/lib/configureContainer', {
  '../../../utils/password': mockPassword,
});

const NodeRedManager = proxyquire('../../../../services/node-red/lib', {
  './configureContainer': configureContainerNodeRed,
});

const { DEFAULT } = require('../../../../services/node-red/lib/constants');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const basePathOnContainer = path.join(__dirname, 'container');

describe('NodeRed configureContainer', () => {
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      system: {
        getGladysBasePath: fake.resolves({ basePathOnContainer }),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, null, serviceId);
  });

  afterEach(() => {
    fs.rmSync(basePathOnContainer, { force: true, recursive: true });
  });

  it('it should write default file', async () => {
    const config = {
      key: 'value',
    };
    await nodeRedManager.configureContainer(config);
    // Check that file has been created with defaults
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(
      fs.readFileSync(path.join(__dirname, '../expectedDefaultContent.txt'), 'utf8').toString(),
    );
  });

  it('it should not override existing configuration file', async () => {
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    const customConfigContent = 'content: custom';
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), customConfigContent);
    const config = {
      key: 'value',
    };

    await nodeRedManager.configureContainer(config);

    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(customConfigContent);
  });

  it('it should only add credentials', async () => {
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    const config = {
      nodeRedUsername: 'username',
      nodeRedPassword: 'password',
    };

    await nodeRedManager.configureContainer(config);

    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(
      fs.readFileSync(path.join(__dirname, '../expectedNodeRedContent.txt'), 'utf8').toString(),
    );
  });

  it('it should override credentials', async () => {
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    const config = {
      nodeRedUsername: 'other-username',
      nodeRedPassword: 'other-password',
    };

    await nodeRedManager.configureContainer(config);

    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(
      fs.readFileSync(path.join(__dirname, '../expectedOtherNodeRedContent.txt'), 'utf8').toString(),
    );
  });
});
