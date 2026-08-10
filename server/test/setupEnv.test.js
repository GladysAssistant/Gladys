const { expect } = require('chai');

// setup-env.js runs before this file (mocha --require): in parallel mode every
// worker must end up with its own database, backups folder and temp folder,
// even though workers inherit the main mocha process's environment. A shared
// folder lets one worker delete files another one is using (this exact
// regression shipped once: the "set it if unset" pattern kept the main
// process's value in every worker).
describe('test setup-env per-process isolation', () => {
  it('should suffix the database path with this process pid', () => {
    expect(process.env.SQLITE_FILE_PATH).to.include(`-${process.pid}.db`);
  });

  it('should suffix the backups folder with this process pid', () => {
    expect(process.env.BACKUP_FOLDER).to.equal(`${process.env.GLADYS_TEST_BACKUP_FOLDER_ROOT}-${process.pid}`);
  });

  it('should suffix the temp folder with this process pid', () => {
    expect(process.env.TEMP_FOLDER).to.equal(`${process.env.GLADYS_TEST_TEMP_FOLDER_ROOT}-${process.pid}`);
  });
});
