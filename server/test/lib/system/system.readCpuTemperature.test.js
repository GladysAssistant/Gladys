const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire').noCallThru();

const THERMAL_ZONE_DIR = '/sys/class/thermal';
const HWMON_DIR = '/sys/class/hwmon';

describe('readCpuTemperature', () => {
  let fsMock;
  let readCpuTemperature;
  let parseThermalValue;

  beforeEach(() => {
    fsMock = {
      readdirSync: sinon.stub(),
      readFileSync: sinon.stub(),
    };
    const mod = proxyquire('../../../lib/system/system.getInfos', {
      fs: fsMock,
    });
    readCpuTemperature = mod.readCpuTemperature;
    parseThermalValue = mod.parseThermalValue;
  });

  afterEach(() => {
    sinon.reset();
  });

  describe('parseThermalValue', () => {
    it('should parse valid millidegree value', () => {
      expect(parseThermalValue('42000')).to.equal(42);
    });

    it('should parse value with whitespace', () => {
      expect(parseThermalValue('  55500\n')).to.equal(55.5);
    });

    it('should return null for NaN', () => {
      expect(parseThermalValue('not-a-number')).to.equal(null);
    });

    it('should return null for zero', () => {
      expect(parseThermalValue('0')).to.equal(null);
    });

    it('should return null for negative value', () => {
      expect(parseThermalValue('-1000')).to.equal(null);
    });
  });

  describe('thermal_zone', () => {
    it('should return CPU temperature from zone with x86_pkg_temp type', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0', 'thermal_zone1']);
      fsMock.readFileSync
        .withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8')
        .returns('x86_pkg_temp');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('65000');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'type'), 'utf8').returns('cpu-thermal');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'temp'), 'utf8').returns('42000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(65);
    });

    it('should return temperature from zone with package type', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0']);
      fsMock.readFileSync
        .withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8')
        .returns('package-temp0');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('50000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(50);
    });

    it('should return temperature from zone with core type', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0']);
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8').returns('core0');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('48000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(48);
    });

    it('should return temperature from zone with soc type', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0']);
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8').returns('soc-thermal');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('51000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(51);
    });

    it('should skip non-CPU zones like wifi', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0', 'thermal_zone1']);
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8').returns('iwlwifi_1');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('40000');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'type'), 'utf8').returns('cpu-thermal');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'temp'), 'utf8').returns('55000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(55);
    });

    it('should use fallback when zone has no type file', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0']);
      fsMock.readFileSync
        .withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8')
        .throws(new Error('ENOENT'));
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('43000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(43);
    });

    it('should prefer CPU zone over fallback zone without type', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0', 'thermal_zone1']);
      fsMock.readFileSync
        .withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8')
        .throws(new Error('ENOENT'));
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('30000');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'type'), 'utf8').returns('cpu-thermal');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'temp'), 'utf8').returns('55000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(55);
    });

    it('should skip unreadable zone temp', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0', 'thermal_zone1']);
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8').returns('cpu-thermal');
      fsMock.readFileSync
        .withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8')
        .throws(new Error('EACCES'));
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'type'), 'utf8').returns('cpu-thermal');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone1', 'temp'), 'utf8').returns('47000');

      const temp = readCpuTemperature();
      expect(temp).to.equal(47);
    });

    it('should return null when all zones are non-CPU', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0']);
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8').returns('iwlwifi_1');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('40000');
      fsMock.readdirSync.withArgs(HWMON_DIR).throws(new Error('ENOENT'));

      const temp = readCpuTemperature();
      expect(temp).to.equal(null);
    });
  });

  describe('hwmon fallback', () => {
    beforeEach(() => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).throws(new Error('ENOENT'));
    });

    it('should return CPU temperature from hwmon with cpu label', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input', 'temp2_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').returns('38000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_label'), 'utf8').returns('GPU');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp2_input'), 'utf8').returns('52000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp2_label'), 'utf8').returns('CPU');

      const temp = readCpuTemperature();
      expect(temp).to.equal(52);
    });

    it('should return CPU temperature from hwmon with package label', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').returns('60000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_label'), 'utf8').returns('Package id 0');

      const temp = readCpuTemperature();
      expect(temp).to.equal(60);
    });

    it('should return CPU temperature from hwmon with core label', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').returns('45000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_label'), 'utf8').returns('Core 0');

      const temp = readCpuTemperature();
      expect(temp).to.equal(45);
    });

    it('should use fallback when no CPU label found', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').returns('39000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_label'), 'utf8').throws(new Error('ENOENT'));

      const temp = readCpuTemperature();
      expect(temp).to.equal(39);
    });

    it('should stop scanning hwmons once CPU temp is found', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0', 'hwmon1']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').returns('62000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_label'), 'utf8').returns('CPU');
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon1')).returns(['temp1_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon1', 'temp1_input'), 'utf8').returns('99000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon1', 'temp1_label'), 'utf8').returns('CPU');

      const temp = readCpuTemperature();
      expect(temp).to.equal(62);
    });

    it('should stop scanning files once CPU temp is found in same hwmon', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input', 'temp2_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').returns('58000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_label'), 'utf8').returns('Core 0');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp2_input'), 'utf8').returns('70000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp2_label'), 'utf8').returns('Core 1');

      const temp = readCpuTemperature();
      expect(temp).to.equal(58);
    });

    it('should skip unreadable hwmon input', () => {
      fsMock.readdirSync.withArgs(HWMON_DIR).returns(['hwmon0']);
      fsMock.readdirSync.withArgs(path.join(HWMON_DIR, 'hwmon0')).returns(['temp1_input', 'temp2_input']);
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp1_input'), 'utf8').throws(new Error('EACCES'));
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp2_input'), 'utf8').returns('44000');
      fsMock.readFileSync.withArgs(path.join(HWMON_DIR, 'hwmon0', 'temp2_label'), 'utf8').returns('CPU');

      const temp = readCpuTemperature();
      expect(temp).to.equal(44);
    });
  });

  describe('no sysfs available', () => {
    it('should return null when both thermal and hwmon are unavailable', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).throws(new Error('ENOENT'));
      fsMock.readdirSync.withArgs(HWMON_DIR).throws(new Error('ENOENT'));

      const temp = readCpuTemperature();
      expect(temp).to.equal(null);
    });

    it('should return null when zones have no readable temp', () => {
      fsMock.readdirSync.withArgs(THERMAL_ZONE_DIR).returns(['thermal_zone0']);
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'type'), 'utf8').returns('cpu-thermal');
      fsMock.readFileSync.withArgs(path.join(THERMAL_ZONE_DIR, 'thermal_zone0', 'temp'), 'utf8').returns('invalid');
      fsMock.readdirSync.withArgs(HWMON_DIR).throws(new Error('ENOENT'));

      const temp = readCpuTemperature();
      expect(temp).to.equal(null);
    });
  });
});
