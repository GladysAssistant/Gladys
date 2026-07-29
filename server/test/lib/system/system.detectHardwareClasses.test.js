const fs = require('fs');
const os = require('os');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.detectHardwareClasses', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should detect the present classes in a fake device tree', async () => {
    const devBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'gladys-dev-'));
    try {
      fs.mkdirSync(path.join(devBasePath, 'bus/usb'), { recursive: true });
      fs.mkdirSync(path.join(devBasePath, 'dri'));
      fs.writeFileSync(path.join(devBasePath, 'video0'), '');
      fs.writeFileSync(path.join(devBasePath, 'video1'), '');
      const classes = await system.detectHardwareClasses(devBasePath);
      expect(classes).to.deep.equal([
        { class: 'coral-usb', detected: true, paths: [path.join(devBasePath, 'bus/usb')] },
        { class: 'coral-pcie', detected: false, paths: [] },
        { class: 'gpu', detected: true, paths: [path.join(devBasePath, 'dri')] },
        {
          class: 'video',
          detected: true,
          paths: [path.join(devBasePath, 'video0'), path.join(devBasePath, 'video1')],
        },
      ]);
    } finally {
      fs.rmSync(devBasePath, { recursive: true, force: true });
    }
  });

  it('should report every class as not detected when the device tree is unreadable', async () => {
    const classes = await system.detectHardwareClasses('/path/that/does/not/exist');
    classes.forEach((hardwareClass) => {
      expect(hardwareClass.detected).to.equal(false);
      expect(hardwareClass.paths).to.deep.equal([]);
    });
  });

  it('should scan the real /dev by default without failing', async () => {
    const classes = await system.detectHardwareClasses();
    expect(classes.map((hardwareClass) => hardwareClass.class)).to.deep.equal([
      'coral-usb',
      'coral-pcie',
      'gpu',
      'video',
    ]);
  });
});
