const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('gateway.backupHealth', () => {
  const event = {};
  const user = {};
  const brain = {};
  const message = {};

  let gateway;
  let variables;
  let variable;
  let clock;

  beforeEach(() => {
    const job = {
      wrapper: (type, func) => func,
      updateProgress: fake.resolves({}),
    };
    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    const scheduler = {
      scheduleJob: (rule, callback) => ({ callback, rule, cancel: () => {} }),
    };
    // an in-memory store of the system variables
    variables = new Map([[SYSTEM_VARIABLE_NAMES.TIMEZONE, 'Europe/Paris']]);
    variable = {
      getValue: sinon.stub().callsFake(async (name) => (variables.has(name) ? variables.get(name) : null)),
      setValue: sinon.stub().callsFake(async (name, value) => {
        variables.set(name, value);
      }),
      destroy: sinon.stub().callsFake(async (name) => {
        variables.delete(name);
      }),
    };
    user.getByRole = fake.resolves([
      { language: 'fr', selector: 'toto-fr' },
      { language: 'en', selector: 'toto-en' },
    ]);
    message.sendSystemMessage = fake.resolves(null);
    brain.getReply = sinon.stub().callsFake((language, intent) => `${language}:${intent}`);

    gateway = new Gateway(variable, event, {}, {}, getConfig(), user, {}, {}, job, scheduler, message, brain);
    // 03:30 in Paris
    clock = sinon.useFakeTimers(new Date('2024-01-05T02:30:00.000Z'));
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  describe('getBackupHealth', () => {
    it('should return an empty health when nothing was saved', async () => {
      const health = await gateway.getBackupHealth();
      expect(health).to.deep.equal({
        last_success_at: null,
        failing_since: null,
        last_error: null,
        alert_sent_at: null,
      });
    });

    it('should return the saved health', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, '2024-01-01T02:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, '2024-01-02T02:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, 'Error: boom');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, '2024-01-03T02:00:00.000Z');
      const health = await gateway.getBackupHealth();
      expect(health).to.deep.equal({
        last_success_at: '2024-01-01T02:00:00.000Z',
        failing_since: '2024-01-02T02:00:00.000Z',
        last_error: 'Error: boom',
        alert_sent_at: '2024-01-03T02:00:00.000Z',
      });
    });
  });

  describe('recordBackupSuccess', () => {
    it('should save the success and close the failure streak without any message', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, '2024-01-04T02:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, 'Error: boom');

      await gateway.recordBackupSuccess();

      expect(await gateway.getBackupHealth()).to.deep.equal({
        last_success_at: '2024-01-05T02:30:00.000Z',
        failing_since: null,
        last_error: null,
        alert_sent_at: null,
      });
      assert.notCalled(message.sendSystemMessage);
    });

    it('should save the given date of the backup', async () => {
      await gateway.recordBackupSuccess(new Date('2024-01-04T02:10:00.000Z'));
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT)).to.equal(
        '2024-01-04T02:10:00.000Z',
      );
    });

    it('should tell the admins that backups work again when they had been alerted', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, '2024-01-02T02:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, 'Error: boom');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, '2024-01-03T02:00:00.000Z');

      await gateway.recordBackupSuccess();

      expect(await gateway.getBackupHealth()).to.deep.equal({
        last_success_at: '2024-01-05T02:30:00.000Z',
        failing_since: null,
        last_error: null,
        alert_sent_at: null,
      });
      assert.calledTwice(message.sendSystemMessage);
      assert.calledWith(brain.getReply, 'fr', 'backup.recovered', {
        failingSinceDate: null,
        lastSuccessDate: new Date('2024-01-05T02:30:00.000Z').toLocaleString('fr', { timeZone: 'Europe/Paris' }),
        errorMessage: null,
      });
      assert.calledWithExactly(message.sendSystemMessage, 'toto-fr', 'fr:backup.recovered', null, {
        messageType: 'notification',
      });
      assert.calledWithExactly(message.sendSystemMessage, 'toto-en', 'en:backup.recovered', null, {
        messageType: 'notification',
      });
    });

    it('should never throw, the backup is already on Gladys Plus', async () => {
      variable.getValue = fake.rejects(new Error('db locked'));

      await gateway.recordBackupSuccess();

      assert.notCalled(message.sendSystemMessage);
    });

    it('should write in English to an admin whose language has no brain answers', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, '2024-01-03T02:00:00.000Z');
      user.getByRole = fake.resolves([{ language: 'de', selector: 'toto-de' }]);
      brain.getReply = sinon.stub().callsFake((language, intent) => {
        if (language === 'de') {
          throw new Error(`Answer with intent ${intent} and language ${language} not found`);
        }
        return `${language}:${intent}`;
      });

      await gateway.recordBackupSuccess();

      assert.calledWithExactly(message.sendSystemMessage, 'toto-de', 'en:backup.recovered', null, {
        messageType: 'notification',
      });
    });

    it('should not throw when no message can be built at all, and keep the alert open', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, '2024-01-03T02:00:00.000Z');
      brain.getReply = sinon.stub().throws(new Error('no answer at all'));

      await gateway.recordBackupSuccess();

      // the fallback to English was tried for each admin
      assert.callCount(brain.getReply, 4);
      assert.notCalled(message.sendSystemMessage);
      // nobody heard the end of the alert: the next success tells them
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(
        '2024-01-03T02:00:00.000Z',
      );
    });

    it('should keep the failure streak when the backup predates it (list of Gladys Plus after a restore)', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, '2024-01-03T02:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, 'Error: boom');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, '2024-01-04T02:00:00.000Z');

      await gateway.recordBackupSuccess(new Date('2024-01-02T02:00:00.000Z'));

      expect(await gateway.getBackupHealth()).to.deep.equal({
        last_success_at: '2024-01-02T02:00:00.000Z',
        failing_since: '2024-01-03T02:00:00.000Z',
        last_error: 'Error: boom',
        alert_sent_at: '2024-01-04T02:00:00.000Z',
      });
      assert.notCalled(message.sendSystemMessage);
    });

    it('should not move the last success back in time', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, '2024-01-04T02:00:00.000Z');

      await gateway.recordBackupSuccess(new Date('2024-01-03T02:00:00.000Z'));

      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT)).to.equal(
        '2024-01-04T02:00:00.000Z',
      );
    });

    it('should tell the other admins when one cannot be reached', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, '2024-01-03T02:00:00.000Z');
      message.sendSystemMessage = sinon.stub().callsFake(async (selector) => {
        if (selector === 'toto-fr') {
          throw new Error('User not found');
        }
      });

      await gateway.recordBackupSuccess();

      assert.calledTwice(message.sendSystemMessage);
      assert.calledWith(message.sendSystemMessage, 'toto-en', 'en:backup.recovered');
    });
  });

  describe('recordBackupFailure', () => {
    it('should start the failure streak silently on the first failed night', async () => {
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT,
        new Date(Date.now() - DAY).toISOString(),
      );

      await gateway.recordBackupFailure('Error: boom');

      expect(await gateway.getBackupHealth()).to.deep.equal({
        last_success_at: '2024-01-04T02:30:00.000Z',
        failing_since: '2024-01-05T02:30:00.000Z',
        last_error: 'Error: boom',
        alert_sent_at: null,
      });
      assert.notCalled(message.sendSystemMessage);
      assert.notCalled(user.getByRole);
    });

    it('should keep the start of the streak and update the error on the next failure', async () => {
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT,
        new Date(Date.now() - DAY).toISOString(),
      );
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, '2024-01-04T12:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, 'Error: first');

      await gateway.recordBackupFailure('Error: second');

      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE)).to.equal(
        '2024-01-04T12:00:00.000Z',
      );
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR)).to.equal('Error: second');
      assert.notCalled(message.sendSystemMessage);
    });

    it('should alert the admins once no backup succeeded for two nights', async () => {
      const lastSuccessAt = new Date(Date.now() - 2 * DAY).toISOString();
      const failingSince = new Date(Date.now() - DAY).toISOString();
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, lastSuccessAt);
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, failingSince);

      await gateway.recordBackupFailure('Error: boom');

      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(
        '2024-01-05T02:30:00.000Z',
      );
      assert.calledWith(brain.getReply, 'fr', 'backup.failing', {
        failingSinceDate: new Date(failingSince).toLocaleString('fr', { timeZone: 'Europe/Paris' }),
        lastSuccessDate: new Date(lastSuccessAt).toLocaleString('fr', { timeZone: 'Europe/Paris' }),
        errorMessage: 'Error: boom',
      });
      assert.calledWith(brain.getReply, 'en', 'backup.failing', {
        failingSinceDate: new Date(failingSince).toLocaleString('en', { timeZone: 'Europe/Paris' }),
        lastSuccessDate: new Date(lastSuccessAt).toLocaleString('en', { timeZone: 'Europe/Paris' }),
        errorMessage: 'Error: boom',
      });
      assert.calledWithExactly(message.sendSystemMessage, 'toto-fr', 'fr:backup.failing', null, {
        messageType: 'notification',
      });
      assert.calledWithExactly(message.sendSystemMessage, 'toto-en', 'en:backup.failing', null, {
        messageType: 'notification',
      });
    });

    it('should measure an instance that never backed up from its first failure', async () => {
      variables.delete(SYSTEM_VARIABLE_NAMES.TIMEZONE);
      const failingSince = new Date(Date.now() - 37 * HOUR).toISOString();
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, failingSince);

      await gateway.recordBackupFailure('Error: boom');

      assert.calledWith(brain.getReply, 'en', 'backup.failing', {
        failingSinceDate: new Date(failingSince).toLocaleString('en', { timeZone: undefined }),
        lastSuccessDate: null,
        errorMessage: 'Error: boom',
      });
      assert.calledTwice(message.sendSystemMessage);
    });

    it('should alert an instance that never backed up on its second failed night, not at the daytime catch-up', async () => {
      await gateway.recordBackupFailure('Error: boom');
      // the daytime catch-up of the same day
      clock.tick(8 * HOUR);
      await gateway.recordBackupFailure('Error: boom');
      assert.notCalled(message.sendSystemMessage);
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(undefined);

      // the second night
      clock.tick(16 * HOUR);
      await gateway.recordBackupFailure('Error: boom');

      assert.calledTwice(message.sendSystemMessage);
      assert.calledWith(brain.getReply, 'en', 'backup.failing', {
        failingSinceDate: new Date('2024-01-05T02:30:00.000Z').toLocaleString('en', { timeZone: 'Europe/Paris' }),
        lastSuccessDate: null,
        errorMessage: 'Error: boom',
      });
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(
        '2024-01-06T02:30:00.000Z',
      );
    });

    it('should redact the backup passphrase from the error before saving and sending it', async () => {
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT,
        new Date(Date.now() - 2 * DAY).toISOString(),
      );
      const error = "Error: Command failed: openssl enc -aes-256-cbc -pass pass:my-secret-key -in 'a.tar.gz'";

      await gateway.recordBackupFailure(error);

      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR)).to.equal(
        "Error: Command failed: openssl enc -aes-256-cbc -pass pass:*** -in 'a.tar.gz'",
      );
      expect(brain.getReply.firstCall.args[2].errorMessage).to.not.include('my-secret-key');
      expect(brain.getReply.firstCall.args[2].errorMessage).to.include('pass:***');
    });

    it('should not mark the alert as sent when no admin received it', async () => {
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT,
        new Date(Date.now() - 2 * DAY).toISOString(),
      );
      message.sendSystemMessage = fake.rejects(new Error('channel down'));

      await gateway.recordBackupFailure('Error: boom');

      assert.calledTwice(message.sendSystemMessage);
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(undefined);

      // the next check tries again
      message.sendSystemMessage = fake.resolves(null);
      clock.tick(DAY);
      await gateway.recordBackupFailure('Error: boom');
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(
        '2024-01-06T02:30:00.000Z',
      );
      expect(brain.getReply.lastCall.args[1]).to.equal('backup.failing');
    });

    it('should drop a failure recorded for a previous Gladys Plus link', async () => {
      const generation = gateway.subscriptionLinkGeneration;
      gateway.subscriptionLinkGeneration += 1;

      await gateway.recordBackupFailure('Error: boom', generation);

      assert.notCalled(variable.setValue);
      expect(variables.has(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE)).to.equal(false);
    });

    it('should run a success and a failure one after the other, in the order they came', async () => {
      await Promise.all([gateway.recordBackupFailure('Error: boom'), gateway.recordBackupSuccess()]);
      expect(variables.has(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE)).to.equal(false);

      await Promise.all([gateway.recordBackupSuccess(), gateway.recordBackupFailure('Error: boom')]);
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE)).to.equal(
        '2024-01-05T02:30:00.000Z',
      );
    });

    it('should not alert again within a week of the last alert', async () => {
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT,
        new Date(Date.now() - 5 * DAY).toISOString(),
      );
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE,
        new Date(Date.now() - 4 * DAY).toISOString(),
      );
      const alertSentAt = new Date(Date.now() - 3 * DAY).toISOString();
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, alertSentAt);

      await gateway.recordBackupFailure('Error: boom');

      assert.notCalled(message.sendSystemMessage);
      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(alertSentAt);
    });

    it('should remind the admins once a week while it keeps failing', async () => {
      const lastSuccessAt = new Date(Date.now() - 10 * DAY).toISOString();
      const failingSince = new Date(Date.now() - 9 * DAY).toISOString();
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, lastSuccessAt);
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, failingSince);
      variables.set(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT,
        new Date(Date.now() - 7 * DAY).toISOString(),
      );

      await gateway.recordBackupFailure('Error: boom');

      expect(variables.get(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT)).to.equal(
        '2024-01-05T02:30:00.000Z',
      );
      assert.calledWith(brain.getReply, 'fr', 'backup.still-failing', {
        failingSinceDate: new Date(failingSince).toLocaleString('fr', { timeZone: 'Europe/Paris' }),
        lastSuccessDate: new Date(lastSuccessAt).toLocaleString('fr', { timeZone: 'Europe/Paris' }),
        errorMessage: 'Error: boom',
      });
      assert.calledTwice(message.sendSystemMessage);
    });

    it('should never throw, the caller has a backup error to rethrow', async () => {
      variable.getValue = fake.rejects(new Error('db locked'));

      await gateway.recordBackupFailure('Error: boom');

      assert.notCalled(message.sendSystemMessage);
    });

    it('should send a whole month of failures as a handful of messages', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, new Date().toISOString());
      for (let night = 1; night <= 30; night += 1) {
        clock.tick(DAY);
        // eslint-disable-next-line no-await-in-loop
        await gateway.recordBackupFailure('Error: boom');
      }
      // the first alert on the second night, then one reminder a week
      expect(message.sendSystemMessage.callCount).to.equal(2 * 5);
      expect(brain.getReply.getCall(0).args[1]).to.equal('backup.failing');
      expect(brain.getReply.getCall(2).args[1]).to.equal('backup.still-failing');

      clock.tick(DAY);
      await gateway.recordBackupSuccess();
      expect(brain.getReply.lastCall.args[1]).to.equal('backup.recovered');
      expect(message.sendSystemMessage.callCount).to.equal(2 * 6);
    });
  });

  describe('getStatus', () => {
    it('should answer without the health of the backups when it cannot be read', async () => {
      variable.getValue = sinon.stub().callsFake(async (name) => {
        if (name.startsWith('GLADYS_GATEWAY_BACKUP_')) {
          throw new Error('db locked');
        }
        return null;
      });
      const status = await gateway.getStatus();
      expect(status).to.deep.equal({
        configured: false,
        connected: false,
        subscription_active: true,
        payment_required_since: null,
        backup_health: null,
      });
    });

    it('should expose the health of the backups', async () => {
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, '2024-01-04T02:00:00.000Z');
      variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, 'Error: boom');
      const status = await gateway.getStatus();
      expect(status.backup_health).to.deep.equal({
        last_success_at: null,
        failing_since: '2024-01-04T02:00:00.000Z',
        last_error: 'Error: boom',
        alert_sent_at: null,
      });
    });
  });
});
