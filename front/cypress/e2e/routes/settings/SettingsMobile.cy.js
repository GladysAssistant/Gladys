// The settings sub-pages on a phone (docs/specs/mobile-pages/settings-pages.md): sessions,
// services, background jobs, backups and system. The lists are stubbed so the rows are known and
// nothing real is revoked, stopped, restored or restarted. The Open API keys page only exists in
// a Gladys Plus build (its route is compiled out here): it is checked in a phone emulation.
describe('Settings on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1${path}`;
  const DESKTOP = [1280, 800];
  const minutesAgo = minutes => new Date(Date.now() - minutes * 60 * 1000).toISOString();
  // the format of the dates of the jobs: "2023-01-23 14:20:23.594 +00:00"
  const jobDate = minutes =>
    minutesAgo(minutes)
      .replace('T', ' ')
      .replace('Z', ' +00:00');

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  // First in the file: its update test receives a websocket message, and the sockets of the pages
  // loaded earlier in a spec stay open in the Cypress browser — past about fifteen page loads the
  // socket of a new page no longer connects, so a message sent then reaches nothing.
  describe('System', () => {
    const systemInfos = {
      hostname: 'gladys',
      type: 'Linux',
      platform: 'linux',
      arch: 'arm64',
      uptime: 86400,
      nodejs_version: 'v24.0.0',
      gladys_version: 'v5.3.3',
      latest_gladys_version: 'v5.4.0',
      new_release_available: true,
      is_docker: true,
      docker_image_pinned: false,
      local_ip: '192.168.1.42',
      cpu_temperature: 51,
      host_power_reboot_available: true,
      host_power_shutdown_available: true
    };
    const containers = [
      { id: 'cy-c1', name: '/gladys', state: 'running', created_at: Math.round(Date.now() / 1000) - 86400 },
      { id: 'cy-c2', name: '/watchtower', state: 'exited', created_at: Math.round(Date.now() / 1000) - 3600 }
    ];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/system/info') }, { body: systemInfos }).as('getInfos');
      cy.intercept({ method: 'GET', url: api('/system/container') }, { body: containers }).as('getContainers');
      cy.intercept({ method: 'POST', url: api('/system/upgrade') }, { body: { success: true } }).as('upgrade');
      cy.intercept({ method: 'POST', url: api('/system/vacuum') }, { body: { success: true } }).as('vacuum');
      cy.intercept({ method: 'POST', url: api('/system/reboot') }, { body: { success: true } }).as('reboot');
    });

    it('should show the state of the instance and its containers as rows', () => {
      cy.visit('/dashboard/settings/system');
      cy.wait('@getInfos');
      cy.get('[data-cy=system-mobile]').should('exist');
      cy.get('[data-cy=system-status]')
        .should('contain', '192.168.1.42')
        .and('contain', 'v5.3.3')
        .and('contain', '51');
      cy.get('[data-cy=system-containers]')
        .should('contain', '/gladys')
        .and('contain', '/watchtower');
      cy.get('[data-cy=system-containers]').i18n('systemSettings.containerState.exited');
      // the fields of the cards do not trigger the iOS zoom
      cy.get('[data-cy=system-preferences] input[type=text], [data-cy=system-preferences] select').each(field => {
        expect(parseFloat(field.css('font-size'))).to.be.gte(16);
      });
      // nothing scrolls sideways
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.lte(doc.documentElement.clientWidth));
    });

    it('should update Gladys only once confirmed', () => {
      cy.visit('/dashboard/settings/system');
      cy.wait('@getInfos');
      cy.get('[data-cy=system-operations]').should('contain', 'v5.4.0');
      cy.get('[data-cy=system-update-now]').click();
      cy.get('[data-cy=system-update-confirm]').should('be.visible');
      cy.get('[data-cy=system-update-confirm] [data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=system-update-confirm]').should('not.exist');
      cy.get('@upgrade.all').should('have.length', 0);

      cy.get('[data-cy=system-update-now]').click();
      cy.get('[data-cy=system-update-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@upgrade');
      cy.get('[data-cy=system-upgrade-in-progress]').i18n('systemSettings.upgradeInProgress');
      cy.get('[data-cy=system-update-now]').should('be.disabled');

      // the messages of the update are readable in the page
      cy.sendWebSocket({ type: 'system.watchtower-log', payload: { message: 'Found new gladys image' } });
      cy.get('[data-cy=system-upgrade-logs]').should('contain', 'Found new gladys image');
    });

    it('should clean the database and reboot the host only once confirmed', () => {
      cy.visit('/dashboard/settings/system');
      cy.wait('@getInfos');
      cy.get('[data-cy=system-vacuum]').click();
      cy.get('[data-cy=system-vacuum-confirm]').should('be.visible');
      cy.get('@vacuum.all').should('have.length', 0);
      cy.get('[data-cy=system-vacuum-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@vacuum');
      cy.get('[data-cy=system-maintenance]').i18n('systemSettings.vacuumDatabaseStarted');

      cy.contains('[data-cy=system-maintenance] button', 'systemSettings.hostRebootButton').click();
      cy.get('[data-cy=system-host-power-confirm]')
        .should('be.visible')
        .i18n('systemSettings.hostRebootConfirm');
      cy.get('@reboot.all').should('have.length', 0);
      cy.get('[data-cy=system-host-power-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@reboot');
      cy.get('[data-cy=system-maintenance]').i18n('systemSettings.hostRebootSent');
    });

    it('should keep the tiles and the cards on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit('/dashboard/settings/system');
      cy.wait('@getInfos');
      cy.get('.stamp').should('have.length.gte', 5);
      cy.get('[data-cy=system-mobile]').should('not.exist');
    });
  });

  describe('Sessions', () => {
    const CURRENT_SESSION_ID = 'cy-current-session';
    const sessions = [
      {
        id: 'cy-phone-session',
        token_type: 'refresh_token',
        scope: ['dashboard:write'],
        useragent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        created_at: minutesAgo(60 * 24 * 3)
      },
      {
        id: CURRENT_SESSION_ID,
        token_type: 'refresh_token',
        scope: ['dashboard:write'],
        useragent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        created_at: minutesAgo(5)
      },
      {
        id: 'cy-unknown-session',
        token_type: 'refresh_token',
        scope: ['dashboard:write'],
        useragent: null,
        created_at: minutesAgo(60 * 24 * 30)
      },
      {
        id: 'cy-api-key-session',
        token_type: 'api_key',
        scope: ['dashboard:write'],
        useragent: null,
        created_at: minutesAgo(60 * 24 * 90)
      }
    ];

    beforeEach(() => {
      // the session of this browser is one of the stubbed rows
      cy.then(() => {
        const user = JSON.parse(window.localStorage.getItem('user'));
        window.localStorage.setItem('user', JSON.stringify({ ...user, session_id: CURRENT_SESSION_ID }));
      });
      cy.intercept({ method: 'GET', url: api('/session') }, { body: sessions }).as('getSessions');
      cy.intercept({ method: 'POST', url: api('/session/*/revoke') }, { body: { success: true } }).as('revokeSession');
    });

    it('should list the sessions as rows, this device first', () => {
      cy.visit('/dashboard/settings/session');
      cy.wait('@getSessions');
      cy.get('[data-cy=sessions-mobile]').should('exist');
      cy.get('table').should('not.exist');
      cy.get('[data-cy=session-row]').should('have.length', 4);
      cy.get('[data-cy=session-row]')
        .eq(0)
        .should('contain', 'Chrome · Apple Mac')
        .find('[data-cy=session-current-pill]')
        .should('exist');
      cy.get('[data-cy=session-row]')
        .eq(1)
        .should('contain', 'Safari · iPhone');
      cy.get('[data-cy=session-row]')
        .eq(2)
        .i18n('sessionsSettings.unknowDevice');
      cy.get('[data-cy=session-row]')
        .eq(3)
        .i18n('sessionsSettings.apiKey');
      // a revoke button is a 44px target
      cy.get('[data-cy=session-revoke]')
        .first()
        .invoke('outerHeight')
        .should('be.gte', 44);
    });

    it('should revoke a session only once confirmed', () => {
      cy.visit('/dashboard/settings/session');
      cy.wait('@getSessions');
      cy.get('[data-cy=session-revoke]')
        .eq(1)
        .click();
      cy.get('[data-cy=session-revoke-confirm]')
        .should('be.visible')
        .and('contain', 'Safari · iPhone');
      cy.get('[data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=session-revoke-confirm]').should('not.exist');
      cy.get('[data-cy=session-row]').should('have.length', 4);
      cy.get('@revokeSession.all').should('have.length', 0);

      cy.get('[data-cy=session-revoke]')
        .eq(1)
        .click();
      cy.get('[data-cy=confirm-sheet-confirm]').click();
      cy.wait('@revokeSession')
        .its('request.url')
        .should('include', '/session/cy-phone-session/revoke');
      cy.get('[data-cy=session-revoked-toast]').i18n('sessionsSettings.mobile.revoked');
      cy.get('[data-cy=session-row]').should('have.length', 3);
      cy.get('[data-cy=sessions-mobile]').should('not.contain', 'Safari · iPhone');
    });

    it('should keep the session in the list when its revocation fails', () => {
      cy.intercept({ method: 'POST', url: api('/session/*/revoke') }, { statusCode: 500, body: {} }).as('revokeFails');
      cy.visit('/dashboard/settings/session');
      cy.wait('@getSessions');
      cy.get('[data-cy=session-revoke]')
        .eq(3)
        .click();
      cy.get('[data-cy=session-revoke-confirm]').i18n('sessionsSettings.mobile.revokeApiKeyText');
      cy.get('[data-cy=confirm-sheet-confirm]').click();
      cy.wait('@revokeFails');
      cy.get('[data-cy=session-revoke-confirm]').i18n('sessionsSettings.mobile.revokeError');
      cy.get('[data-cy=session-row]').should('have.length', 4);
    });

    it('should keep the table on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit('/dashboard/settings/session');
      cy.wait('@getSessions');
      cy.get('table tbody tr').should('have.length', 4);
      cy.get('[data-cy=sessions-mobile]').should('not.exist');
    });
  });

  describe('Services', () => {
    const service = (name, status) => ({ id: `cy-${name}`, name, selector: name, status, pod_id: null });
    const services = [
      service('mqtt', 'RUNNING'),
      service('tasmota', 'STOPPED'),
      service('usb', 'DISABLED'),
      service('zigbee2mqtt', 'ERROR')
    ];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/service*') }, { body: services }).as('getServices');
      cy.intercept({ method: 'POST', url: api('/service/mqtt/stop') }, { body: service('mqtt', 'STOPPED') }).as(
        'stopMqtt'
      );
    });

    it('should list, search and filter the services', () => {
      cy.visit('/dashboard/settings/service');
      cy.wait('@getServices');
      cy.get('[data-cy=services-mobile]').should('exist');
      cy.get('table').should('not.exist');
      cy.get('[data-cy=service-row]').should('have.length', 4);
      cy.get('[data-cy=service-row]')
        .first()
        .find('[data-cy=service-status]')
        .i18n('servicesSettings.status.RUNNING.title');
      cy.get('[data-cy=services-search]').should('have.css', 'font-size', '16px');

      cy.get('[data-cy=services-filter-error]').click();
      cy.get('[data-cy=service-row]')
        .should('have.length', 1)
        .and('contain', 'zigbee2mqtt');
      cy.get('[data-cy=services-filter-stopped]').click();
      cy.get('[data-cy=service-row]').should('have.length', 2);
      cy.get('[data-cy=services-filter-all]').click();

      cy.get('[data-cy=services-search]').type('tasm');
      cy.get('[data-cy=service-row]')
        .should('have.length', 1)
        .and('contain', 'tasmota');
      cy.get('[data-cy=services-search]').clear();
      cy.get('[data-cy=services-search]').type('nothing-like-this');
      cy.get('[data-cy=service-row]').should('not.exist');
      cy.get('[data-cy=services-mobile]').i18n('servicesSettings.mobile.noResult');
    });

    it('should stop a service from its sheet', () => {
      cy.visit('/dashboard/settings/service');
      cy.wait('@getServices');
      cy.get('[data-cy=service-row]')
        .first()
        .click();
      cy.get('[data-cy=service-sheet]')
        .should('be.visible')
        .i18n('servicesSettings.status.RUNNING.detail');
      cy.get('[data-cy=service-switch]').should('have.attr', 'aria-checked', 'true');
      cy.get('[data-cy=service-switch]').click();
      cy.wait('@stopMqtt');
      cy.get('[data-cy=service-switch]').should('have.attr', 'aria-checked', 'false');
      cy.get('[data-cy=service-sheet] [data-cy=service-status]').i18n('servicesSettings.status.STOPPED.title');
      cy.get('[data-cy=service-sheet] [data-cy=sheet-close]').click();
      cy.get('[data-cy=service-row]')
        .first()
        .find('[data-cy=service-status]')
        .i18n('servicesSettings.status.STOPPED.title');
    });

    it('should offer no switch for a disabled service, and lead to the integration', () => {
      cy.visit('/dashboard/settings/service');
      cy.wait('@getServices');
      cy.get('[data-cy=service-row]')
        .eq(2)
        .click();
      cy.get('[data-cy=service-sheet]').should('be.visible');
      cy.get('[data-cy=service-switch]').should('not.exist');
      cy.get('[data-cy=service-sheet] [data-cy=sheet-close]').click();

      cy.get('[data-cy=service-row]')
        .eq(3)
        .click();
      cy.get('[data-cy=service-open-integration]').click();
      cy.location('pathname').should('eq', '/dashboard/integration/device/zigbee2mqtt');
    });

    it('should keep the table on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit('/dashboard/settings/service');
      cy.wait('@getServices');
      cy.get('table tbody tr').should('have.length', 4);
      cy.get('[data-cy=services-mobile]').should('not.exist');
    });
  });

  describe('Background jobs', () => {
    const longError = `SequelizeDatabaseError: SQLITE_BUSY: database is locked\n${Array.from(
      { length: 8 },
      (unused, index) =>
        `    at step${index} (/src/server/node_modules/sequelize/lib/dialects/sqlite/query.js:${index}:1)`
    ).join('\n')}`;
    const job = (id, status, minutes, extra = {}) => ({
      id: `cy-job-${id}`,
      type: 'vacuum',
      status,
      progress: 100,
      data: {},
      created_at: jobDate(minutes),
      updated_at: minutesAgo(minutes - 1),
      ...extra
    });
    const firstPage = [
      job(0, 'in-progress', 1, { type: 'gladys-gateway-backup', progress: 42, updated_at: minutesAgo(0) }),
      job(1, 'failed', 30, { data: { error_type: 'unknown-error', error: longError } }),
      job(2, 'failed', 60, { data: { error_type: 'purged-when-restarted' } }),
      ...Array.from({ length: 12 }, (unused, index) => job(index + 3, 'success', 120 + index * 60))
    ];
    const secondPage = [job(15, 'success', 3000), job(16, 'success', 3100)];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/job?*') }, req => {
        req.reply(req.query.skip === '15' ? secondPage : firstPage);
      }).as('getJobs');
    });

    it('should list the jobs as rows with their status, progress and errors', () => {
      cy.visit('/dashboard/settings/jobs');
      cy.wait('@getJobs');
      cy.get('[data-cy=jobs-mobile]').should('exist');
      cy.get('table').should('not.exist');
      cy.get('[data-cy=job-row]').should('have.length', 15);
      cy.get('[data-cy=job-row]')
        .eq(0)
        .i18n('jobsSettings.jobTypes.gladys-gateway-backup');
      cy.get('[data-cy=job-row]')
        .eq(0)
        .find('[data-cy=job-status]')
        .should('contain', '42');
      cy.get('[data-cy=job-row]')
        .eq(0)
        .find('[role=progressbar]')
        .should('have.attr', 'aria-valuenow', '42');
      cy.get('[data-cy=job-row]')
        .eq(1)
        .find('[data-cy=job-status]')
        .i18n('jobsSettings.jobStatuses.failed');
      cy.get('[data-cy=job-row]')
        .eq(2)
        .find('[data-cy=job-error]')
        .i18n('jobsSettings.jobErrors.purged-when-restarted');

      // a long error is folded, and never wider than the screen
      cy.get('[data-cy=job-row]')
        .eq(1)
        .find('[data-cy=job-error]')
        .should('contain', 'SQLITE_BUSY')
        .invoke('outerWidth')
        .should('be.lte', 375);
      cy.get('[data-cy=job-error-toggle]').should('have.attr', 'aria-expanded', 'false');
      cy.get('[data-cy=job-error-toggle]').click();
      cy.get('[data-cy=job-error-toggle]').should('have.attr', 'aria-expanded', 'true');
      // nothing scrolls sideways
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.lte(doc.documentElement.clientWidth));
    });

    it('should go from a page to the other', () => {
      cy.visit('/dashboard/settings/jobs');
      cy.wait('@getJobs');
      cy.get('[data-cy=jobs-previous]').should('be.disabled');
      cy.get('[data-cy=jobs-next]')
        .should('not.be.disabled')
        .invoke('outerHeight')
        .should('be.gte', 44);
      cy.get('[data-cy=jobs-next]').click();
      cy.wait('@getJobs');
      cy.get('[data-cy=job-row]').should('have.length', 2);
      cy.get('[data-cy=jobs-next]').should('be.disabled');
      cy.get('[data-cy=jobs-previous]').click();
      cy.wait('@getJobs');
      cy.get('[data-cy=job-row]').should('have.length', 15);
    });

    it('should keep the table on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit('/dashboard/settings/jobs');
      cy.wait('@getJobs');
      cy.get('table tbody tr').should('have.length', 15);
      cy.get('[data-cy=jobs-mobile]').should('not.exist');
    });
  });

  describe('Backups', () => {
    const backups = [
      { id: 'cy-backup-1', path: 'https://backups.example/gladys-1.enc', size: 123456789, created_at: minutesAgo(600) },
      { id: 'cy-backup-2', path: 'https://backups.example/gladys-2.enc', size: 120000000, created_at: minutesAgo(2040) }
    ];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/gateway/status') }, { body: { configured: true, connected: true } }).as(
        'getStatus'
      );
      cy.intercept({ method: 'GET', url: api('/gateway/backup') }, { body: backups }).as('getBackups');
      cy.intercept(
        { method: 'GET', url: api('/gateway/backup/restore/status') },
        { body: { restore_in_progress: false, restore_errored: false } }
      );
    });

    it('should list the backups as rows and confirm a restoration', () => {
      cy.intercept({ method: 'POST', url: api('/gateway/backup/restore') }, { statusCode: 500, body: {} }).as(
        'restoreBackup'
      );
      cy.visit('/dashboard/settings/backup');
      cy.wait('@getBackups');
      cy.get('[data-cy=backups-mobile]').should('exist');
      cy.get('table').should('not.exist');
      cy.get('[data-cy=backup-row]').should('have.length', 2);

      cy.get('[data-cy=backup-row]')
        .eq(1)
        .click();
      cy.get('[data-cy=backup-restore-confirm]').should('be.visible');
      cy.get('[data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=backup-restore-confirm]').should('not.exist');
      cy.get('@restoreBackup.all').should('have.length', 0);

      cy.get('[data-cy=backup-row]')
        .eq(1)
        .click();
      cy.get('[data-cy=confirm-sheet-confirm]').click();
      cy.wait('@restoreBackup')
        .its('request.body')
        .should('deep.equal', { file_url: 'https://backups.example/gladys-2.enc' });
      // a restoration that does not start says so in the sheet
      cy.get('[data-cy=backup-restore-confirm]').i18n('gatewayBackup.mobile.restoreError');
    });

    it('should start a backup from the primary button', () => {
      cy.intercept({ method: 'POST', url: api('/gateway/backup') }, { body: { success: true } }).as('createBackup');
      cy.visit('/dashboard/settings/backup');
      cy.wait('@getBackups');
      cy.get('[data-cy=backup-now]')
        .invoke('outerHeight')
        .should('be.gte', 44);
      cy.get('[data-cy=backup-now]').click();
      cy.wait('@createBackup');
      cy.get('[data-cy=backup-started]').i18n('gatewayBackup.backupStarted');
      // the backup is a background job: the page leads to it
      cy.location('pathname').should('eq', '/dashboard/settings/jobs');
    });

    it('should keep the table on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit('/dashboard/settings/backup');
      cy.wait('@getBackups');
      cy.get('table tbody tr').should('have.length', 2);
      cy.get('[data-cy=backups-mobile]').should('not.exist');
    });
  });
});
