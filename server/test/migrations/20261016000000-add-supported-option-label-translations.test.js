const { expect } = require('chai');
const Sequelize = require('sequelize');

const db = require('../../models');

const migration = require('../../migrations/20261016000000-add-supported-option-label-translations');

const TABLE = 't_device_feature_supported_option';

const getIndexNames = async () => {
  const [indexes] = await db.sequelize.query(`PRAGMA index_list(\`${TABLE}\`);`);
  return indexes.map((index) => index.name).sort();
};

describe('migration 20261016000000-add-supported-option-label-translations', () => {
  it('should have added a nullable label_translations column', async () => {
    const columns = await db.sequelize.getQueryInterface().describeTable(TABLE);
    expect(columns).to.have.property('label_translations');
    expect(columns.label_translations.allowNull).to.equal(true);
  });

  it('should drop the column on down and add it back on up, keeping the value indexes', async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    const indexesBefore = await getIndexNames();

    await migration.down(queryInterface, Sequelize);
    expect(await queryInterface.describeTable(TABLE)).to.not.have.property('label_translations');
    expect(await getIndexNames()).to.deep.equal(indexesBefore);

    await migration.up(queryInterface, Sequelize);
    expect(await queryInterface.describeTable(TABLE)).to.have.property('label_translations');
    expect(await getIndexNames()).to.deep.equal(indexesBefore);
  });
});
