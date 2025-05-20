const sinon = require('sinon');

const { fake, assert } = sinon;

const System = require('../../../lib/system');
const Job = require('../../../lib/job');
const { SYSTEM_VARIABLE_NAMES, USER_ROLE } = require('../../../utils/constants');

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

describe('system.checkIfGladysUpgraded', () => {
  // Define admin users with different languages
  const frenchAdmin = {
    id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    language: 'fr',
    selector: 'french-admin',
    role: USER_ROLE.ADMIN,
  };
  const englishAdmin = {
    id: '7a137a56-069e-4996-8816-36558174b727',
    language: 'en',
    selector: 'english-admin',
    role: USER_ROLE.ADMIN,
  };
  const germanAdmin = {
    id: '5df52f35-f2f5-4c33-a6b8-24d5e3f9c8e8',
    language: 'de',
    selector: 'german-admin',
    role: USER_ROLE.ADMIN,
  };

  // Mock version information
  const previousVersion = 'v4.0.0';
  const currentVersion = 'v4.1.0';

  // Mock release notes
  const releaseNotes = {
    name: 'v4.1.0',
    fr_release_note_link: 'https://gladysassistant.com/fr/blog/release-notes-4-1-0',
    default_release_note_link: 'https://gladysassistant.com/en/blog/release-notes-4-1-0',
  };

  let system;
  let variableGetValueStub;
  let variableSetValueStub;
  let userGetByRoleStub;
  let brainGetReplyStub;
  let messageSendToUserStub;
  let gatewayGetLatestGladysVersionStub;

  beforeEach(() => {
    // Create stubs
    variableGetValueStub = sinon.stub();
    variableSetValueStub = sinon.stub().resolves(null);
    userGetByRoleStub = sinon.stub();
    brainGetReplyStub = sinon.stub();
    messageSendToUserStub = sinon.stub().resolves(null);
    gatewayGetLatestGladysVersionStub = sinon.stub().resolves(releaseNotes);

    // Initialize system
    system = new System(sequelize, event, config, job);

    // Setup system properties
    system.variable = {
      getValue: variableGetValueStub,
      setValue: variableSetValueStub,
    };
    system.user = {
      getByRole: userGetByRoleStub,
    };
    system.brain = {
      getReply: brainGetReplyStub,
    };
    system.message = {
      sendToUser: messageSendToUserStub,
    };
  });

  it('should send upgrade notifications to all admins with appropriate language when upgrade detected', async () => {
    // Setup stubs
    variableGetValueStub.resolves(previousVersion);
    userGetByRoleStub.resolves([frenchAdmin, englishAdmin, germanAdmin]);
    brainGetReplyStub.returns('Upgrade message');
    system.gladysVersion = currentVersion;

    const gateway = {
      getLatestGladysVersion: gatewayGetLatestGladysVersionStub,
    };

    // Execute function
    await system.checkIfGladysUpgraded(gateway, 0);

    // Verify variable was retrieved and set
    assert.calledOnceWithExactly(variableGetValueStub, SYSTEM_VARIABLE_NAMES.GLADYS_VERSION);
    assert.calledOnceWithExactly(variableSetValueStub, SYSTEM_VARIABLE_NAMES.GLADYS_VERSION, currentVersion);

    // Verify admins were fetched
    assert.calledOnceWithExactly(userGetByRoleStub, USER_ROLE.ADMIN);

    // Verify messages were sent to each admin
    assert.callCount(messageSendToUserStub, 6); // 3 admins × 2 messages each (upgrade message + release note)

    // Verify brain.getReply was called for each admin with correct language
    assert.calledWith(brainGetReplyStub, 'fr', 'gladys-upgraded.success', {
      previousGladysVersion: previousVersion,
      gladysVersion: currentVersion,
    });
    assert.calledWith(brainGetReplyStub, 'en', 'gladys-upgraded.success', {
      previousGladysVersion: previousVersion,
      gladysVersion: currentVersion,
    });
    assert.calledWith(brainGetReplyStub, 'de', 'gladys-upgraded.success', {
      previousGladysVersion: previousVersion,
      gladysVersion: currentVersion,
    });

    // Verify French admin received French release notes
    assert.calledWith(messageSendToUserStub, frenchAdmin.selector, releaseNotes.fr_release_note_link);

    // Verify English and German admins received default (English) release notes
    assert.calledWith(messageSendToUserStub, englishAdmin.selector, releaseNotes.default_release_note_link);
    assert.calledWith(messageSendToUserStub, germanAdmin.selector, releaseNotes.default_release_note_link);
  });

  it('should not send notifications when no upgrade detected', async () => {
    // Setup stubs for no upgrade scenario
    variableGetValueStub.resolves(currentVersion);
    system.gladysVersion = currentVersion;

    const gateway = {
      getLatestGladysVersion: gatewayGetLatestGladysVersionStub,
    };

    // Execute function
    await system.checkIfGladysUpgraded(gateway, 0);

    // Verify variable was retrieved but not set
    assert.calledOnceWithExactly(variableGetValueStub, SYSTEM_VARIABLE_NAMES.GLADYS_VERSION);
    assert.notCalled(variableSetValueStub);

    // Verify no messages were sent
    assert.notCalled(userGetByRoleStub);
    assert.notCalled(brainGetReplyStub);
    assert.notCalled(messageSendToUserStub);
  });

  it('should only send notifications once when called multiple times', async () => {
    // First call - with upgrade
    variableGetValueStub.onFirstCall().resolves(previousVersion);
    userGetByRoleStub.resolves([frenchAdmin, englishAdmin, germanAdmin]);
    brainGetReplyStub.returns('Upgrade message');
    system.gladysVersion = currentVersion;

    const gateway = {
      getLatestGladysVersion: gatewayGetLatestGladysVersionStub,
    };

    // Execute function first time
    await system.checkIfGladysUpgraded(gateway, 0);

    // Reset stubs for second call
    variableGetValueStub.reset();
    userGetByRoleStub.reset();
    brainGetReplyStub.reset();
    messageSendToUserStub.reset();
    gatewayGetLatestGladysVersionStub.reset();

    // Second call - version now matches (no upgrade)
    variableGetValueStub.resolves(currentVersion);

    // Execute function second time
    await system.checkIfGladysUpgraded(gateway, 0);

    // Verify second call didn't send notifications
    assert.calledOnce(variableGetValueStub);
    assert.notCalled(userGetByRoleStub);
    assert.notCalled(brainGetReplyStub);
    assert.notCalled(messageSendToUserStub);
  });

  it('should handle errors gracefully', async () => {
    // Setup stubs to throw error
    variableGetValueStub.rejects(new Error('Database error'));

    const gateway = {
      getLatestGladysVersion: gatewayGetLatestGladysVersionStub,
    };

    // Execute function
    await system.checkIfGladysUpgraded(gateway, 0);

    // Verify no messages were sent
    assert.notCalled(userGetByRoleStub);
    assert.notCalled(brainGetReplyStub);
    assert.notCalled(messageSendToUserStub);
  });
});
